/**
 * run_command tool — execute a shell command and return stdout/stderr/exit code.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerCommandTools(server: McpServer, platform: PlatformAdapter): void {
  server.tool(
    "run_command",
    "Execute a command on the system and return stdout, stderr, and exit code. The command is executed directly (not through a shell) for security.",
    {
      command: z.string().describe("The command to execute (e.g. 'ls', 'cat', 'grep')"),
      args: z.array(z.string()).default([]).describe("Command arguments"),
      cwd: z.string().optional().describe("Working directory for the command"),
      timeout: z.number().optional().describe("Timeout in milliseconds (default: 30000)"),
    },
    async ({ command, args, cwd, timeout }) => {
      const options: { cwd?: string; timeout?: number } = {};
      if (cwd) options.cwd = cwd;
      if (timeout) options.timeout = timeout;

      const result = await platform.runCommand(command, args, options);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            exitCode: result.exitCode,
            timedOut: result.timedOut,
            stdout: result.stdout,
            stderr: result.stderr,
          }, null, 2),
        }],
      };
    },
  );
}
