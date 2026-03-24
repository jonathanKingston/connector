import { describe, it, expect } from "vitest";
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
