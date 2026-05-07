import { describe, expect, it } from "vitest";
import { compress } from "../src/utils/compress.js";

describe("compress", () => {
  it("strips ANSI codes", () => {
    const input = "\x1b[31mERROR\x1b[0m plain";
    expect(compress(input)).toBe("ERROR plain");
  });

  it("truncates to maxLines and keeps the last lines", () => {
    const input = "line1\nline2\nline3\nline4";
    const result = compress(input, 2);
    expect(result).toBe("line3\nline4");
  });

  it("handles empty string without throwing", () => {
    expect(() => compress("")).not.toThrow();
    expect(compress("")).toBe("");
  });
});
