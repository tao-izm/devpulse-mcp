import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { compress } from "../utils/compress.js";
import { redact } from "../utils/redact.js";

export interface ErrorEntry {
  time: string;
  level: "ERROR" | "WARN";
  message: string;
}

function getRelativeTimeFromMs(ageMs: number): string {
  if (ageMs < 60_000) {
    return "just now";
  }
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export async function getRecentErrors(
  cwd: string,
  logPaths: string[],
  limit: number = 50
): Promise<ErrorEntry[]> {
  try {
    const entries: ErrorEntry[] = [];
    const seenMessages = new Set<string>();

    for (const logPath of logPaths) {
      const fullPath = resolve(cwd, logPath);
      let fileStat;
      try {
        fileStat = await stat(fullPath);
        if (!fileStat.isFile()) {
          continue;
        }
      } catch {
        continue;
      }

      let content: string;
      try {
        content = await readFile(fullPath, "utf8");
      } catch {
        continue;
      }

      const ageMs = Date.now() - fileStat.mtimeMs;
      const relativeTime = getRelativeTimeFromMs(ageMs);
      const lines = content.split(/\r?\n/);

      for (const line of lines) {
        if (!/(error|warn)/i.test(line)) {
          continue;
        }
        const level: ErrorEntry["level"] = /error/i.test(line) ? "ERROR" : "WARN";
        const message = compress(redact(line));

        if (seenMessages.has(message)) {
          continue;
        }
        seenMessages.add(message);

        entries.push({
          time: relativeTime,
          level,
          message,
        });
      }
    }

    return entries.slice(-limit);
  } catch {
    return [];
  }
}
