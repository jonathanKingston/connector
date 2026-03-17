/**
 * Server configuration — read from environment variables.
 * Fails fast if required values are invalid.
 */

export interface Config {
  /** Port to listen on */
  port: number;
  /** Host/IP to bind to */
  host: string;
  /** Password for Bearer token authentication. Undefined = no auth. */
  password: string | undefined;
  /** Optional external modules that register setup-specific tools. */
  toolModules: string[];
}

export function loadConfig(): Config {
  const password = process.env.CONNECTOR_PASSWORD || undefined;
  const toolModules = (process.env.CONNECTOR_TOOL_MODULES ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const portStr = process.env.CONNECTOR_PORT;
  const port = portStr ? parseInt(portStr, 10) : 3100;
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(
      `CONNECTOR_PORT must be a valid port number (1-65535), got: "${portStr}"`,
    );
  }

  const host = process.env.CONNECTOR_HOST ?? "0.0.0.0";

  return { port, host, password, toolModules };
}
