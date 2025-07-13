import { createOpenAI } from "@ai-sdk/openai";
import { createVectorQueryTool } from "@mastra/rag";

const embeddingModel = process.env.EMBEDDING_MODEL || "bge-multilingual-gemma2";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a tool for semantic search over our paper embeddings
export const searchDocumentationTool = createVectorQueryTool({
  id: "search-documentation",
  description:
    "Search for documentation on : methodology, culture, organisation, day to day process and technical questions on the betagouv organisation",
  vectorStoreName: "pgVector",
  indexName: "documentation",
  model: openai.embedding(embeddingModel),
  includeSources: true,
  enableFilter: false,

  // execute: () => {
  //   return true;
  // },
});
