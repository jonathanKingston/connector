/**
 * screenshot tool — captures the screen and returns a base64-encoded PNG image.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerScreenshotTool(
  server: McpServer,
  platform: PlatformAdapter,
): void {
  server.tool(
    "screenshot",
    "Capture a screenshot of the screen. Returns a PNG image. Optionally specify a display ID for multi-monitor setups.",
    {
      displayId: z.number().int().positive().optional().describe(
        "Display ID to capture. Omit for the main display.",
      ),
    },
    async ({ displayId }) => {
      const result = await platform.captureScreen(displayId);
      return {
        content: [
          {
            type: "image" as const,
            data: result.data,
            mimeType: result.mimeType,
          },
          {
            type: "text" as const,
            text: `Screenshot captured: ${result.width}x${result.height} pixels`,
          },
        ],
      };
    },
  );
}
