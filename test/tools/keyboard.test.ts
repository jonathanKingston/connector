import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("keyboard tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("keyboard_type", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "keyboard_type")).toBeDefined();
    });

    it("types text", async () => {
      const result = await ctx.client.callTool({
        name: "keyboard_type",
        arguments: { text: "Hello World" },
      });

      expect(platform.keyboardType).toHaveBeenCalledWith({ text: "Hello World" });

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("11 character(s)");
    });
  });

  describe("keyboard_key", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "keyboard_key")).toBeDefined();
    });

    it("presses a key without modifiers", async () => {
      const result = await ctx.client.callTool({
        name: "keyboard_key",
        arguments: { key: "return" },
      });

      expect(platform.keyboardKey).toHaveBeenCalledWith({
        key: "return",
        modifiers: [],
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("return");
    });

    it("presses a key with modifiers", async () => {
      await ctx.client.callTool({
        name: "keyboard_key",
        arguments: { key: "c", modifiers: ["command"] },
      });

      expect(platform.keyboardKey).toHaveBeenCalledWith({
        key: "c",
        modifiers: ["command"],
      });
    });

    it("supports multiple modifiers", async () => {
      const result = await ctx.client.callTool({
        name: "keyboard_key",
        arguments: { key: "z", modifiers: ["command", "shift"] },
      });

      expect(platform.keyboardKey).toHaveBeenCalledWith({
        key: "z",
        modifiers: ["command", "shift"],
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("command+shift+z");
    });
  });
});
