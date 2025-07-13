import { PgVector } from "@mastra/pg";

// Initialize Mastra instance
export const pgVector = new PgVector({
  connectionString: process.env.POSTGRES_CONNECTION_STRING!,
});
