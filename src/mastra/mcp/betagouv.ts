import { createTool } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";
import z from "zod";

import { searchMemberTool } from "../tools/search-member";
import { searchStartupTool } from "../tools/search-startup";
import { searchDocumentationTool } from "../tools/search-documentation";

// const searchMember = createTool({
//   id: "searchMember",
//   description: "Search informations about a specific member",
//   inputSchema: z.object({
//     name: z.string().nonempty().describe("Name of the person."),
//   }),
//   // outputSchema: z.string().nonempty(),
//   execute: async ({ context }) => {
//     console.log("execute mcp.searchMember", context);
//     return {
//       name: context.name,
//       role: "boss in design and UX",
//     };
//   },
// });

export const betagouv = new MCPServer({
  name: "betagouv",
  description:
    "get informations about betagouv members, teams and digital products",
  version: "0.1.0", // we will add more configuration here later
  tools: { searchMemberTool, searchStartupTool },
});
