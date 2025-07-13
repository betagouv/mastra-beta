import { randomUUID } from "node:crypto";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  isInitializeRequest,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import Fuse, { FuseIndex, FuseIndexOptions } from "fuse.js";
import { getMembersData } from "./search-member";
import { getStartupsData } from "./search-startup";
import fm from "front-matter";
//import yaml from "js-yaml";
//import { ExpressionBuilder, sql } from "kysely";
import unzipper, { Entry } from "unzipper";
import { ZodSchema, z } from "zod";
import { Readable } from "node:stream";
//import { Readable } from "node:stream";

export interface SearchItem {
  type: string;
  id: string;
  label: string;
}

export interface SearchResult {
  score: number;
  item: SearchItem;
}

// https://www.fusejs.io/api/options.html
const fuseOptions = {
  keys: ["id", "label"],
  includeScore: true,
  ignoreDiacritics: true,
  ignoreLocation: true,
  minMatchCharLength: 5,
  // shouldSort: true,
  //ignoreFieldNorm: true,
  //findAllMatches: true,
  threshold: 0.2,
};

export const findResults = async ({
  query,
  index,
  limit = 10,
}: {
  query: string;
  index: {
    type: string;
    id: string;
    label: string;
  }[];
  limit?: number;
}) => {
  const fuse = new Fuse(index, fuseOptions);
  const results = fuse
    .search(query)
    //.filter((r) => (r.score || Infinity) <= fuseOptions.threshold)
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, limit);
  //console.log("fuse results", query, results);
  return results;
};

export const parseMarkdown = async <T extends ZodSchema>(
  id: string,
  content: string
) => {
  try {
    const { attributes, body } = fm<z.infer<T>>(content);
    return { attributes: { ...attributes, ghid: id }, body };
  } catch (e) {
    console.error(e);
    return { attributes: {}, body: null };
  }
};

// Helper to convert a web ReadableStream to a Node.js Readable stream of Buffer
function webStreamToNodeStream(webStream: ReadableStream<Uint8Array>) {
  const nodeStream = new Readable({
    read() {},
  });
  (async () => {
    const reader = webStream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        nodeStream.push(Buffer.from(value));
      }
      nodeStream.push(null);
    } catch (err) {
      nodeStream.destroy(err as Error);
    }
  })();
  return nodeStream;
}

export type MarkdownFileItem = { path: string; content: string };

// load ZIP and extract markdowns
export const importMarkdownsFromZip: (
  zipUrl: string
) => Promise<MarkdownFileItem[]> = (zipUrl: string) => {
  const markdownFiles: MarkdownFileItem[] = [];

  return new Promise(async (resolve) => {
    const dataStream = await fetch(zipUrl).then((r) => r.body);
    if (!dataStream) return;

    webStreamToNodeStream(dataStream as ReadableStream<Uint8Array>)
      .pipe(unzipper.Parse())
      .on("entry", async function (entry: Entry) {
        let drain = true;
        // Object.keys(markdownData).forEach(async (key) => {
        if (entry.path.match(new RegExp(`\.md$`))) {
          drain = false;
          const content = await entry.buffer();
          markdownFiles.push({
            path: entry.path,
            content: content.toString(),
          });
        }
        // });
        if (drain) entry.autodrain();
      })
      .on("finish", () => {
        //console.log("\n", "Parsed", markdownFiles.length, "files", "\n");
        resolve(markdownFiles);
      })
      .on("error", (e) => {
        console.error("e", e);
        throw e;
      });
  });
};
