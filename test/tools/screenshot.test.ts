import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("screenshot tool", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it("is listed in available tools", async () => {
    const { tools } = await ctx.client.listTools();
    const tool = tools.find((t) => t.name === "screenshot");
    expect(tool).toBeDefined();
    expect(tool!.description).toContain("screenshot");
  });

  it("captures screenshot and returns image content", async () => {
    const result = await ctx.client.callTool({ name: "screenshot", arguments: {} });
    expect(result.content).toHaveLength(2);

    const imageContent = (result.content as Array<{ type: string }>).find(
      (c) => c.type === "image",
    ) as { type: string; data: string; mimeType: string } | undefined;
    expect(imageContent).toBeDefined();
    expect(imageContent!.mimeType).toBe("image/png");
    expect(imageContent!.data).toBeTruthy();

    expect(platform.captureScreen).toHaveBeenCalledWith(undefined, undefined);
  });

  it("passes displayId to platform adapter", async () => {
    await ctx.client.callTool({
      name: "screenshot",
      arguments: { displayId: 2 },
    });
    expect(platform.captureScreen).toHaveBeenCalledWith(2, undefined);
  });

  it("passes region to platform adapter when all region params provided", async () => {
    await ctx.client.callTool({
      name: "screenshot",
      arguments: { regionX: 100, regionY: 200, regionWidth: 300, regionHeight: 400 },
    });
    expect(platform.captureScreen).toHaveBeenCalledWith(undefined, {
      x: 100,
      y: 200,
      width: 300,
      height: 400,
    });
  });

  it("does not pass region when region params are missing", async () => {
    await ctx.client.callTool({
      name: "screenshot",
      arguments: { regionX: 100, regionY: 200 },
    });
    expect(platform.captureScreen).toHaveBeenCalledWith(undefined, undefined);
  });
});
