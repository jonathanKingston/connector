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

  return { port, host, password, toolModules, enabledToolGroups };
}
