/**
 * OCR tool — extracts text from the screen using optical character recognition.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerOcrTools(
  server: McpServer,
  platform: PlatformAdapter,
): void {
  server.tool(
    "extract_text",
    "Extract text from the screen using OCR (Optical Character Recognition). Can extract text from a specific region or the full screen. Uses the macOS Vision framework for accurate text recognition.",
    {
      displayId: z.number().optional().describe("Display ID to capture from"),
      regionX: z.number().optional().describe("X coordinate of region"),
      regionY: z.number().optional().describe("Y coordinate of region"),
      regionWidth: z.number().optional().describe("Width of region"),
      regionHeight: z.number().optional().describe("Height of region"),
      languages: z.array(z.string()).optional().describe("Recognition languages (e.g. ['en-US'])"),
    },
    async ({ displayId, regionX, regionY, regionWidth, regionHeight, languages }) => {
      const region =
        regionX !== undefined &&
        regionY !== undefined &&
        regionWidth !== undefined &&
        regionHeight !== undefined
          ? { x: regionX, y: regionY, width: regionWidth, height: regionHeight }
          : undefined;

      const results = await platform.extractText({ displayId, region, languages });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
      };
    },
  );
}
