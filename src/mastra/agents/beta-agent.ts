import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { weatherTool } from "../tools/weather-tool";
import { betagouv } from "../mcp/betagouv";
import { searchDocumentationTool } from "../tools/search-documentation";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

const mcpTools = await betagouv.convertedTools;

console.log("mcpTools", mcpTools);

export const betaAgent = new Agent({
  name: "beta.gouv.Fr Agent",
  instructions: `
      You are a helpful informational assistant that provides accurate informations about beta.gouv.fr products, teams, methodology and community.

      You only use data and informations given in context and no prior knowledge.

      Your primary function is to help users get informations on spectific topics. When responding:
      - Include relevant details like URLs, full names and contact informations
      - Keep responses concise but informative
      - Alway use french language
      - Format with markdown and use tables when possible
      - when mentionning a member, use this url convention and create markdown links : https://espace-membre.incubateur.net/community/[username].
      - when mentionning a startup or team, use this url convention and create markdown links : https://beta.gouv.fr/startups/[id]. 

      Use the provided tools to fetch the informations as needed
`,
  model: openai("llama-3.3-70b-instruct"),
  //defaultStreamOptions: { maxRetries: 2 },
  tools: { ...mcpTools, searchDocumentationTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../beta-agent3.db", // path is relative to the .mastra/output directory
    }),
  }),
});
