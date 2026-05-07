import { describe, expect, it } from "vitest";
import { redact } from "../src/utils/redact.js";

describe("redact", () => {
  it("strips Bearer tokens", () => {
    const result = redact("Authorization: Bearer abc.def.ghi");
    expect(result).toContain("Bearer [REDACTED]");
    expect(result).not.toContain("abc.def.ghi");
  });

  it("strips env-style assignments", () => {
    expect(redact("API_KEY=abc123")).toBe("API_KEY=[REDACTED]");
  });

  it("strips JWT-shaped strings", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature";
    const result = redact(`token=${jwt}`);
    expect(result).toContain("[REDACTED]");
    expect(result).not.toContain(jwt);
  });

  it("does not modify clean strings", () => {
    expect(redact("hello world")).toBe("hello world");
  });

  it("never throws on empty string or undefined-like input", () => {
    expect(() => redact("")).not.toThrow();
    expect(() => redact(undefined as unknown as string)).not.toThrow();
  });
});
