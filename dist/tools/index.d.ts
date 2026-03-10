/**
 * Tool registration aggregator — registers all tools on an McpServer instance.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";
/**
 * Register all Connector tools on the given MCP server.
 * Each tool delegates to the platform adapter for OS-specific implementation.
 */
export declare function registerTools(server: McpServer, platform: PlatformAdapter): void;
//# sourceMappingURL=index.d.ts.map