import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { resolve } from "node:path";
import { loadExternalToolRegistrars } from "../../src/tools/extensions.js";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("external tool modules", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    const registrars = await loadExternalToolRegistrars([
      resolve(process.cwd(), "test/fixtures/tool-modules/named-register.mjs"),
    ]);
    ctx = await createTestContext(createMockPlatform(), registrars);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it("loads and registers tools from external modules", async () => {
    const { tools } = await ctx.client.listTools();
    expect(tools.find((tool) => tool.name === "custom_ping")).toBeDefined();
  });

  it("throws if module does not export a registrar function", async () => {
    await expect(
      loadExternalToolRegistrars([
        resolve(process.cwd(), "test/fixtures/tool-modules/invalid.mjs"),
      ]),
    ).rejects.toThrow("must export a register function");
  });
});
