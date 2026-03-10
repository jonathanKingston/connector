/**
 * Window management tools — move, resize, minimize, and fullscreen.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerWindowTools(
  server: McpServer,
  platform: PlatformAdapter,
): void {
  // ── move_window ────────────────────────────────────────────────────────
  server.tool(
    "move_window",
    "Move a window to a new position on screen. Specify the target process by PID and window by index (0-based).",
    {
      pid: z.number().int().describe("Process ID of the application owning the window"),
      windowIndex: z.number().int().min(0).describe("Zero-based index of the window within the process"),
      x: z.number().int().describe("New X coordinate (pixels from left edge of screen)"),
      y: z.number().int().describe("New Y coordinate (pixels from top edge of screen)"),
    },
    async ({ pid, windowIndex, x, y }) => {
      await platform.moveWindow(pid, windowIndex, x, y);
      return {
        content: [
          {
            type: "text" as const,
            text: `Moved window ${windowIndex} of PID ${pid} to (${x}, ${y})`,
          },
        ],
      };
    },
  );

  // ── resize_window ──────────────────────────────────────────────────────
  server.tool(
    "resize_window",
    "Resize a window. Specify the target process by PID and window by index (0-based).",
    {
      pid: z.number().int().describe("Process ID of the application owning the window"),
      windowIndex: z.number().int().min(0).describe("Zero-based index of the window within the process"),
      width: z.number().int().min(1).describe("New width in pixels"),
      height: z.number().int().min(1).describe("New height in pixels"),
    },
    async ({ pid, windowIndex, width, height }) => {
      await platform.resizeWindow(pid, windowIndex, width, height);
      return {
        content: [
          {
            type: "text" as const,
            text: `Resized window ${windowIndex} of PID ${pid} to ${width}x${height}`,
          },
        ],
      };
    },
  );

  // ── minimize_window ────────────────────────────────────────────────────
  server.tool(
    "minimize_window",
    "Minimize or restore a window. Specify the target process by PID and window by index (0-based).",
    {
      pid: z.number().int().describe("Process ID of the application owning the window"),
      windowIndex: z.number().int().min(0).describe("Zero-based index of the window within the process"),
      minimize: z.boolean().describe("True to minimize, false to restore"),
    },
    async ({ pid, windowIndex, minimize }) => {
      await platform.minimizeWindow(pid, windowIndex, minimize);
      return {
        content: [
          {
            type: "text" as const,
            text: `${minimize ? "Minimized" : "Restored"} window ${windowIndex} of PID ${pid}`,
          },
        ],
      };
    },
  );

  // ── set_fullscreen ─────────────────────────────────────────────────────
  server.tool(
    "set_fullscreen",
    "Enter or exit fullscreen mode for a window. Specify the target process by PID and window by index (0-based).",
    {
      pid: z.number().int().describe("Process ID of the application owning the window"),
      windowIndex: z.number().int().min(0).describe("Zero-based index of the window within the process"),
      fullscreen: z.boolean().describe("True to enter fullscreen, false to exit"),
    },
    async ({ pid, windowIndex, fullscreen }) => {
      await platform.setFullscreen(pid, windowIndex, fullscreen);
      return {
        content: [
          {
            type: "text" as const,
            text: `${fullscreen ? "Entered" : "Exited"} fullscreen for window ${windowIndex} of PID ${pid}`,
          },
        ],
      };
    },
  );
}
