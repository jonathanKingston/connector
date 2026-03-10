/**
 * Promise-wrapped child_process.execFile with timeout and structured errors.
 */

import { execFile as nodeExecFile } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 10_000;

export class ExecError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly args: readonly string[],
    public readonly exitCode: number | null,
    public readonly stderr: string,
    public readonly stdout: string,
  ) {
    super(message);
    this.name = "ExecError";
  }
}

export interface ExecResult {
  stdout: string;
  stderr: string;
}

/**
 * Execute a command and return its stdout/stderr.
 * Throws ExecError on non-zero exit, timeout, or signal.
 */
export function exec(
  command: string,
  args: readonly string[] = [],
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = nodeExecFile(
      command,
      args,
      {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10 MB
        encoding: "utf-8",
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new ExecError(
              error.message,
              command,
              args,
              "code" in error ? (error.code as unknown as number) : null,
              stderr,
              stdout,
            ),
          );
          return;
        }
        resolve({ stdout, stderr });
      },
    );

    // Safety: if the child process somehow hangs beyond the timeout,
    // Node's built-in timeout handling will kill it. This is just a belt.
    child.unref?.();
  });
}
