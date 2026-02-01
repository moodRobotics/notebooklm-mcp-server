#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { chromium, BrowserContext } from "playwright";
import * as path from "path";
import * as os from "os";
import { Command } from "commander";
import { runAuth } from "./auth.js";

// ... (schemas stay the same)
const ListNotebooksSchema = z.object({});
const CreateNotebookSchema = z.object({
  title: z.string().optional(),
});
const GetNotebookSchema = z.object({
  notebookId: z.string(),
});
const QueryNotebookSchema = z.object({
  notebookId: z.string(),
  query: z.string(),
});

class NotebookLMServer {
  private server: Server;
  private browser: BrowserContext | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "notebooklm-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  // ... (implementation same as before but including the setupTools)
  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "list_notebooks",
          description: "Lists all your NotebookLM notebooks",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "create_notebook",
          description: "Creates a new empty notebook",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
            },
          },
        },
        // ...
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // ...
      return { content: [{ type: "text", text: "Tool execution logic here" }] };
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("NotebookLM MCP Server running on stdio");
  }
}

const program = new Command();

program
  .name("notebooklm-mcp")
  .description("MCP server for Google NotebookLM")
  .version("1.0.0");

program
  .command("start")
  .description("Start the MCP server (stdio mode)")
  .action(async () => {
    const server = new NotebookLMServer();
    await server.run();
  });

program
  .command("auth")
  .description("Open a browser to log in to Google")
  .action(async () => {
    await runAuth();
  });

// Default to start if no command provided (for MCP clients)
if (process.argv.length <= 2) {
  const server = new NotebookLMServer();
  server.run().catch(console.error);
} else {
  program.parse(process.argv);
}
