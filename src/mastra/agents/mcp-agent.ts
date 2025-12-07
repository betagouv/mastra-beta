import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { MCPClient } from "@mastra/mcp";
import { betagouv } from "../mcp/betagouv";

const languageModel = process.env.TOOLS_MODEL || "qwen2.5-coder-32b-instruct";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

const mcpClient = new MCPClient({
  id: "test-mcp-client",
  servers: {
    betagouv: {
      command: "npx",
      args: ["tsx", "../../src/mastra/mcp/betagouv-stdio.ts"],
      enableServerLogs: true,
      logger: (args) => console.log(args),
    },
  },
});

export const mcpAgent = new Agent({
  name: "beta.gouv.fr MCP Agent",
  description: "You are a helpful AI assistant",
  instructions: `
You are a helpful assistant that has access to the following MCP Servers.
- beta.gouv.fr MCP Server

Answer questions using the information you find using the MCP Servers.

Answer un french and markdown format`.trim(),
  model: openai(languageModel),
  tools: await mcpClient.getTools(), //.getTools(),
});
