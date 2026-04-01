/**
 * Connector MCP Server — entry point.
 *
 * Sets up Express with:
 * - Optional auth middleware (Bearer token, enabled via CONNECTOR_PASSWORD)
 * - Streamable HTTP transport for MCP protocol
 * - Per-session McpServer instances (each session gets its own server+transport)
 */

import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { Request, Response, NextFunction } from "express";

import { loadConfig } from "./config.js";
import { createServerFactory } from "./server.js";
import { PasswordAuthProvider } from "./auth/password.js";
import type { AuthProvider } from "./auth/types.js";

// ── Load configuration ──────────────────────────────────────────────────

const config = loadConfig();

// ── Auth middleware ──────────────────────────────────────────────────────

function createAuthMiddleware(authProvider: AuthProvider) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authenticated = await authProvider.authenticate({
      headers: req.headers as Record<string, string | string[] | undefined>,
    });

    if (!authenticated) {
      // Use 403 (Forbidden), NOT 401. In the MCP spec, 401 means "start OAuth flow"
      // which causes clients like Cursor to attempt OAuth discovery/registration.
      // 403 means "your credentials are wrong" without triggering OAuth.
      res.status(403).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Forbidden: invalid or missing Bearer token",
        },
        id: null,
      });
      return;
    }

    next();
  };
}

// ── Start server ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const factory = await createServerFactory({
    externalToolModules: config.toolModules,
  });

  const app = createMcpExpressApp({ host: config.host });

  // Session management: map session IDs to their transports
  const transports: Record<string, StreamableHTTPServerTransport> = {};
  /** Blocks concurrent initialize while the first request is still creating a session. */
  let pendingInitialize = false;

  // ── Apply auth middleware to /mcp if password is configured ──────────

  if (config.password) {
    const authMiddleware = createAuthMiddleware(
      new PasswordAuthProvider(config.password),
    );
    app.use("/mcp", authMiddleware);
  } else {
    console.warn(
      "WARNING: No CONNECTOR_PASSWORD set — server is running WITHOUT authentication. " +
        "Set CONNECTOR_PASSWORD to require Bearer token auth.",
    );
  }

  // ── POST /mcp — main MCP request handler ────────────────────────────

  app.post("/mcp", async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (sessionId && transports[sessionId]) {
        // Existing session — route to its transport
        await transports[sessionId].handleRequest(req, res, req.body);
        return;
      }

      if (!sessionId && isInitializeRequest(req.body)) {
        if (!config.allowMultipleClients) {
          if (
            Object.keys(transports).length > 0 ||
            pendingInitialize
          ) {
            res.status(503).json({
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message:
                  "Service Unavailable: Connector already has an active MCP session. " +
                  "Disconnect the other client or set CONNECTOR_ALLOW_MULTIPLE_CLIENTS=1.",
              },
              id: null,
            });
            return;
          }
          pendingInitialize = true;
        }

        try {
          // New session — create a fresh McpServer + transport pair.
          // Each session gets its own McpServer because connect() binds
          // exclusively to one transport.
          const mcpServer = factory.createServer();

          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (newSessionId: string) => {
              transports[newSessionId] = transport;
            },
          });

          transport.onclose = () => {
            const sid = transport.sessionId;
            if (sid && transports[sid]) {
              delete transports[sid];
            }
          };

          await mcpServer.connect(transport);
          await transport.handleRequest(req, res, req.body);
        } finally {
          if (!config.allowMultipleClients) {
            pendingInitialize = false;
          }
        }
        return;
      }

      // Invalid request
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
    } catch (error) {
      console.error("Error handling MCP POST request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  // ── GET /mcp — SSE stream for server-to-client notifications ────────

  app.get("/mcp", async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid or missing session ID",
        },
        id: null,
      });
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  // ── DELETE /mcp — session termination ───────────────────────────────

  app.delete("/mcp", async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid or missing session ID",
        },
        id: null,
      });
      return;
    }
    try {
      await transports[sessionId].handleRequest(req, res);
    } catch (error) {
      console.error("Error handling session termination:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  // ── Catch-all: return JSON 404 for unknown routes ────────────────────
  // Express returns HTML 404s by default, which breaks MCP clients that
  // expect JSON (e.g. Cursor's OAuth discovery probes to /register).
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Not Found",
      },
      id: null,
    });
  });

  // ── Start listening ─────────────────────────────────────────────────

  app.listen(config.port, config.host, () => {
    console.log(
      `Connector MCP server listening on http://${config.host}:${config.port}/mcp`,
    );
    if (config.password) {
      console.log("Authentication: Bearer token required");
    } else {
      console.log("Authentication: DISABLED (no CONNECTOR_PASSWORD set)");
    }
    if (config.toolModules.length > 0) {
      console.log(
        `External tool modules loaded: ${config.toolModules.join(", ")}`,
      );
    }
    if (config.allowMultipleClients) {
      console.log("Sessions: multiple concurrent clients allowed");
    } else {
      console.log(
        "Sessions: single client only (set CONNECTOR_ALLOW_MULTIPLE_CLIENTS=1 to allow more)",
      );
    }
  });

  // ── Graceful shutdown ───────────────────────────────────────────────

  const shutdown = async () => {
    console.log("Shutting down Connector...");
    for (const sessionId of Object.keys(transports)) {
      try {
        await transports[sessionId].close();
        delete transports[sessionId];
      } catch (error) {
        console.error(`Error closing session ${sessionId}:`, error);
      }
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Fatal error starting Connector:", error);
  process.exit(1);
});
