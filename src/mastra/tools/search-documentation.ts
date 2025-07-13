import { createOpenAI } from "@ai-sdk/openai";
import { createVectorQueryTool } from "@mastra/rag";
import { pgVector } from "../pgvector";
import { z } from "zod";
import { createTool } from "@mastra/core";

const embeddingModel = process.env.EMBEDDING_MODEL || "bge-multilingual-gemma2";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a tool for semantic search over our paper embeddings
export const searchDocumentationVectorTool = createVectorQueryTool({
  id: "search-documentation",
  description:
    "Search for documentation on : methodology, culture, organisation, services, tools and day to day process and technical questions on the betagouv internal organisation",
  //vectorStoreName: "pgVector",
  indexName: "documentation",
  model: openai.embedding(embeddingModel),

  includeSources: true,
  enableFilter: false,
  vectorStore: pgVector,

  // execute: () => {
  //   return true;
  // },
});

// create dedicated tool
// if not, cannot work directly with the tool in the workflow :|
export const searchDocumentationTool = createTool({
  id: "search-documentation-tool",
  description: "Search for documentation on a given query",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
  }),
  execute: async ({ context, runtimeContext }) => {
    const result = (await searchDocumentationVectorTool.execute({
      context: { queryText: context.query, topK: 10 },
      runtimeContext,
    })) as { result: { sources: any[] } };

    return { result };
  },
});
