import { createOpenAI } from "@ai-sdk/openai";
import instructions from "../prompts/sql-query-generator";
import { Agent } from "@mastra/core";

const sqlModel = process.env.SQL_MODEL || "qwen2.5-coder-32b-instruct"; //deepseek-r1-distill-llama-70b"; //llama-3.3-70b-instruct";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export const sqlAgent = new Agent({
  name: "sql-query-agent",
  instructions,
  model: openai(sqlModel),
  defaultGenerateOptions: { maxSteps: 3, maxRetries: 5 },
});
