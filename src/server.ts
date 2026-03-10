/**
 * MCP server creation — detects platform once, creates new McpServer per session.
 *
 * Each MCP session needs its own McpServer instance because McpServer.connect()
 * binds exclusively to one transport. The platform adapter is shared across all
 * sessions since it's stateless OS-level operations.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createPlatformAdapter } from "./platform/factory.js";
import { registerTools } from "./tools/index.js";
import type { PlatformAdapter } from "./platform/types.js";

/**
 * Factory that creates configured McpServer instances on demand.
 * Call createServer() for each new session/transport connection.
 */
export interface ServerFactory {
  /** The shared platform adapter (detected once at startup). */
  platform: PlatformAdapter;
  /** Create a new McpServer with all tools registered — one per session. */
  createServer(): McpServer;
}

/**
 * Initialize the platform adapter and return a factory for creating
 * per-session McpServer instances.
 */
export async function createServerFactory(): Promise<ServerFactory> {
  const platform = await createPlatformAdapter();

  return {
    platform,
    createServer() {
      const mcpServer = new McpServer({
        name: "Connector",
        version: "0.1.0",
      });
      registerTools(mcpServer, platform);
      return mcpServer;
    },
  };
}
