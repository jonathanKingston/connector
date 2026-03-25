/**
 * Graceful shutdown: track in-flight child processes (exec) and abort
 * long-running terminal work when the process receives SIGINT/SIGTERM.
 */

const pendingOperations = new Set<Promise<unknown>>();

const shutdownAbortController = new AbortController();

export function getShutdownAbortSignal(): AbortSignal {
  return shutdownAbortController.signal;
}

/** Signal terminal_exec and other shutdown-aware work to stop; kills child processes via exec() abort handlers. */
export function beginShutdown(): void {
  shutdownAbortController.abort();
}

export function track<T>(promise: Promise<T>): Promise<T> {
  pendingOperations.add(promise);
  return promise.finally(() => pendingOperations.delete(promise));
}

/**
 * Wait until tracked operations settle, or until timeout.
 * New operations may still complete after this returns if they started late;
 * callers should stop accepting work (e.g. close HTTP) before or after as appropriate.
 */
export async function waitForPendingOperations(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (pendingOperations.size > 0) {
    if (Date.now() > deadline) {
      console.warn(
        `Shutdown: ${pendingOperations.size} operation(s) still pending after ${timeoutMs}ms; continuing shutdown.`,
      );
      return;
    }
    await Promise.allSettled([...pendingOperations]);
    await new Promise<void>((r) => setImmediate(r));
  }
}
