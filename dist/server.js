/**
 * MCP server creation — instantiates McpServer, detects platform, registers tools.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createPlatformAdapter } from "./platform/factory.js";
import { registerTools } from "./tools/index.js";
/**
 * Create a fully configured Connector MCP server with all tools registered.
 */
export async function createConnectorServer() {
    const platform = await createPlatformAdapter();
    const mcpServer = new McpServer({
        name: "Connector",
        version: "0.1.0",
    });
    registerTools(mcpServer, platform);
    return { mcpServer, platform };
}
//# sourceMappingURL=server.js.map