import { describe, it, expect } from "vitest";

import { captureScreen } from "../../src/platform/windows/screenshot.js";

describe("Windows captureScreen", () => {
  it.runIf(process.platform === "win32")("returns a PNG for the primary display", async () => {
    const result = await captureScreen();
    expect(result.mimeType).toBe("image/png");
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    const raw = Buffer.from(result.data, "base64");
    expect(raw[0]).toBe(0x89);
    expect(raw.toString("ascii", 1, 4)).toBe("PNG");
  });

  it.runIf(process.platform === "win32")("accepts displayId 1 when a monitor exists", async () => {
    const result = await captureScreen(1);
    expect(result.mimeType).toBe("image/png");
    expect(result.width).toBeGreaterThan(0);
  });
});
