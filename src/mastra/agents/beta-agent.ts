import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { betagouv as betagouvMCP } from "../mcp/betagouv";
import { betaWorkflow } from "../workflows/beta-workflow";
import { SummarizationMetric } from "@mastra/evals/llm";
import {
  ContentSimilarityMetric,
  ToneConsistencyMetric,
} from "@mastra/evals/nlp";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

const languageModel = process.env.TOOLS_MODEL || "mistral";

const mcpTools = await betagouvMCP.convertedTools;

console.log("mcpTools", mcpTools);

const model = openai(languageModel);

export const betaAgent = new Agent({
  name: "beta.gouv.Fr Agent",
  workflows: { betaWorkflow },
  description:
    "Questions abouts beta.gouv.fr community, teams, products, methodology, culture, organisation...",
  instructions: `
You are a helpful informational assistant that provides accurate informations based on your context.

You only use information given in the context and no any prior knowledge to answer.

You only answer question about the beta.gouv community and its ecosystem and documentation.

Use the betagouv workflow to answer questions.

Your primary function is to help users get informations on spectific topics. When responding:
- Include relevant details like URLs, full names and contact informations
- Make pedagogic answers
- Always include all relevant data from the context in the answer and order by relevancy
- Put relevant documentation information first, and detailed results last
- Focus on context informations relevant to the query
- Always include related documentation links at the end of your answer
- Alway use french language
- Dont exceed 25 rows in your result list and say it when its limited
- Always embed members and startups names with their URL
- Format with markdown and use tables when presenting multiple results
- When mentionning doc.incubateur.net urls, always use absolute URLs

Today date is ${new Date().toISOString().substring(0, 10)}

  `,
  model,
  defaultGenerateOptions: { temperature: 0 },
  defaultStreamOptions: { temperature: 0 },
  tools: {
    /*...mcpTools,searchDocumentationTool*/
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../beta-agent3.db", // path is relative to the .mastra/output directory
    }),
  }),
  evals: {
    // summarization: new SummarizationMetric(model),
    // contentSimilarity: new ContentSimilarityMetric(),
    tone: new ToneConsistencyMetric(),
  },
});
