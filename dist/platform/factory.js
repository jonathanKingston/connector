/**
 * Platform adapter factory — detects the current OS and returns the
 * appropriate adapter. Fails fast if the platform is unsupported.
 */
export async function createPlatformAdapter() {
    const platform = process.platform;
    switch (platform) {
        case "darwin": {
            const { MacOSAdapter } = await import("./macos/index.js");
            return new MacOSAdapter();
        }
        default:
            throw new Error(`Platform "${platform}" is not yet supported. Connector currently supports: darwin (macOS).`);
    }
}
//# sourceMappingURL=factory.js.map