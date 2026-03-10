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
    "Capture a screenshot of the screen. Returns a PNG image. Optionally specify a display ID for multi-monitor setups. Optionally specify a region to capture only part of the screen.",
    {
      displayId: z.number().int().positive().optional().describe(
        "Display ID to capture. Omit for the main display.",
      ),
      regionX: z.number().optional().describe("X coordinate of region to capture"),
      regionY: z.number().optional().describe("Y coordinate of region to capture"),
      regionWidth: z.number().optional().describe("Width of region to capture"),
      regionHeight: z.number().optional().describe("Height of region to capture"),
    },
    async ({ displayId, regionX, regionY, regionWidth, regionHeight }) => {
      const region = (regionX !== undefined && regionY !== undefined && regionWidth !== undefined && regionHeight !== undefined)
        ? { x: regionX, y: regionY, width: regionWidth, height: regionHeight }
        : undefined;
      const result = await platform.captureScreen(displayId, region);
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
