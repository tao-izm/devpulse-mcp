import path from "node:path";
import { simpleGit } from "simple-git";
import { detectFramework } from "../detectors/frameworks.js";
import { detectRuntimes } from "../detectors/runtimes.js";
import { diagnose } from "../diagnosis/engine.js";
import { getRecentErrors } from "./errors.js";
import { getRunningServices } from "./processes.js";

export interface SessionSnapshot {
  diagnosis: {
    health: "healthy" | "degraded" | "broken";
    primary_issue: string | null;
    secondary_signals: string[];
    suggested_action: string | null;
    confidence: "high" | "medium" | "low";
  };
  session: {
    project: string;
    framework: string;
    branch: string | null;
    uncommitted_files: number;
    last_commit: string | null;
  };
  services: {
    running: Array<{ port: number; name: string }>;
    expected_but_missing: number[];
  };
  recent_errors: Array<{
    time: string;
    level: string;
    message: string;
  }>;
  env: {
    node: string | null;
    python: string | null;
    go: string | null;
    package_manager: string;
  };
}

export async function getSessionSnapshot(cwd: string): Promise<SessionSnapshot> {
  const baseProject = path.basename(cwd);
  try {
    const frameworkPromise = detectFramework(cwd);
    const runtimesPromise = detectRuntimes(cwd);
    const servicesPromise = frameworkPromise.then((framework) =>
      getRunningServices(framework.expectedPorts)
    );
    const errorsPromise = frameworkPromise.then((framework) =>
      getRecentErrors(cwd, framework.logPaths, 50)
    );

    const [frameworkResult, runtimesResult, servicesResult, errorsResult] =
      await Promise.allSettled([
        frameworkPromise,
        runtimesPromise,
        servicesPromise,
        errorsPromise,
      ]);

    const framework =
      frameworkResult.status === "fulfilled"
        ? frameworkResult.value
        : { framework: "unknown", expectedPorts: [], logPaths: ["logs/"] };

    const runtimes =
      runtimesResult.status === "fulfilled"
        ? runtimesResult.value
        : { node: null, python: null, go: null, packageManager: "unknown" };

    const services =
      servicesResult.status === "fulfilled"
        ? servicesResult.value
        : { running: [], expected_but_missing: [] };

    const recentErrors = errorsResult.status === "fulfilled" ? errorsResult.value : [];

    let branch: string | null = null;
    let uncommittedFiles = 0;
    let lastCommit: string | null = null;

    try {
      const git = simpleGit(cwd);
      const [statusResult, logResult] = await Promise.all([
        git.status(),
        git.log({ maxCount: 1 }),
      ]);

      branch = statusResult.current || null;
      uncommittedFiles = statusResult.files.length;
      lastCommit = logResult.latest?.hash ?? null;
    } catch {
      branch = null;
      uncommittedFiles = 0;
      lastCommit = null;
    }

    const diagnosis = diagnose({
      running: services.running.map((service) => ({
        port: service.port,
        name: service.name,
      })),
      expected_but_missing: services.expected_but_missing,
      recentErrors: recentErrors.map((error) => ({
        level: error.level,
        message: error.message,
      })),
      framework: framework.framework,
    });

    const result: SessionSnapshot = {
      diagnosis,
      session: {
        project: baseProject,
        framework: framework.framework,
        branch,
        uncommitted_files: uncommittedFiles,
        last_commit: lastCommit,
      },
      services: {
        running: services.running.map((service) => ({
          port: service.port,
          name: service.name,
        })),
        expected_but_missing: services.expected_but_missing,
      },
      recent_errors: recentErrors.map((error) => ({
        time: error.time,
        level: error.level,
        message: error.message,
      })),
      env: {
        node: runtimes.node,
        python: runtimes.python,
        go: runtimes.go,
        package_manager: runtimes.packageManager,
      },
    };
    return result;
  } catch {
    const result: SessionSnapshot = {
      diagnosis: {
        health: "degraded",
        primary_issue: "Unable to determine environment state",
        secondary_signals: [],
        suggested_action: "Try running get_session_snapshot again",
        confidence: "low",
      },
      session: {
        project: path.basename(cwd),
        framework: "unknown",
        branch: null,
        uncommitted_files: 0,
        last_commit: null,
      },
      services: { running: [], expected_but_missing: [] },
      recent_errors: [],
      env: { node: null, python: null, go: null, package_manager: "unknown" },
    };
    return result;
  }
}
