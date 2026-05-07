import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface FrameworkInfo {
  framework: "nextjs" | "vite" | "express" | "fastapi" | "unknown";
  logPaths: string[];
  expectedPorts: number[];
}

const UNKNOWN_FRAMEWORK: FrameworkInfo = {
  framework: "unknown",
  logPaths: ["logs/"],
  expectedPorts: [3000, 8000, 8080],
};

export async function detectFramework(cwd: string): Promise<FrameworkInfo> {
  try {
    const packageJsonPath = join(cwd, "package.json");
    const packageJsonRaw = await readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonRaw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const mergedDeps = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };

    if ("next" in mergedDeps) {
      return {
        framework: "nextjs",
        logPaths: [".next/server/"],
        expectedPorts: [3000],
      };
    }

    if ("vite" in mergedDeps) {
      return {
        framework: "vite",
        logPaths: ["dist/"],
        expectedPorts: [5173],
      };
    }

    if ("express" in mergedDeps) {
      return {
        framework: "express",
        logPaths: ["logs/"],
        expectedPorts: [3000, 8080],
      };
    }

    if ("fastapi" in mergedDeps) {
      return {
        framework: "fastapi",
        logPaths: ["logs/"],
        expectedPorts: [8000],
      };
    }

    return UNKNOWN_FRAMEWORK;
  } catch {
    return UNKNOWN_FRAMEWORK;
  }
}
