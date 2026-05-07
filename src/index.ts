#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { detectFramework } from "./detectors/frameworks.js";
import { getRecentErrors } from "./tools/errors.js";
import { getRunningServices } from "./tools/processes.js";
import { getSessionSnapshot } from "./tools/snapshot.js";

const server = new Server(
  {
    name: "devpulse",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_session_snapshot",
        description:
          "Returns a real-time diagnostic snapshot of the current dev environment. Includes health diagnosis, running services, recent errors, git state, and environment info. Call this first to orient yourself in the user's dev session.",
        inputSchema: {
          type: "object",
          properties: {
            cwd: {
              type: "string",
            },
          },
        },
      },
      {
        name: "get_recent_errors",
        description:
          "Returns recent ERROR and WARN log entries from the detected project's log files. Deduped, timestamped, secrets redacted. Defaults to last 50 lines.",
        inputSchema: {
          type: "object",
          properties: {
            cwd: {
              type: "string",
            },
            limit: {
              type: "number",
            },
          },
        },
      },
      {
        name: "get_running_services",
        description:
          "Lists processes running on common dev ports (3000, 4000, 5173, 8080 etc). Shows what is running and what is expected but missing.",
        inputSchema: {
          type: "object",
          properties: {
            cwd: {
              type: "string",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;

  if (toolName === "get_session_snapshot") {
    try {
      const args = request.params.arguments as { cwd?: string } | undefined;
      const cwd = args?.cwd ?? process.cwd();
      const result = await getSessionSnapshot(cwd);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Failed to get session snapshot: ${String(error)}`,
            }),
          },
        ],
      };
    }
  }

  if (toolName === "get_recent_errors") {
    try {
      const args = request.params.arguments as
        | { cwd?: string; limit?: number }
        | undefined;
      const cwd = args?.cwd ?? process.cwd();
      const limit = args?.limit ?? 50;
      const framework = await detectFramework(cwd);
      const result = await getRecentErrors(cwd, framework.logPaths, limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Failed to get recent errors: ${String(error)}`,
            }),
          },
        ],
      };
    }
  }

  if (toolName === "get_running_services") {
    try {
      const args = request.params.arguments as { cwd?: string } | undefined;
      const cwd = args?.cwd ?? process.cwd();
      const framework = await detectFramework(cwd);
      const result = await getRunningServices(framework.expectedPorts);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Failed to get running services: ${String(error)}`,
            }),
          },
        ],
      };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          error: `Tool '${toolName}' is registered but not yet implemented.`,
        }),
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("devpulse MCP server running\n");
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
