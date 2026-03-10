/**
 * MCP server creation — instantiates McpServer, detects platform, registers tools.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "./platform/types.js";
export interface ConnectorServer {
    mcpServer: McpServer;
    platform: PlatformAdapter;
}
/**
 * Create a fully configured Connector MCP server with all tools registered.
 */
export declare function createConnectorServer(): Promise<ConnectorServer>;
//# sourceMappingURL=server.d.ts.map