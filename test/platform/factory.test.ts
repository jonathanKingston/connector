import { describe, it, expect, vi, afterEach } from "vitest";

describe("createPlatformAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws for unsupported platform (linux)", async () => {
    // We can test this directly since we ARE on linux
    const { createPlatformAdapter } = await import("../../src/platform/factory.js");

    await expect(createPlatformAdapter()).rejects.toThrow(
      'Platform "linux" is not yet supported',
    );
  });
});
