import { betagouv } from "./betagouv";
betagouv.startStdio().catch((error) => {
  console.error("Error running MCP server:", error);
  process.exit(1);
});
