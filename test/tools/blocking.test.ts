import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { loadExternalToolRegistrars } from "../../src/tools/extensions.js";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext } from "../helpers/test-server.js";

describe("tool blocking", () => {
  it("blocks selected built-in tools from registration", async () => {
    const ctx = await createTestContext(createMockPlatform(), [], [
      "mouse_click",
      "terminal_exec",
    ]);

    try {
      const { tools } = await ctx.client.listTools();
      const names = tools.map((tool) => tool.name);

      expect(names).not.toContain("mouse_click");
      expect(names).not.toContain("terminal_exec");
      expect(names).toContain("mouse_move");
      expect(names).toContain("screenshot");
    } finally {
      await ctx.cleanup();
    }
  });

  it("blocks selected tools from external modules", async () => {
    const registrars = await loadExternalToolRegistrars([
      resolve(process.cwd(), "test/fixtures/tool-modules/named-register.mjs"),
    ]);
    const ctx = await createTestContext(createMockPlatform(), registrars, [
      "custom_ping",
    ]);

    try {
      const { tools } = await ctx.client.listTools();
      const names = tools.map((tool) => tool.name);

      expect(names).not.toContain("custom_ping");
      expect(names).toContain("screenshot");
    } finally {
      await ctx.cleanup();
    }
  });
});
