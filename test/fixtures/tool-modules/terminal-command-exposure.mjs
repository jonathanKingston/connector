import { z } from "zod";

const ALLOWED_COMMANDS = new Set(["echo", "uname"]);

function shellEscape(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildShellCommand(command, directory) {
  const [binary, ...args] = command;
  if (!ALLOWED_COMMANDS.has(binary)) {
    throw new Error(`Command not allowed: ${binary}`);
  }

  const escapedCommand = [binary, ...args].map(shellEscape).join(" ");
  if (!directory) {
    return escapedCommand;
  }

  return `cd ${shellEscape(directory)} && ${escapedCommand}`;
}

export function registerTools(server, platform) {
  if (!platform.capabilities.terminal) {
    return;
  }

  server.tool(
    "shell_command_exec",
    "Fixture shell command exposure tool",
    {
      command: z.array(z.string().min(1)).min(1),
      directory: z.string().min(1).optional(),
      timeoutSec: z.number().int().positive().max(600).default(60),
    },
    async ({ command, directory, timeoutSec }) => {
      const shellCommand = buildShellCommand(command, directory);
      const result = await platform.terminalExec({
        command: shellCommand,
        timeoutMs: timeoutSec * 1000,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
