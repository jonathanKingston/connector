/**
 * wait tools — poll for UI elements or windows to appear.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerWaitTools(server: McpServer, platform: PlatformAdapter): void {
  server.tool(
    "wait_for_element",
    "Wait until a UI element matching the given criteria appears in the accessibility tree of the specified application. Returns the element if found, or null if the timeout is reached.",
    {
      pid: z.number().describe("Process ID of the application"),
      role: z.string().optional().describe("Accessibility role to match (e.g. 'AXButton', 'AXTextField')"),
      titleContains: z.string().optional().describe("Substring to match in the element title"),
      valueContains: z.string().optional().describe("Substring to match in the element value"),
      timeout: z.number().default(10000).describe("Maximum time to wait in milliseconds"),
      interval: z.number().default(500).describe("Polling interval in milliseconds"),
    },
    async ({ pid, role, titleContains, valueContains, timeout, interval }) => {
      const element = await platform.waitForElement({ pid, role, titleContains, valueContains, timeout, interval });
      if (element) {
        return { content: [{ type: "text" as const, text: JSON.stringify(element, null, 2) }] };
      }
      return { content: [{ type: "text" as const, text: "Timed out waiting for element" }] };
    },
  );

  server.tool(
    "wait_for_window",
    "Wait until a window with a title containing the given substring appears. Returns the window info if found, or null if timeout.",
    {
      titleContains: z.string().describe("Substring to match in window title"),
      timeout: z.number().default(10000).describe("Maximum time to wait in milliseconds"),
      interval: z.number().default(500).describe("Polling interval in milliseconds"),
    },
    async ({ titleContains, timeout, interval }) => {
      const window = await platform.waitForWindow({ titleContains, timeout, interval });
      if (window) {
        return { content: [{ type: "text" as const, text: JSON.stringify(window, null, 2) }] };
      }
      return { content: [{ type: "text" as const, text: "Timed out waiting for window" }] };
    },
  );
}
