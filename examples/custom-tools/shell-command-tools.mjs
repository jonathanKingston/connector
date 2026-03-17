import { z } from "zod";

const DEFAULT_TIMEOUT_SECONDS = 60;
const MAX_TIMEOUT_SECONDS = 600;

function parseAllowedCommandsFromEnv() {
  const raw = process.env.ALLOW_COMMANDS ?? process.env.ALLOWED_COMMANDS ?? "";
  const allowed = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (allowed.length === 0) {
    throw new Error(
      "shell-command-tools requires ALLOW_COMMANDS (or ALLOWED_COMMANDS) " +
        "to be set with a comma-separated allow-list, e.g. ALLOW_COMMANDS=ls,cat,echo",
    );
  }

  return new Set(allowed);
}

function shellEscape(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildShellCommand(command, directory, allowedCommands) {
  const [binary, ...args] = command;
  if (!allowedCommands.has(binary)) {
    throw new Error(`Command not allowed: ${binary}`);
  }

  const escapedCommand = [binary, ...args].map(shellEscape).join(" ");
  if (!directory) {
    return escapedCommand;
  }

  return `cd ${shellEscape(directory)} && ${escapedCommand}`;
}

/**
 * mcp-shell-server style command tool:
 * - command is passed as argv array
 * - first token must match ALLOW_COMMANDS allow-list
 * - optional working directory and timeout
 */
export function registerTools(server, platform) {
  if (!platform.capabilities.terminal) {
    return;
  }

  const allowedCommands = parseAllowedCommandsFromEnv();

  server.tool(
    "shell_command",
    "Execute an allow-listed shell command (mcp-shell-server style argv input).",
    {
      command: z
        .array(z.string().min(1))
        .min(1)
        .describe('Command argv array, e.g. ["ls", "-la", "/tmp"]'),
      directory: z
        .string()
        .min(1)
        .optional()
        .describe("Optional working directory to run command in"),
      timeout: z
        .number()
        .int()
        .positive()
        .max(MAX_TIMEOUT_SECONDS)
        .default(DEFAULT_TIMEOUT_SECONDS)
        .describe(
          `Timeout in seconds (default ${DEFAULT_TIMEOUT_SECONDS}, max ${MAX_TIMEOUT_SECONDS})`,
        ),
    },
    async ({ command, directory, timeout }) => {
      const shellCommand = buildShellCommand(command, directory, allowedCommands);
      const result = await platform.terminalExec({
        command: shellCommand,
        timeoutMs: timeout * 1000,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
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
