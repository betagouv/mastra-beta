import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { betaAgent } from "./agents/beta-agent";
import { betagouv } from "./mcp/betagouv";
import { pgVector } from "./pgvector";
import { betaWorkflow } from "./workflows/beta-workflow";
import { skillsWorkflow } from "./workflows/skills-workflow";
import { docDetectionAgent } from "./agents/doc-detection-agent";
import { sqlAgent } from "./agents/sql-agent";
import { topicExtractorAgent } from "./agents/topic-extractor-agent";
import { competencesExtractorAgent } from "./agents/competences-extractor-agent";
import { sqlDetectionAgent } from "./agents/sql-detection-agent";

export const mastra = new Mastra({
  mcpServers: { betagouv },
  agents: {
    betaAgent,
    docDetectionAgent,
    topicExtractorAgent,
    competencesExtractorAgent,
    sqlAgent,
    sqlDetectionAgent,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  vectors: { pgVector },
  workflows: { betaWorkflow, skillsWorkflow },

  logger: new PinoLogger({
    name: "Mastra",
    level: "debug",
  }),

  server: {
    middleware: [
      {
        handler: async (c, next) => {
          const authHeader = c.req.header("Authorization");
          if (authHeader === process.env.AUTH_CODE) {
            await next();
            return;
          }
          return new Response("Unauthorized", { status: 401 });
        },
        path: "/*",
      },
      // Add a global request logger
      async (c, next) => {
        console.log(`${c.req.method} ${c.req.url}`);
        await next();
      },
    ],
  },
});
