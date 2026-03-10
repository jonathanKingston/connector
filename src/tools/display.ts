/**
 * display tools — list connected displays and their properties.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerDisplayTools(server: McpServer, platform: PlatformAdapter): void {
  server.tool(
    "list_displays",
    "List all connected displays with their resolution, scaling factor, position, and whether they are the main display. Use this to discover display IDs for the screenshot tool.",
    {},
    async () => {
      const displays = await platform.listDisplays();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(displays, null, 2) }],
      };
    },
  );
}
