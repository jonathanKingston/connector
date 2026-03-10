/**
 * Promise-wrapped child_process.execFile with timeout and structured errors.
 */
import { execFile as nodeExecFile } from "node:child_process";
const DEFAULT_TIMEOUT_MS = 10_000;
export class ExecError extends Error {
    command;
    args;
    exitCode;
    stderr;
    stdout;
    constructor(message, command, args, exitCode, stderr, stdout) {
        super(message);
        this.command = command;
        this.args = args;
        this.exitCode = exitCode;
        this.stderr = stderr;
        this.stdout = stdout;
        this.name = "ExecError";
    }
}
/**
 * Execute a command and return its stdout/stderr.
 * Throws ExecError on non-zero exit, timeout, or signal.
 */
export function exec(command, args = [], timeoutMs = DEFAULT_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        const child = nodeExecFile(command, args, {
            timeout: timeoutMs,
            maxBuffer: 10 * 1024 * 1024, // 10 MB
            encoding: "utf-8",
        }, (error, stdout, stderr) => {
            if (error) {
                reject(new ExecError(error.message, command, args, "code" in error ? error.code : null, stderr, stdout));
                return;
            }
            resolve({ stdout, stderr });
        });
        // Safety: if the child process somehow hangs beyond the timeout,
        // Node's built-in timeout handling will kill it. This is just a belt.
        child.unref?.();
    });
}
//# sourceMappingURL=exec.js.map