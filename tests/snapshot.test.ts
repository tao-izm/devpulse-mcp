import { describe, it, expect } from "vitest";
import { getSessionSnapshot } from "../src/tools/snapshot.js";
import os from "os";
import path from "path";
import fs from "fs";

describe("getSessionSnapshot", () => {
  it("does not throw on a bare empty directory", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devpulse-test-"));
    const result = await getSessionSnapshot(tmp);
    expect(result).toBeDefined();
    expect(result.diagnosis).toBeDefined();
    expect(result.diagnosis.health).toMatch(/healthy|degraded|broken/);
    expect(result.services).toBeDefined();
    expect(result.recent_errors).toBeDefined();
  });

  it("does not throw on a non-existent directory", async () => {
    const result = await getSessionSnapshot("/this/path/does/not/exist/anywhere");
    expect(result).toBeDefined();
    expect(result.diagnosis.health).toBeDefined();
  });
});
