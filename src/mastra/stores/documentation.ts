import { createOpenAI } from "@ai-sdk/openai";
import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { pgVector } from "../pgvector";
import { importMarkdownsFromZip, type MarkdownFileItem } from "../tools/utils";
import pAll from "p-all";

const indexName = "documentation";
const embeddingModel = process.env.EMBEDDING_MODEL || "bge-multilingual-gemma2";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

const importDocumentation = async () => {
  console.log("Importing doc.incubateur.net-communaute...");

  const markdowns = await importMarkdownsFromZip(
    "https://github.com/betagouv/doc.incubateur.net-communaute/archive/refs/heads/master.zip"
  );

  const documents = markdowns.filter(
    (m) =>
      !(
        m.path.includes("doc.incubateur.net-communaute-master/.gitbook/") ||
        m.path.includes("doc.incubateur.net-communaute-master/old/") ||
        m.path.includes("doc.incubateur.net-communaute-master/SUMMARY.md")
      )
  );

  await pgVector.createIndex({
    indexName,
    indexConfig: { type: "flat" },
    dimension: 3584,
  });

  await pAll(
    documents.map((m) => () => importMarkdownDocument({ ...m })),
    { concurrency: 1 }
  );

  console.log("markdowns imported:", documents.length);

  pgVector.disconnect();
};

const importMarkdownDocument = async ({ path, content }: MarkdownFileItem) => {
  const doc = MDocument.fromMarkdown(content);
  const chunks = await doc.chunk({
    // strategy: "markdown",
    //  size: 1024,
    //overlap: 256,
    //separator: "\n",
  });

  const basePath = path.replace(
    /^doc\.incubateur\.net-communaute-master\//,
    ""
  );

  console.log("Doc:", basePath);
  console.log("Number of chunks:", chunks.length);

  const { embeddings } = await embedMany({
    model: openai.embedding(embeddingModel),
    values: chunks.map((chunk) => basePath + " " + chunk.text),
  });

  const docUrl = `https://doc.incubateur.net/communaute/${basePath.replace(/\/README\.md$/, "").replace(/\.md$/, "")}`;

  await pgVector.upsert({
    indexName,
    vectors: embeddings,
    metadata: chunks.map((chunk) => ({
      text: chunk.text,
      path: basePath,
      url: docUrl,
      source: "documentation",
    })),
  });
};

importDocumentation();
