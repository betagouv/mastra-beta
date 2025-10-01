import { createOpenAI } from "@ai-sdk/openai";
import { Agent, MastraMessageV2 } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { betagouv as betagouvMCP } from "../mcp/betagouv";
import { betaWorkflow } from "../workflows/beta-workflow";
import { SummarizationMetric } from "@mastra/evals/llm";
import {
  ContentSimilarityMetric,
  ToneConsistencyMetric,
} from "@mastra/evals/nlp";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

const languageModel = process.env.TOOLS_MODEL || "mistral";

const mcpTools = await betagouvMCP.convertedTools;

import type { Processor } from "@mastra/core/processors";
import type { ChunkType } from "@mastra/core/stream";

class RowsEmbedder implements Processor {
  readonly name = "rows-embedder";

  constructor() {}

  processOutputStream(args: {
    part: ChunkType;
    streamParts: ChunkType[];
    state: Record<string, any>;
    abort: (reason?: string) => never;
  }): Promise<ChunkType | null | undefined> {
    console.log("processOutputStream");

    return Promise.resolve(args.part);
  }

  processOutputResult({
    messages,
    abort,
  }: {
    messages: MastraMessageV2[];
    abort: (reason?: string) => never;
  }): MastraMessageV2[] {
    console.log("processOutputResult");
    const responseText = messages
      .map((msg) =>
        msg.content.parts
          .filter((part) => part.type === "text")
          .map((part) => (part as any).text)
          .join("")
      )
      .join("");
    abort(`Response missing required keyword: plop`);
    //throw new Error("oio");
    console.log("messagesxxx", messages);
    // Check for required keywords
    // for (const keyword of this.requiredKeywords) {
    //   if (!responseText.toLowerCase().includes(keyword.toLowerCase())) {
    //     abort(`Response missing required keyword: ${keyword}`);
    //   }
    // }

    return messages;
  }

  // async processOutputStream({
  //   part,
  //   streamParts,
  //   state,
  //   abort,
  // }: {
  //   part: ChunkType;
  //   streamParts: ChunkType[];
  //   state: Record<string, any>;
  //   abort: (reason?: string) => never;
  // }): Promise<ChunkType | null | undefined> {
  //   // Track cumulative length in state, each processor gets its own state
  //   // if (!state.cumulativeLength) {
  //   //   state.cumulativeLength = 0;
  //   // }

  //   // if (part.type === "text-delta") {
  //   //   state.cumulativeLength += part.payload.text.length;

  //   //   if (state.cumulativeLength > this.maxLength) {
  //   //     abort(
  //   //       `Response too long: ${state.cumulativeLength} characters (max: ${this.maxLength})`
  //   //     );
  //   //   }
  //   // }
  //   if part.

  //   console.log("state", state);

  //   return part; // Emit the part
  // }
}

//console.log("mcpTools", mcpTools);

const model = openai(languageModel);

export const betaAgent = new Agent({
  name: "beta.gouv.fr agent",
  workflows: { betaWorkflow },
  description:
    "Questions about beta.gouv.fr community, teams, products, methodology, culture, organisation...",
  instructions: `You are a helpful informational assistant that provides accurate and pedagogic informations based only on your context data. 

You provide informations about the beta.gouv community, its current ecosystem, products and documentation only.

If you cannot answer only from the provided context, admit you cannot answer the question properly.

you MUST ALWAYS call the betagouv workflow to fetch relevant informations.

When responding:
- use markdown format and french langage
- Include relevant details from the context like URLs, full names and contact informations 
- Put relevant documentation information first, and detailed results last
- Always include related documentation links at the end of your answer
- Always embed members and startups names with their URL
- When mentionning doc.incubateur.net urls, always use absolute URLs
- When mentionning members use [fullname](https://espace-membre.incubateur.net/community/[username]) links
- When mentionning startups use [name](https://beta.gouv.fr/startups/[ghid]) links
- When an SQL query is provided, explain it at the end of your answer as a note. dont mention it if not.

Today date is ${new Date().toISOString().substring(0, 10)}

`,
  model,
  defaultGenerateOptions: {
    temperature: 0,
    //outputProcessors: [new RowsEmbedder()],
  },
  defaultStreamOptions: {
    temperature: 0,

    // onFinish: (args) => {
    //   console.log("onFinish", JSON.stringify(args));
    //   if (args.finishReason === "stop") {
    //   }
    // },
    // onStepFinish: (args) => {
    //   console.log("onStepFinish2", JSON.stringify(args));
    //   if (args.finishReason === "stop") {
    //   }
    // },
  },
  tools: {
    /*...mcpTools,searchDocumentationTool*/
  },
  // memory: new Memory({
  //   storage: new LibSQLStore({
  //     url: "file:../beta-agent8.db", // path is relative to the .mastra/output directory
  //   }),
  // }),
  evals: {
    // summarization: new SummarizationMetric(model),
    // contentSimilarity: new ContentSimilarityMetric(),
    // tone: new ToneConsistencyMetric(),
  },
  //  outputProcessors: [new RowsEmbedder()],
});
