import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("window management tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("move_window", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "move_window")).toBeDefined();
    });

    it("passes arguments correctly to platform", async () => {
      const result = await ctx.client.callTool({
        name: "move_window",
        arguments: { pid: 1234, windowIndex: 0, x: 100, y: 200 },
      });

      expect(platform.moveWindow).toHaveBeenCalledWith(1234, 0, 100, 200);

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("Moved");
      expect(text).toContain("1234");
    });
  });

  describe("resize_window", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "resize_window")).toBeDefined();
    });

    it("passes arguments correctly to platform", async () => {
      const result = await ctx.client.callTool({
        name: "resize_window",
        arguments: { pid: 1234, windowIndex: 0, width: 800, height: 600 },
      });

      expect(platform.resizeWindow).toHaveBeenCalledWith(1234, 0, 800, 600);

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("Resized");
      expect(text).toContain("800x600");
    });
  });

  describe("minimize_window", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "minimize_window")).toBeDefined();
    });

    it("passes arguments correctly to platform for minimize", async () => {
      const result = await ctx.client.callTool({
        name: "minimize_window",
        arguments: { pid: 1234, windowIndex: 0, minimize: true },
      });

      expect(platform.minimizeWindow).toHaveBeenCalledWith(1234, 0, true);

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("Minimized");
    });

    it("passes arguments correctly to platform for restore", async () => {
      const result = await ctx.client.callTool({
        name: "minimize_window",
        arguments: { pid: 1234, windowIndex: 1, minimize: false },
      });

      expect(platform.minimizeWindow).toHaveBeenCalledWith(1234, 1, false);

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("Restored");
    });
  });

  describe("set_fullscreen", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "set_fullscreen")).toBeDefined();
    });

    it("passes arguments correctly to platform for enter fullscreen", async () => {
      const result = await ctx.client.callTool({
        name: "set_fullscreen",
        arguments: { pid: 1234, windowIndex: 0, fullscreen: true },
      });

      expect(platform.setFullscreen).toHaveBeenCalledWith(1234, 0, true);

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("Entered");
    });

    it("passes arguments correctly to platform for exit fullscreen", async () => {
      const result = await ctx.client.callTool({
        name: "set_fullscreen",
        arguments: { pid: 1234, windowIndex: 0, fullscreen: false },
      });

      expect(platform.setFullscreen).toHaveBeenCalledWith(1234, 0, false);

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("Exited");
    });
  });
});
