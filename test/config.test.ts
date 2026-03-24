import { describe, it, expect } from "vitest";
import { parseSessionIdleTtlMs } from "../src/config.js";
import { parseConnectorToolsEnv } from "../src/tool-groups.js";

describe("parseConnectorToolsEnv", () => {
  it("treats unset as no built-in tools", () => {
    expect(parseConnectorToolsEnv(undefined)).toEqual(new Set());
  });

  it("treats empty string as no built-in tools", () => {
    expect(parseConnectorToolsEnv("")).toEqual(new Set());
    expect(parseConnectorToolsEnv("   ")).toEqual(new Set());
  });

  it("parses all as every group except terminal", () => {
    expect(parseConnectorToolsEnv("all")).toEqual(
      new Set([
        "screenshot",
        "mouse",
        "keyboard",
        "accessibility",
        "applications",
      ]),
    );
    expect(parseConnectorToolsEnv("ALL")).toEqual(
      new Set([
        "screenshot",
        "mouse",
        "keyboard",
        "accessibility",
        "applications",
      ]),
    );
  });

  it("parses all,terminal as full set", () => {
    expect(parseConnectorToolsEnv("all,terminal")).toEqual(
      new Set([
        "screenshot",
        "mouse",
        "keyboard",
        "accessibility",
        "applications",
        "terminal",
      ]),
    );
  });

  it("parses a comma-separated list", () => {
    const r = parseConnectorToolsEnv(" screenshot , terminal ");
    expect(r).toEqual(new Set(["screenshot", "terminal"]));
  });

  it("rejects unknown tokens", () => {
    expect(() => parseConnectorToolsEnv("screenshot,typo")).toThrow(/unknown/);
  });
});

describe("parseSessionIdleTtlMs", () => {
  it("defaults to 24 hours when unset or empty", () => {
    expect(parseSessionIdleTtlMs(undefined)).toBe(86_400_000);
    expect(parseSessionIdleTtlMs("")).toBe(86_400_000);
    expect(parseSessionIdleTtlMs("   ")).toBe(86_400_000);
  });

  it("allows 0 to disable idle eviction", () => {
    expect(parseSessionIdleTtlMs("0")).toBe(0);
  });

  it("parses positive milliseconds", () => {
    expect(parseSessionIdleTtlMs("300000")).toBe(300_000);
    expect(parseSessionIdleTtlMs(" 60000 ")).toBe(60_000);
  });

  it("rejects negative or non-numeric values", () => {
    expect(() => parseSessionIdleTtlMs("-1")).toThrow(/non-negative/);
    expect(() => parseSessionIdleTtlMs("nope")).toThrow(/non-negative/);
  });
});
