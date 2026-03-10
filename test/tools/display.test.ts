import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("display tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("list_displays", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "list_displays")).toBeDefined();
    });

    it("returns display info as JSON text", async () => {
      const result = await ctx.client.callTool({
        name: "list_displays",
        arguments: {},
      });

      expect(platform.listDisplays).toHaveBeenCalled();

      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe(1);
      expect(parsed[0].width).toBe(1920);
      expect(parsed[0].height).toBe(1080);
      expect(parsed[0].pixelWidth).toBe(3840);
      expect(parsed[0].pixelHeight).toBe(2160);
      expect(parsed[0].scaleFactor).toBe(2);
      expect(parsed[0].position).toEqual({ x: 0, y: 0 });
      expect(parsed[0].isMain).toBe(true);
    });
  });
});
