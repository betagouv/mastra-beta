import { createTool } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";
import z from "zod";

import { searchMemberTool } from "../tools/search-member";
import { searchMembersTool } from "../tools/search-members";
import { searchStartupTool } from "../tools/search-startup";
import { searchDocumentationTool } from "../tools/search-documentation";

export const betagouv = new MCPServer({
  name: "betagouv",
  description:
    "get informations about betagouv members, teams and digital products",
  version: "0.1.0", // we will add more configuration here later
  tools: {
    searchMemberTool,
    searchMembersTool,
    searchStartupTool,
    searchDocumentationTool,
  },
});
