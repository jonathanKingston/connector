import { describe, it, expect } from "vitest";
import { PasswordAuthProvider } from "../../src/auth/password.js";

describe("PasswordAuthProvider", () => {
  const password = "test-secret-password";
  const provider = new PasswordAuthProvider(password);

  it("authenticates with correct password", async () => {
    const result = await provider.authenticate({
      headers: { authorization: `Bearer ${password}` },
    });
    expect(result).toBe(true);
  });

  it("rejects wrong password", async () => {
    const result = await provider.authenticate({
      headers: { authorization: "Bearer wrong-password" },
    });
    expect(result).toBe(false);
  });

  it("rejects missing Authorization header", async () => {
    const result = await provider.authenticate({
      headers: {},
    });
    expect(result).toBe(false);
  });

  it("rejects non-string Authorization header", async () => {
    const result = await provider.authenticate({
      headers: { authorization: ["Bearer foo", "Bearer bar"] },
    });
    expect(result).toBe(false);
  });

  it("rejects Authorization header without Bearer prefix", async () => {
    const result = await provider.authenticate({
      headers: { authorization: `Basic ${password}` },
    });
    expect(result).toBe(false);
  });

  it("rejects empty Bearer token", async () => {
    const result = await provider.authenticate({
      headers: { authorization: "Bearer " },
    });
    expect(result).toBe(false);
  });

  it("rejects password of different length", async () => {
    const result = await provider.authenticate({
      headers: { authorization: "Bearer x" },
    });
    expect(result).toBe(false);
  });

  it("throws on empty password in constructor", () => {
    expect(() => new PasswordAuthProvider("")).toThrow("Password must not be empty");
  });
});
