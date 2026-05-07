import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { detectRuntimes } from "../src/detectors/runtimes.js";

describe("detectRuntimes", () => {
  it("returns object with expected shape", async () => {
    const result = await detectRuntimes(resolve("."));

    expect(result).toBeTypeOf("object");

    expect(
      result.node === null || typeof result.node === "string"
    ).toBeTruthy();
    expect(
      result.python === null || typeof result.python === "string"
    ).toBeTruthy();
    expect(result.go === null || typeof result.go === "string").toBeTruthy();

    expect(["npm", "yarn", "pnpm", "bun", "unknown"]).toContain(
      result.packageManager
    );
  });

  it("does not throw when called", async () => {
    await expect(detectRuntimes(resolve("."))).resolves.toBeDefined();
  });
});
