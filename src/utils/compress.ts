export function compress(input: string, maxLines: number = 50): string {
  const source = String(input ?? "");
  const withoutAnsi = source.replace(
    // eslint-disable-next-line no-control-regex
    /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g,
    ""
  );
  const normalized = withoutAnsi.replace(/\n\s*\n\s*\n+/g, "\n\n");

  const lines = normalized.split("\n");
  if (lines.length > maxLines) {
    return lines.slice(-maxLines).join("\n");
  }
  return normalized;
}
