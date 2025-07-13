import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";

const languageModel = process.env.TOOLS_MODEL || "qwen2.5-coder-32b-instruct"; //mistral-small-3.1-24b-instruct-2503"; //mistral-nemo-instruct-2407"; //gemma-3-27b-it"; //mistral-nemo-instruct-2407"; //llama-3.3-70b-instruct";

const instructions = `Analyse a user query and extract metadata as raw JSON.

 - "persons": persons names
 - "topics": main topics of the query if any. could be a team name, a product name, a startup name
 - "isSpecificQuery": if the query names directly some specific team, startup, person

Example for the query "does bernard minet and thierry henri work at EDF ?"

{
  "persons": ["bernard minet", "thierry henri"],
  "topics": ["EDF"],
  "isSpecificQuery": true
}

Example for the query "which products works on healthcare ?"

{
  "persons": [],
  "topics": ["healthcare"],
  "isSpecificQuery": false
}
`;

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export const topicExtractorAgent = new Agent({
  name: "topic-extractor-agent",
  instructions,
  model: openai(languageModel),
});
