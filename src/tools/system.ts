/**
 * System info and health check tools.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerSystemTools(server: McpServer, platform: PlatformAdapter): void {
  server.tool(
    "get_system_info",
    "Get system information including OS version, hostname, screen resolution, battery state, and whether the screen is locked.",
    {},
    async () => {
      const info = await platform.getSystemInfo();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(info, null, 2) }],
      };
    },
  );

  server.tool(
    "health_check",
    "Lightweight health check to confirm the server is responsive. Returns status and latency.",
    {},
    async () => {
      const result = await platform.healthCheck();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
