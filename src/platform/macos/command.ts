/**
 * Shell command execution for macOS — runs commands directly via execFile.
 */

import { execFile } from "node:child_process";
import type { CommandResult, CommandOptions } from "../types.js";

const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB
const DEFAULT_TIMEOUT = 30_000; // 30s

export async function runCommand(
  command: string,
  args: string[] = [],
  options: CommandOptions = {},
): Promise<CommandResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  return new Promise((resolve) => {
    const child = execFile(
      command,
      args,
      {
        cwd: options.cwd,
        timeout,
        maxBuffer: MAX_OUTPUT_SIZE,
        encoding: "utf-8",
        env: options.env ? { ...process.env, ...options.env } : undefined,
      },
      (error, stdout, stderr) => {
        if (error && "killed" in error && error.killed) {
          resolve({ stdout: stdout || "", stderr: stderr || "", exitCode: -1, timedOut: true });
          return;
        }
        const exitCode = error && "code" in error ? (error.code as unknown as number) ?? 1 : 0;
        resolve({ stdout: stdout || "", stderr: stderr || "", exitCode, timedOut: false });
      },
    );
    child.unref?.();
  });
}
