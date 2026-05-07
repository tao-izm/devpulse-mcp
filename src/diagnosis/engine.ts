export type HealthStatus = "healthy" | "degraded" | "broken";
export type Confidence = "high" | "medium" | "low";

export interface DiagnosisInput {
  running: Array<{ port: number; name: string }>;
  expected_but_missing: number[];
  recentErrors: Array<{ level: string; message: string }>;
  framework: string;
}

export interface DiagnosisResult {
  health: HealthStatus;
  primary_issue: string | null;
  secondary_signals: string[];
  suggested_action: string | null;
  confidence: Confidence;
}

export function diagnose(input: DiagnosisInput): DiagnosisResult {
  const running = input.running ?? [];
  const missing = input.expected_but_missing ?? [];
  const recentErrors = input.recentErrors ?? [];

  const hasAddrInUse = recentErrors.some((error) =>
    error.message.includes("EADDRINUSE")
  );
  const errorEntries = recentErrors.filter(
    (error) => error.level.toUpperCase() === "ERROR"
  );
  const hasErrorLevelEntries = errorEntries.length > 0;

  // Pattern 1 — Port conflict (broken)
  if (hasAddrInUse && missing.length > 0) {
    return {
      health: "broken",
      primary_issue: "Port conflict — dev server cannot start",
      secondary_signals: missing.map(
        (port) => `Port ${port} is already in use`
      ),
      suggested_action:
        "Kill the process using that port or change your dev server port",
      confidence: "high",
    };
  }

  // Pattern 2 — Dev server crashed (broken)
  if (missing.length > 0 && hasErrorLevelEntries && !hasAddrInUse) {
    return {
      health: "broken",
      primary_issue: "Dev server appears to have crashed",
      secondary_signals: errorEntries.slice(0, 3).map((error) => error.message),
      suggested_action: "Check the error logs and restart your dev server",
      confidence: "medium",
    };
  }

  // Pattern 3 — Silent failure (degraded)
  if (missing.length > 0 && recentErrors.length === 0) {
    return {
      health: "degraded",
      primary_issue: "Expected service not running — no recent logs found",
      secondary_signals: missing.map(
        (port) => `Port ${port} expected but nothing is listening`
      ),
      suggested_action: "Start your dev server",
      confidence: "low",
    };
  }

  // Pattern 4 — Errors but running (degraded)
  if (running.length > 0 && hasErrorLevelEntries) {
    return {
      health: "degraded",
      primary_issue: "Errors detected but services are still running",
      secondary_signals: errorEntries.slice(0, 3).map((error) => error.message),
      suggested_action:
        "Review the recent errors — the server is up but something is failing",
      confidence: "medium",
    };
  }

  // Pattern 5 — Healthy (healthy)
  if (running.length > 0 && recentErrors.length === 0 && missing.length === 0) {
    return {
      health: "healthy",
      primary_issue: null,
      secondary_signals: running.map(
        (service) => `Port ${service.port}: ${service.name}`
      ),
      suggested_action: null,
      confidence: "high",
    };
  }

  // Default fallback
  return {
    health: "degraded",
    primary_issue: "Unable to determine environment state",
    secondary_signals: [],
    suggested_action: "Try running get_session_snapshot again",
    confidence: "low",
  };
}
