# devpulse

An MCP server that lets your AI coding assistant see what's actually happening in your dev environment.

When you're debugging with Claude Code or Cursor, the AI has no idea if your dev server is running, what errors just appeared in the logs, or what branch you're on. You end up copy-pasting the same context every session. devpulse fixes that with one tool call.

## What your AI sees

```json
{
  "diagnosis": {
    "health": "broken",
    "primary_issue": "Port conflict — dev server cannot start",
    "suggested_action": "Kill the process using that port or change your dev server port",
    "confidence": "high"
  },
  "session": {
    "project": "my-app",
    "framework": "nextjs",
    "branch": "feat/auth",
    "uncommitted_files": 3
  },
  "services": {
    "running": [],
    "expected_but_missing": [3000]
  },
  "recent_errors": [
    { "time": "2m ago", "level": "ERROR", "message": "EADDRINUSE :::3000" }
  ],
  "env": {
    "node": "20.11.0",
    "package_manager": "pnpm"
  }
}
```

Instead of asking you what's wrong, the AI already knows.

## Setup

**Claude Code**
```bash
claude mcp add devpulse -- npx -y devpulse-mcp
```

**Cursor / Claude Desktop / Windsurf**
```json
{
  "mcpServers": {
    "devpulse": {
      "command": "npx",
      "args": ["-y", "devpulse-mcp"]
    }
  }
}
```

No API key. No account. No config file.

## Tools

- `get_session_snapshot` — full diagnostic snapshot, call this first
- `get_recent_errors` — recent errors from your log files, secrets redacted
- `get_running_services` — what's on your dev ports and what's missing

## Supported frameworks

Detected automatically from your `package.json` — Next.js, Vite, Express, FastAPI. More coming.

## Privacy

Runs entirely on your machine. No data leaves your computer. API keys and secrets are automatically stripped from log output.

## License

MIT
