/**
 * MCP server creation — instantiates McpServer, detects platform, registers tools.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createPlatformAdapter } from "./platform/factory.js";
import { registerTools } from "./tools/index.js";
import type { PlatformAdapter } from "./platform/types.js";

export interface ConnectorServer {
  mcpServer: McpServer;
  platform: PlatformAdapter;
}

/**
 * Create a fully configured Connector MCP server with all tools registered.
 */
export async function createConnectorServer(): Promise<ConnectorServer> {
  const platform = await createPlatformAdapter();

  const mcpServer = new McpServer({
    name: "Connector",
    version: "0.1.0",
  });

  registerTools(mcpServer, platform);

  return { mcpServer, platform };
}
