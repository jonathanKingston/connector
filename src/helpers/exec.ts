/**
 * Promise-wrapped child_process.execFile with timeout and structured errors.
 */

import { execFile as nodeExecFile } from "node:child_process";

import { track } from "../shutdown.js";

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

export interface ExecOptions {
  /** When aborted, the child process is sent SIGTERM (e.g. graceful shutdown). */
  signal?: AbortSignal;
}

/**
 * Execute a command and return its stdout/stderr.
 * Throws ExecError on non-zero exit, timeout, or signal.
 */
export function exec(
  command: string,
  args: readonly string[] = [],
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  options?: ExecOptions,
): Promise<ExecResult> {
  if (options?.signal?.aborted) {
    return Promise.reject(
      new ExecError("Aborted", command, args, null, "", ""),
    );
  }

  return track(
    new Promise((resolve, reject) => {
      const child = nodeExecFile(
        command,
        args,
        {
          timeout: timeoutMs,
          maxBuffer: 10 * 1024 * 1024, // 10 MB
          encoding: "utf-8",
        },
        (error, stdout, stderr) => {
          cleanup();
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

      const onAbort = (): void => {
        try {
          child.kill("SIGTERM");
        } catch {
          // ignore
        }
      };

      if (options?.signal) {
        options.signal.addEventListener("abort", onAbort, { once: true });
      }

      function cleanup(): void {
        options?.signal?.removeEventListener("abort", onAbort);
      }
    }),
  );
}
