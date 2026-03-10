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
export declare function loadConfig(): Config;
//# sourceMappingURL=config.d.ts.map