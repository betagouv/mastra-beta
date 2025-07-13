import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";
import fs from "fs/promises";
import path from "path";

const languageModel =
  process.env.LANGUAGE_MODEL || "qwen2.5-coder-32b-instruct"; //mistral-small-3.1-24b-instruct-2503"; //mistral-nemo-instruct-2407"; //gemma-3-27b-it"; //mistral-nemo-instruct-2407"; //llama-3.3-70b-instruct";

const instructions = (
  await fs.readFile(
    path.join(import.meta.dirname, "../../prompt-sql-detection.md")
  )
).toString();

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export const sqlDetectionAgent = new Agent({
  name: "sql-detection-agent",
  instructions,
  model: openai(languageModel),
});
