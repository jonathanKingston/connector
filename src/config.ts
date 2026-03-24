/**
 * Server configuration — read from environment variables.
 * Fails fast if required values are invalid.
 */

import { parseConnectorToolsEnv, type ToolGroup } from "./tool-groups.js";

export type { ToolGroup };

export interface Config {
  /** Port to listen on */
  port: number;
  /** Host/IP to bind to */
  host: string;
  /** Password for Bearer token authentication. Undefined = no auth. */
  password: string | undefined;
  /** Optional external modules that register setup-specific tools. */
  toolModules: string[];
  /**
   * Which built-in tool groups to expose. Empty = none (opt-in).
   * Env token `all` expands to every group except `terminal`.
   */
  enabledToolGroups: Set<ToolGroup>;
  /**
   * Drop MCP sessions with no HTTP activity for this long (ms).
   * `0` disables idle eviction (only `transport.onclose` removes sessions).
   */
  sessionIdleTtlMs: number;
}

/** Parse `CONNECTOR_SESSION_IDLE_MS` — default 24h; `0` = no idle TTL sweep. */
export function parseSessionIdleTtlMs(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") {
    return 86_400_000;
  }
  const parsed = parseInt(raw.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      `CONNECTOR_SESSION_IDLE_MS must be a non-negative integer (milliseconds), got: "${raw}"`,
    );
  }
  return parsed;
}

export function loadConfig(): Config {
  const password = process.env.CONNECTOR_PASSWORD || undefined;
  const toolModules = (process.env.CONNECTOR_TOOL_MODULES ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const enabledToolGroups = parseConnectorToolsEnv(process.env.CONNECTOR_TOOLS);

  const portStr = process.env.CONNECTOR_PORT;
  const port = portStr ? parseInt(portStr, 10) : 3100;
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(
      `CONNECTOR_PORT must be a valid port number (1-65535), got: "${portStr}"`,
    );
  }

  const host = process.env.CONNECTOR_HOST ?? "0.0.0.0";

  const sessionIdleTtlMs = parseSessionIdleTtlMs(
    process.env.CONNECTOR_SESSION_IDLE_MS,
  );

  return {
    port,
    host,
    password,
    toolModules,
    enabledToolGroups,
    sessionIdleTtlMs,
  };
}
