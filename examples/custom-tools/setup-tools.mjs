import { z } from "zod";

/**
 * Example setup-specific tools loaded via CONNECTOR_TOOL_MODULES.
 * Export either `registerTools` or a default function.
 */
export function registerTools(server, platform) {
  if (!platform.capabilities.terminal) {
    return;
  }

  server.tool(
    "setup_health_check",
    "Run a lightweight setup-specific health check command.",
    {
      command: z
        .string()
        .min(1)
        .default("uname -a && whoami")
        .describe("Health check command to execute"),
    },
    async ({ command }) => {
      const result = await platform.terminalExec({ command, timeoutMs: 20_000 });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: result.stderr.length === 0,
                stdout: result.stdout,
                stderr: result.stderr,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
