import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";

const languageModel =
  process.env.LANGUAGE_MODEL || "qwen2.5-coder-32b-instruct"; //mistral-small-3.1-24b-instruct-2503"; //mistral-nemo-instruct-2407"; //gemma-3-27b-it"; //mistral-nemo-instruct-2407"; //llama-3.3-70b-instruct";

const instructions = `You're a markdown expert. Based on the user question and context only, create a structured and concise answer in french and use markdown.

RULES:
  - Only use data from context, dont use any prior knowledge
  - Include relevant details like URLs, full names and contact informations
  - Always include all the context data relevant to the query in your answers
  - Include relevant details like URLs, full names and contact informations
  - Keep responses fully informative and pedagogic
  - Alway use french language
  - Format with markdown and use tables when presenting multiple results
  - When mentionning member, always use this link [name](https://espace-membre.incubateur.net/community/[username]).
  - When mentionning startup, product or team, always use this link : [name](https://beta.gouv.fr/startups/[ghid]).
  - For documentation and doc.incubateur.net urls, use absolute URLs and strip the \`.md\` extension
  - For documentation related queries, be explicit and pedagogic in your answers
  - Always add relevant links add the end of your answers
`;

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export const markdownAgent = new Agent({
  name: "markdown-format-agent",
  instructions,
  model: openai(languageModel),
});
