import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { detectFramework } from "../src/detectors/frameworks.js";

const fixture = (name: string) => resolve("tests", "fixtures", name);

describe("detectFramework", () => {
  it("detects nextjs fixture and includes port 3000", async () => {
    const info = await detectFramework(fixture("nextjs"));
    expect(info.framework).toBe("nextjs");
    expect(info.expectedPorts).toContain(3000);
  });

  it("detects vite fixture and includes port 5173", async () => {
    const info = await detectFramework(fixture("vite"));
    expect(info.framework).toBe("vite");
    expect(info.expectedPorts).toContain(5173);
  });

  it("detects express fixture", async () => {
    const info = await detectFramework(fixture("express"));
    expect(info.framework).toBe("express");
  });

  it("detects fastapi fixture", async () => {
    const info = await detectFramework(fixture("fastapi"));
    expect(info.framework).toBe("fastapi");
  });

  it("returns unknown for empty fixture", async () => {
    const info = await detectFramework(fixture("empty"));
    expect(info.framework).toBe("unknown");
  });

  it("returns unknown and does not throw for missing fixture package.json", async () => {
    await expect(detectFramework(fixture("missing"))).resolves.toMatchObject({
      framework: "unknown",
    });
  });
});
