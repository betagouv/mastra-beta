declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      MASTRA_TELEMETRY_DISABLED: "1" | "0";
      POSTGRES_CONNECTION_STRING: string;
      BETA_DATABASE_URL: string;
      EMBEDDING_MODEL: string;
      LANGUAGE_MODEL: string;
      TOOLS_MODEL: string;
      SQL_MODEL: string;
      OPENAI_BASE_URL: string;
      OPENAI_API_KEY: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
