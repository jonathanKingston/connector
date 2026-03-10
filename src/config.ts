/**
 * Server configuration — read from environment variables.
 * Fails fast if required values are missing.
 */

export interface Config {
  /** Port to listen on */
  port: number;
  /** Host/IP to bind to */
  host: string;
  /** Password for Bearer token authentication */
  password: string;
}

export function loadConfig(): Config {
  const password = process.env.CONNECTOR_PASSWORD;
  if (!password) {
    throw new Error(
      "CONNECTOR_PASSWORD environment variable is required. " +
        "Set it to the password that clients must provide via Authorization: Bearer <password>.",
    );
  }

  const portStr = process.env.CONNECTOR_PORT;
  const port = portStr ? parseInt(portStr, 10) : 3100;
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(
      `CONNECTOR_PORT must be a valid port number (1-65535), got: "${portStr}"`,
    );
  }

  const host = process.env.CONNECTOR_HOST ?? "0.0.0.0";

  return { port, host, password };
}
