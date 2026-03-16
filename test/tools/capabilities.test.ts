import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { PlatformAdapter } from "../../src/platform/types.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

function createTerminalOnlyPlatform(): PlatformAdapter {
  const unsupported = async () => {
    throw new Error("unsupported");
  };

  return {
    capabilities: {
      screenshot: false,
      mouse: false,
      keyboard: false,
      accessibility: false,
      applications: false,
      terminal: true,
    },
    captureScreen: unsupported,
    mouseClick: unsupported,
    mouseMove: unsupported,
    mouseDrag: unsupported,
    keyboardType: unsupported,
    keyboardKey: unsupported,
    listApplications: unsupported,
    activateApplication: unsupported,
    listWindows: unsupported,
    getAccessibilityTree: unsupported,
    getMenuBar: unsupported,
    clickMenuItem: unsupported,
    terminalExec: async () => ({ stdout: "ok", stderr: "" }),
  };
}

describe("tool registration by platform capabilities", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext(createTerminalOnlyPlatform());
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it("registers only terminal tools for terminal-only platforms", async () => {
    const { tools } = await ctx.client.listTools();
    const names = tools.map((tool) => tool.name).sort();

    expect(names).toEqual(["terminal_exec"]);
  });
});
