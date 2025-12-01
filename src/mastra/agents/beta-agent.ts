import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { betaWorkflow } from "../workflows/beta-workflow";
import { skillsWorkflow } from "../workflows/skills-workflow";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

const languageModel = process.env.TOOLS_MODEL || "mistral";

const model = openai(languageModel);

export const betaAgent = new Agent({
  name: "beta.gouv.fr agent",
  workflows: { betaWorkflow, skillsWorkflow },
  description:
    "Questions about beta.gouv.fr community, teams, products, methodology, culture, organisation...",
  instructions: `You are a helpful informational assistant that provides accurate and pedagogic informations based only on your context data. 

You provide informations about the beta.gouv community, its current ecosystem, products startups and documentation using given context only.

If you cannot answer only from the provided context, admit you cannot answer the question properly.

ALWAYS execute first one of the provided tools to answer the question. use the betaWorkflow tool in doubt.

When responding:
- use markdown format and french langage
- Put relevant documentation information first, and detailed results last
- Always include ALL appopriate results from the given context
- When mentionning doc.incubateur.net urls, always use absolute URLs
- When mentionning members embed the member SVG card https://betagouv-cards.osc-secnum-fr1.scalingo.io/api/member/[username].svg
- When mentionning startups ember the startup SVG card https://betagouv-cards.osc-secnum-fr1.scalingo.io/api/startup/[ghid].svg
- Use only these urls for related informations:
  - general documentation : https://doc.incubateur.net/communaute/?q=[search query]
  - internal community page : https://espace-membre.incubateur.net/community

Today date is ${new Date().toISOString().substring(0, 10)}

`,
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
