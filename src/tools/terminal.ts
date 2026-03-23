/**
 * Terminal tools for headless Linux environments.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

const DEFAULT_TERMINAL_TIMEOUT_MS = 60_000;
const MAX_TERMINAL_TIMEOUT_MS = 600_000;

export function registerTerminalTools(
  server: McpServer,
  platform: PlatformAdapter,
): void {
  server.tool(
    "terminal_exec",
    "Execute a shell command on the host machine via bash (set -euo pipefail). Available on macOS and Linux terminal-capable adapters.",
    {
      command: z.string().min(1).describe("Shell command to execute"),
      timeoutMs: z
        .number()
        .int()
        .positive()
        .max(MAX_TERMINAL_TIMEOUT_MS)
        .default(DEFAULT_TERMINAL_TIMEOUT_MS)
        .describe(
          `Timeout in milliseconds (default ${DEFAULT_TERMINAL_TIMEOUT_MS}, max ${MAX_TERMINAL_TIMEOUT_MS})`,
        ),
    },
    async ({ command, timeoutMs }) => {
      const result = await platform.terminalExec({ command, timeoutMs });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
