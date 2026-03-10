/**
 * Application and window management tools.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerApplicationTools(
  server: McpServer,
  platform: PlatformAdapter,
): void {
  // ── list_applications ───────────────────────────────────────────────────
  server.tool(
    "list_applications",
    "List all running foreground applications. Returns name, bundle ID, PID, and whether each app is currently active (frontmost). Use the PID for accessibility and menu tools.",
    async () => {
      const apps = await platform.listApplications();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(apps, null, 2),
          },
        ],
      };
    },
  );

  // ── list_windows ────────────────────────────────────────────────────────
  server.tool(
    "list_windows",
    "List all open windows across all applications. Returns window title, owning application, position, size, and minimized/fullscreen state.",
    async () => {
      const windows = await platform.listWindows();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(windows, null, 2),
          },
        ],
      };
    },
  );

  // ── activate_application ────────────────────────────────────────────────
  server.tool(
    "activate_application",
    "Bring an application to the foreground. You can specify the app by its name (e.g. \"Safari\") or bundle ID (e.g. \"com.apple.Safari\").",
    {
      target: z
        .string()
        .min(1)
        .describe(
          'Application name (e.g. "Safari") or bundle ID (e.g. "com.apple.Safari")',
        ),
    },
    async ({ target }) => {
      await platform.activateApplication(target);
      return {
        content: [
          {
            type: "text" as const,
            text: `Activated application: ${target}`,
          },
        ],
      };
    },
  );
}
