import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { betaWorkflow } from "../workflows/beta-workflow";
import { skillsWorkflow } from "../workflows/skills-workflow";
import instructions from "../prompts/beta-agent-instructions";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

const languageModel = process.env.TOOLS_MODEL || "mistral";

const model = openai(languageModel);

export const betaAgent = new Agent({
  name: "beta.gouv.fr agent",
  workflows: { betaWorkflow /*, skillsWorkflow*/ },
  description:
    "Questions about beta.gouv.fr community, teams, products, methodology, culture, organisation...",
  instructions,
  model,
  defaultGenerateOptions: {
    temperature: 0,
  },
  defaultStreamOptions: {
    temperature: 0,
  },
  tools: {
    /*...mcpTools,searchDocumentationTool*/
  },
  // memory: new Memory({
  //   storage: new LibSQLStore({
  //     url: "file:../beta-agent8.db", // path is relative to the .mastra/output directory
  //   }),
  // }),
  evals: {},
});
