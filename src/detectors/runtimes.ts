import { execFileSync } from "node:child_process";
import { stat } from "node:fs/promises";
import { join } from "node:path";

export interface RuntimeInfo {
  node: string | null;
  python: string | null;
  go: string | null;
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | "unknown";
}

function runCommand(command: string, args: string[] = []): string | null {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      timeout: 3000,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }).trim();
  } catch {
    return null;
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function detectNodeVersion(): string | null {
  const output = runCommand("node", ["--version"]);
  if (!output) {
    return null;
  }
  return output.replace(/^v/, "");
}

function detectPythonVersion(): string | null {
  // On Windows, `py -3` is often available even when `python` alias is disabled.
  const output =
    runCommand("py", ["-3", "--version"]) ??
    runCommand("python3", ["--version"]) ??
    runCommand("python", ["--version"]);
  if (!output) {
    return null;
  }
  const match = output.match(/^Python\s+([0-9]+\.[0-9]+\.[0-9]+)/i);
  return match?.[1] ?? null;
}

function detectGoVersion(): string | null {
  const output = runCommand("go", ["version"]);
  if (!output) {
    return null;
  }
  const match = output.match(/\bgo([0-9]+\.[0-9]+(?:\.[0-9]+)?)\b/);
  return match?.[1] ?? null;
}

async function detectPackageManager(
  cwd: string
): Promise<RuntimeInfo["packageManager"]> {
  if (await exists(join(cwd, "bun.lockb"))) {
    return "bun";
  }
  if (await exists(join(cwd, "yarn.lock"))) {
    return "yarn";
  }
  if (await exists(join(cwd, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (await exists(join(cwd, "package-lock.json"))) {
    return "npm";
  }
  return "unknown";
}

export async function detectRuntimes(cwd: string): Promise<RuntimeInfo> {
  try {
    const [node, python, go, packageManager] = await Promise.all([
      Promise.resolve(detectNodeVersion()),
      Promise.resolve(detectPythonVersion()),
      Promise.resolve(detectGoVersion()),
      detectPackageManager(cwd),
    ]);

    return {
      node,
      python,
      go,
      packageManager,
    };
  } catch {
    return {
      node: null,
      python: null,
      go: null,
      packageManager: "unknown",
    };
  }
}
