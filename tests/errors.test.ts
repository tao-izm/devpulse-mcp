import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getRecentErrors } from "../src/tools/errors.js";

const createdDirs: string[] = [];

afterEach(async () => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  }
});

describe("getRecentErrors", () => {
  it("returns empty array for a directory with no log files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "devpulse-errors-"));
    createdDirs.push(dir);

    const result = await getRecentErrors(dir, ["logs/app.log"]);
    expect(result).toEqual([]);
  });

  it("returns empty array without throwing when logPaths is empty", async () => {
    const dir = await mkdtemp(join(tmpdir(), "devpulse-errors-"));
    createdDirs.push(dir);

    await expect(getRecentErrors(dir, [])).resolves.toEqual([]);
  });
});
