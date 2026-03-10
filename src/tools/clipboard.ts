/**
 * Clipboard tools — read and write system clipboard contents.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerClipboardTools(server: McpServer, platform: PlatformAdapter): void {
  server.tool(
    "get_clipboard",
    "Read the current clipboard contents. Returns text and optionally image data if the clipboard contains an image.",
    {},
    async () => {
      const contents = await platform.getClipboard();
      const result: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [];

      if (contents.text !== null) {
        result.push({ type: "text" as const, text: contents.text });
      } else {
        result.push({ type: "text" as const, text: "(clipboard is empty or contains no text)" });
      }

      if (contents.hasImage && contents.imageData) {
        result.push({ type: "image" as const, data: contents.imageData, mimeType: "image/png" });
      }

      return { content: result };
    },
  );

  server.tool(
    "set_clipboard",
    "Set the clipboard contents to the given text.",
    {
      text: z.string().describe("The text to copy to the clipboard"),
    },
    async ({ text }) => {
      await platform.setClipboard({ text, hasImage: false, imageData: null });
      return {
        content: [{ type: "text" as const, text: `Copied ${text.length} character(s) to clipboard` }],
      };
    },
  );
}
