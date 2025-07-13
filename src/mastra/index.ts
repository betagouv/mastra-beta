import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { betaAgent } from "./agents/beta-agent";
import { betagouv } from "./mcp/betagouv";
import { pgVector } from "./pgvector";
import { betaWorkflow } from "./workflows/beta-workflow";
import { docDetectionAgent } from "./agents/doc-detection-agent";
//import { docSearchAgent } from "./agents/-doc-search-agent";
import { markdownAgent } from "./agents/markdown-agent";
import { sqlAgent } from "./agents/sql-agent";
import { topicExtractorAgent } from "./agents/topic-extractor-agent";
import { sqlDetectionAgent } from "./agents/sql-detection-agent";

export const mastra = new Mastra({
  // workflows: { weatherWorkflow },

  mcpServers: { betagouv },
  agents: {
    betaAgent,
    docDetectionAgent,
    // docSearchAgent,
    markdownAgent,
    topicExtractorAgent,
    sqlAgent,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  vectors: { pgVector },
  workflows: { betaWorkflow },

  logger: new PinoLogger({
    name: "Mastra",
    level: "debug",
  }),
});
