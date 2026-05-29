/**
 * Platform adapter factory — detects the current OS and returns the
 * appropriate adapter. Fails fast if the platform is unsupported.
 */

import type { PlatformAdapter } from "./types.js";

export async function createPlatformAdapter(
  platform: NodeJS.Platform = process.platform,
): Promise<PlatformAdapter> {
  switch (platform) {
    case "darwin": {
      const { MacOSAdapter } = await import("./macos/index.js");
      return new MacOSAdapter();
    }
    case "linux": {
      const { LinuxTerminalAdapter } = await import("./linux/index.js");
      return new LinuxTerminalAdapter();
    }
    case "win32": {
      const { WindowsAdapter } = await import("./windows/index.js");
      return new WindowsAdapter();
    }
    default:
      throw new Error(
        `Platform "${platform}" is not yet supported. Connector currently supports: darwin (macOS GUI), linux (terminal-only), win32 (Windows terminal-only).`,
      );
  }
}
