import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestContext, type TestContext } from "../helpers/test-server.js";
import { createMockPlatform } from "../helpers/mock-platform.js";

describe("CONNECTOR_TOOLS-style selection", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext(createMockPlatform(), [], {
      enabledToolGroups: new Set(["terminal"]),
    });
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it("registers only allowed built-in groups", async () => {
    const { tools } = await ctx.client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(["terminal_exec"]);
  });
});
