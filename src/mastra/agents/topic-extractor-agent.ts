import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";
import instructions from "../prompts/topic-extractor";

const languageModel = process.env.TOOLS_MODEL || "qwen2.5-coder-32b-instruct"; //mistral-small-3.1-24b-instruct-2503"; //mistral-nemo-instruct-2407"; //gemma-3-27b-it"; //mistral-nemo-instruct-2407"; //llama-3.3-70b-instruct";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export const topicExtractorAgent = new Agent({
  name: "topic-extractor-agent",
  instructions,
  model: openai(languageModel),
});
