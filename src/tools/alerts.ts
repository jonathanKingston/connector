/**
 * Alert and notification detection tools.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerAlertTools(
  server: McpServer,
  platform: PlatformAdapter,
): void {
  // ── get_alerts ─────────────────────────────────────────────────────────
  server.tool(
    "get_alerts",
    "Detect any currently visible alert dialogs, sheets, or modal windows across all applications. Returns button labels so you can dismiss them programmatically.",
    {},
    async () => {
      const alerts = await platform.getAlerts();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(alerts, null, 2),
          },
        ],
      };
    },
  );

  // ── get_notifications ──────────────────────────────────────────────────
  server.tool(
    "get_notifications",
    "Get recent macOS notification center items.",
    {},
    async () => {
      const notifications = await platform.getNotifications();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(notifications, null, 2),
          },
        ],
      };
    },
  );
}
