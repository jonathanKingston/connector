/**
 * Terminal tools for hosts that expose shell execution (macOS, Linux, Windows).
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  DEFAULT_TERMINAL_TIMEOUT_MS,
  type PlatformAdapter,
} from "../platform/types.js";

const MAX_TERMINAL_TIMEOUT_MS = 600_000;

export function registerTerminalTools(
  server: McpServer,
  platform: PlatformAdapter,
): void {
  server.tool(
    "terminal_exec",
    "Execute a shell command on the host: bash with set -euo pipefail on macOS/Linux, Windows PowerShell with strict errors on win32. Available when the platform adapter exposes terminal capability.",
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
