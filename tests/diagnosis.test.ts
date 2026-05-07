import { describe, expect, it } from "vitest";
import { diagnose, type DiagnosisInput } from "../src/diagnosis/engine.js";

function baseInput(overrides: Partial<DiagnosisInput>): DiagnosisInput {
  return {
    running: [],
    expected_but_missing: [],
    recentErrors: [],
    framework: "unknown",
    ...overrides,
  };
}

describe("diagnose", () => {
  it("Pattern 1: EADDRINUSE -> broken/high with port conflict issue", () => {
    const result = diagnose(
      baseInput({
        expected_but_missing: [3000],
        recentErrors: [{ level: "ERROR", message: "listen EADDRINUSE: 3000" }],
      })
    );

    expect(result.health).toBe("broken");
    expect(result.confidence).toBe("high");
    expect(result.primary_issue).toContain("Port conflict");
  });

  it("Pattern 2: missing port + errors without EADDRINUSE -> broken/medium", () => {
    const result = diagnose(
      baseInput({
        expected_but_missing: [5173],
        recentErrors: [{ level: "ERROR", message: "Unhandled exception" }],
      })
    );

    expect(result.health).toBe("broken");
    expect(result.confidence).toBe("medium");
  });

  it("Pattern 3: missing port + no errors -> degraded/low with no recent logs", () => {
    const result = diagnose(
      baseInput({
        expected_but_missing: [8080],
      })
    );

    expect(result.health).toBe("degraded");
    expect(result.confidence).toBe("low");
    expect(result.primary_issue).toContain("no recent logs");
  });

  it("Pattern 4: running + errors -> degraded with non-null suggested_action", () => {
    const result = diagnose(
      baseInput({
        running: [{ port: 3000, name: "node" }],
        recentErrors: [{ level: "ERROR", message: "DB connection timeout" }],
      })
    );

    expect(result.health).toBe("degraded");
    expect(result.suggested_action).not.toBeNull();
  });

  it("Pattern 5: running + no errors + nothing missing -> healthy", () => {
    const result = diagnose(
      baseInput({
        running: [{ port: 5173, name: "vite" }],
      })
    );

    expect(result.health).toBe("healthy");
    expect(result.primary_issue).toBeNull();
  });

  it("Default fallback: empty input -> degraded/low", () => {
    const result = diagnose({
      running: [],
      expected_but_missing: [],
      recentErrors: [],
      framework: "",
    });

    expect(result.health).toBe("degraded");
    expect(result.confidence).toBe("low");
  });
});
