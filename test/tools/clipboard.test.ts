import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("clipboard tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("get_clipboard", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "get_clipboard")).toBeDefined();
    });

    it("returns clipboard text content", async () => {
      const result = await ctx.client.callTool({
        name: "get_clipboard",
        arguments: {},
      });

      expect(platform.getClipboard).toHaveBeenCalled();

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toBe("mock clipboard text");
    });

    it("returns placeholder when clipboard is empty", async () => {
      platform.getClipboard.mockResolvedValueOnce({ text: null, hasImage: false, imageData: null });

      const result = await ctx.client.callTool({
        name: "get_clipboard",
        arguments: {},
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toBe("(clipboard is empty or contains no text)");
    });
  });

  describe("set_clipboard", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "set_clipboard")).toBeDefined();
    });

    it("sets clipboard text", async () => {
      const result = await ctx.client.callTool({
        name: "set_clipboard",
        arguments: { text: "Hello World" },
      });

      expect(platform.setClipboard).toHaveBeenCalledWith({
        text: "Hello World",
        hasImage: false,
        imageData: null,
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("11 character(s)");
    });
  });
});
