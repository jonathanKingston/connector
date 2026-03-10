/**
 * Promise-wrapped child_process.execFile with timeout and structured errors.
 */
export declare class ExecError extends Error {
    readonly command: string;
    readonly args: readonly string[];
    readonly exitCode: number | null;
    readonly stderr: string;
    readonly stdout: string;
    constructor(message: string, command: string, args: readonly string[], exitCode: number | null, stderr: string, stdout: string);
}
export interface ExecResult {
    stdout: string;
    stderr: string;
}
/**
 * Execute a command and return its stdout/stderr.
 * Throws ExecError on non-zero exit, timeout, or signal.
 */
export declare function exec(command: string, args?: readonly string[], timeoutMs?: number): Promise<ExecResult>;
//# sourceMappingURL=exec.d.ts.map