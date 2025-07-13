import { MCPClient } from "@mastra/mcp";

export const mcp = new MCPClient({
  servers: {
    // filesystem: {
    //   //capabilities:{}
    //   command: "npx",
    //   args: [
    //     "-y",
    //     "@modelcontextprotocol/server-filesystem",
    //     "/Users/julien.bouquillon/Downloads",
    //   ],
    // },
    // betagouv: {
    //   //capabilities:{}
    //   url: new URL("http://127.0.0.1:3000/mcp"),
    //   //command: "npx",
    //   //   args: [
    //   //     "-y",
    //   //     "@modelcontextprotocol/server-filesystem",
    //   //     "/Users/julien.bouquillon/Downloads",
    //   //   ],
    // },
  },
});
