/**
 * Connector MCP Server — entry point.
 *
 * Sets up Express with:
 * - Auth middleware (Bearer token password authentication)
 * - Streamable HTTP transport for MCP protocol
 * - Session management for persistent connections
 */

import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { Request, Response, NextFunction } from "express";

import { loadConfig } from "./config.js";
import { createConnectorServer } from "./server.js";
import { PasswordAuthProvider } from "./auth/password.js";
import type { AuthProvider } from "./auth/types.js";

// ── Load configuration (fails fast on missing required values) ──────────

const config = loadConfig();

// ── Auth middleware ──────────────────────────────────────────────────────

function createAuthMiddleware(authProvider: AuthProvider) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authenticated = await authProvider.authenticate({
      headers: req.headers as Record<string, string | string[] | undefined>,
    });

    if (!authenticated) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Unauthorized",
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
  const { mcpServer } = await createConnectorServer();
  const authProvider = new PasswordAuthProvider(config.password);
  const authMiddleware = createAuthMiddleware(authProvider);

  const app = createMcpExpressApp({ host: config.host });

  // Session management: map session IDs to their transports
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  // ── POST /mcp — main MCP request handler ────────────────────────────

  app.post("/mcp", authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (sessionId && transports[sessionId]) {
        // Existing session — route to its transport
        await transports[sessionId].handleRequest(req, res, req.body);
        return;
      }

      if (!sessionId && isInitializeRequest(req.body)) {
        // New session initialization
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

  app.get("/mcp", authMiddleware, async (req: Request, res: Response): Promise<void> => {
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

  app.delete("/mcp", authMiddleware, async (req: Request, res: Response): Promise<void> => {
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

  // ── Start listening ─────────────────────────────────────────────────

  app.listen(config.port, config.host, () => {
    console.log(
      `Connector MCP server listening on http://${config.host}:${config.port}/mcp`,
    );
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
