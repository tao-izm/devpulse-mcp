import { describe, expect, it } from "vitest";
import { getRunningServices } from "../src/tools/processes.js";

describe("getRunningServices", () => {
  it("returns empty arrays for empty expected ports", async () => {
    const result = await getRunningServices([]);
    expect(result).toEqual({
      running: [],
      expected_but_missing: [],
    });
  });

  it("returns missing for an unused invalid high port", async () => {
    const result = await getRunningServices([99999]);
    expect(result).toEqual({
      running: [],
      expected_but_missing: [99999],
    });
  });

  it("returns the expected result shape", async () => {
    const result = await getRunningServices([99999]);

    expect(result).toHaveProperty("running");
    expect(result).toHaveProperty("expected_but_missing");
    expect(Array.isArray(result.running)).toBe(true);
    expect(Array.isArray(result.expected_but_missing)).toBe(true);
  });
});
