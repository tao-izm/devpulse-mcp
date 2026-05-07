export function redact(input: string): string {
  try {
    let output = String(input ?? "");

    output = output.replace(/\b(?:key|sk|pk)-[A-Za-z0-9_-]+\b/g, "[REDACTED]");
    output = output.replace(/\bBearer\s+[^\s]+/gi, "Bearer [REDACTED]");
    output = output.replace(/\bBasic\s+[^\s]+/gi, "Basic [REDACTED]");
    output = output.replace(/:\/\/([^:\s/@]+):([^@\s]+)@/g, "://$1:[REDACTED]@");
    output = output.replace(
      /^(\s*(?:API_KEY|SECRET|TOKEN|PASSWORD)\s*=\s*).+$/gim,
      "$1[REDACTED]"
    );
    output = output.replace(
      /\b(secret|token|password|api_key|apikey|auth)(["\s]*[:=]["\s]*)([\w-]+)/gi,
      "$1$2[REDACTED]"
    );
    output = output.replace(/\b[a-fA-F0-9]{32,}\b/g, "[REDACTED]");
    output = output.replace(
      /\b[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[REDACTED]"
    );

    return output;
  } catch {
    return "";
  }
}
