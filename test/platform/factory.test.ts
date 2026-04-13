import { describe, it, expect, vi, afterEach } from "vitest";

describe("createPlatformAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns linux terminal adapter on linux", async () => {
    const { createPlatformAdapter } = await import("../../src/platform/factory.js");
    const adapter = await createPlatformAdapter("linux");

    expect(adapter.capabilities).toEqual({
      screenshot: false,
      mouse: false,
      keyboard: false,
      accessibility: false,
      applications: false,
      terminal: true,
    });
  });

  it("returns macOS adapter with terminal on darwin", async () => {
    const { createPlatformAdapter } = await import("../../src/platform/factory.js");
    const adapter = await createPlatformAdapter("darwin");

    expect(adapter.capabilities.terminal).toBe(true);
    expect(adapter.capabilities.screenshot).toBe(true);
  });

  it("returns windows terminal adapter on win32", async () => {
    const { createPlatformAdapter } = await import("../../src/platform/factory.js");
    const adapter = await createPlatformAdapter("win32");

    expect(adapter.capabilities).toEqual({
      screenshot: false,
      mouse: false,
      keyboard: false,
      accessibility: false,
      applications: false,
      terminal: true,
    });
  });

  it("throws for unsupported platform", async () => {
    const { createPlatformAdapter } = await import("../../src/platform/factory.js");
    await expect(createPlatformAdapter("freebsd" as NodeJS.Platform)).rejects.toThrow(
      'Platform "freebsd" is not yet supported',
    );
  });
});
