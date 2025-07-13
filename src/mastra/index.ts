import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { weatherAgent } from "./agents/weather-agent";
import { betaAgent } from "./agents/beta-agent";
import { betagouv } from "./mcp/betagouv";
import { pgVector } from "./pgvector";

export const mastra = new Mastra({
  // workflows: { weatherWorkflow },
  mcpServers: { betagouv },
  agents: { betaAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  vectors: { pgVector },
  logger: new PinoLogger({
    name: "Mastra",
    level: "debug",
  }),
});
