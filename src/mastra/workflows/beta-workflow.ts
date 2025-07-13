import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Client } from "pg";
import { z } from "zod";
import { MemberApiData, searchMember } from "../tools/search-member";
import { searchStartup, StartupApiData } from "../tools/search-startup";
import { markdownAgent } from "../agents/markdown-agent";
import { sqlAgent } from "../agents/sql-agent";
import { topicExtractorAgent } from "../agents/topic-extractor-agent";
import { docQuerySchema, userQuerySchema } from "../tools/schemas";
import { docDetectionAgent } from "../agents/doc-detection-agent";
import { sqlDetectionAgent } from "../agents/sql-detection-agent";
import { searchDocumentationTool } from "../tools/search-documentation";
import { markdownTable } from "markdown-table";

const client = new Client({ connectionString: process.env.BETA_DATABASE_URL });
await client.connect();

const topicsQuerySchema = docQuerySchema.extend({
  topics: z.object({
    persons: z.array(z.string()),
    topics: z.array(z.string()),
    isSpecificQuery: z.boolean(),
  }),
});

type TopicsQuerySchema = z.infer<typeof topicsQuerySchema>["topics"];

const extractTopics = (query: string) => {
  return topicExtractorAgent
    .generate(query)
    .then((r) => {
      const json = r.text
        .replace(/```json/, "")
        .replace(/```/, "")
        .trim();
      console.log("json", json);
      return JSON.parse(json) as TopicsQuerySchema;
    })
    .catch((e) => {
      console.error("ERROR", e);
      throw e;
    });
};

const startupMarkdown = (data: Record<string, any>) => {
  //  console.log("dataxxx", data);
  if (!data) return "";
  const sortedPhases = data.attributes.phases.sort(
    //@ts-ignore
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  );
  return `### Startup ${data.attributes.name}
${data.attributes.pitch}  

 - URL: https://beta.gouv.fr/startups/${data.id}
 - ghid: ${data.id}
 - link: ${data.attributes.link}  
 - phase: ${sortedPhases.length ? sortedPhases[0].name : ""}  

${data.attributes.description}

#### Equipe

${data.members.length && data.members.map((m: MemberApiData) => ` - [${m.fullname}](https://espace-membre.incubateur.net/community/${m.id} (${m.domaine})), ${m.competences}`).join("\n")}
  
`;
};

const memberMarkdown = (data: Record<string, any>) => {
  console.log("dataxxx", data);
  if (!data) return "";
  return `### Membre [${data.fullname}](https://espace-membre.incubateur.net/community/${data.id})
${data.bio}  

 - URL: https://espace-membre.incubateur.net/community/${data.id}
 - Username: ${data.id}
 - Domaine: ${data.domaine}
 - Compétences: ${(data.competences || []).join(", ")}
 - Link: ${data.link}
 
 #### Missions

 ${data.missions.map((m: MemberApiData["missions"][number]) => ` - du ${m.start} au ${m.end} dans les startups : ${(m.startups || []).join(", ")}`).join("\n")}
`;
};

/* ------- NEW */
const entityReferenceSchema = z.object({
  type: z.enum(["startup", "member"]).describe("entity type"),
  id: z.string(),
  label: z.string(),
});

const hinterStepOutputSchema = userQuerySchema.merge(
  z.object({
    hints: z.object({
      documentationScore: z
        .number()
        .min(0)
        .max(1)
        .describe("probability the documentation should answer the user query"),
      databaseScore: z
        .number()
        .min(0)
        .max(1)
        .describe("probability a database query should answer the user query"),
      namedEntities: z
        .array(entityReferenceSchema)
        .describe("user query detected named entities"),
    }),
  })
);

const getDocumentationScore = async (query: string) => {
  const docDetectionAgentResult = (
    await docDetectionAgent.generate(`Question: ${query}`)
  ).text
    .replace(/```json/, "")
    .replace(/```.*/, "")
    .trim();

  const detectionDocumentationResult = JSON.parse(docDetectionAgentResult) as {
    topic: string;
    score: number;
  };

  console.log("detectionDocumentationResult", detectionDocumentationResult);
  return detectionDocumentationResult.topic === "out_of_scope"
    ? 0
    : detectionDocumentationResult.score;
};

const getDatabaseScore = async (query: string) => {
  const sqlDetectionAgentResult = (
    await sqlDetectionAgent.generate(`Question: ${query}`)
  ).text;

  console.log("sqlDetectionAgentResult", sqlDetectionAgentResult);

  const sqlDetectionAgentResultData = sqlDetectionAgentResult
    .replace("```json", "")
    .replace("```", "")
    .trim();

  console.log("sqlDetectionAgentResultData", sqlDetectionAgentResultData);

  const databaseResult = JSON.parse(sqlDetectionAgentResultData) as {
    score: number;
  };

  console.log("databaseResult", databaseResult);

  return databaseResult.score;
};

const getNamedEntities = async (
  args: Awaited<ReturnType<typeof extractTopics>>
) => {
  const entities: ({
    type: "member" | "startup";
    label: string;
  } & (MemberApiData | StartupApiData))[] = [];
  await Promise.all(
    args.persons.map(async (memberName) => {
      const member = await searchMember(memberName);
      if (member) {
        entities.push({
          ...member,
          type: "member",
          label: member.fullname,
        });
      }
    })
  );

  await Promise.all(
    args.topics.map(async (startupName) => {
      const startup = await searchStartup(startupName);
      if (startup) {
        entities.push({
          ...startup,
          type: "startup",
          label: startup.attributes.name,
        });
      }
    })
  );

  return entities;
};

const hintersStep = createStep({
  id: "hinters",
  description: "Add hints to the user query",
  inputSchema: userQuerySchema,
  retries: 5,
  outputSchema: hinterStepOutputSchema,
  execute: async ({ inputData }) => {
    console.log("hintersStep", inputData);
    // check if query related to documentation
    const documentationScore = await getDocumentationScore(inputData.query);
    // check if named entities discovered
    const topicsResult = await extractTopics(inputData.query);
    const namedEntities =
      topicsResult.isSpecificQuery && documentationScore < 0.8
        ? await getNamedEntities(topicsResult)
        : [];
    // check if query related to database
    const databaseScore = await getDatabaseScore(inputData.query);
    return {
      ...inputData,
      hints: {
        documentationScore: namedEntities.length ? 0 : documentationScore,
        databaseScore,
        namedEntities,
      },
    };
  },
});

const documentationResultSchema = z.object({
  url: z.string(),
  text: z.string(),
  id: z.string(),
});

const enrichersStep = createStep({
  id: "enrichers",
  description: "Add content bas on the user query",
  inputSchema: hinterStepOutputSchema,
  retries: 5,
  outputSchema: hinterStepOutputSchema.merge(
    z.object({
      entities: z
        .array(z.object({}))
        .describe("user query related named entities details in markdown"),
      documents: z
        .array(documentationResultSchema)
        .describe("user query related documentation chunks"),
      rows: z
        .array(z.object({}))
        .describe("user query related database entries"),
    })
  ),
  execute: async ({ inputData, runtimeContext }) => {
    console.log("enrichersStep");
    const documents = [];
    const rows = [];
    if (
      inputData.hints.documentationScore > 0.3 &&
      inputData.hints.databaseScore < 0.8
    ) {
      const documentsResults = ((searchDocumentationTool.execute &&
        (await searchDocumentationTool.execute({
          context: { query: inputData.query },
          runtimeContext,
        }))) || { result: { sources: [], relevantContext: [] } }) as {
        result: { sources: any[]; relevantContext: any[] };
      };

      if (documentsResults.result.sources.length) {
        documents.push(...documentsResults.result.relevantContext);
      }
    }
    if (
      inputData.hints.databaseScore > 0.4 ||
      (inputData.hints.documentationScore === 0 &&
        inputData.hints.namedEntities.length === 0)
    ) {
      let additionnalPrompt = "";
      if (inputData.hints.namedEntities.length) {
        additionnalPrompt += `Propable database entities: \n${inputData.hints.namedEntities.map((e) => ` - ${e.type}: ${e.type === "member" ? "username" : "ghid"}=${e.id}`).join("\n")}\n\n`;
      }
      const prompt = additionnalPrompt + `Query: ${inputData.query}`;

      //console.log("SQL prompt", prompt);
      const sql = (await sqlAgent.generate(prompt)).text
        .replace(/```sql/, "")
        .replace(/```/, "")
        .trim();
      console.log("sql", sql);

      // todo: explain SQL
      try {
        const res = await client.query(sql);
        //console.log("rows", res.rows);
        if (!res.rows.length) {
          throw "Cannot extract data";
        }
        rows.push(...res.rows);
      } catch (e) {
        console.error(e);
        // just skip on invalid sql
        //throw "Invalid query";
      }
    }
    const entities = inputData.hints.namedEntities.map((e) =>
      e.type === "member" ? memberMarkdown(e) : startupMarkdown(e)
    );
    return {
      ...inputData,
      entities,
      documents,
      rows,
    };
  },
});

/**
 * Processes a markdown string to convert relative links to absolute URLs
 * and removes .md extensions from all links
 *
 * @param markdown - The markdown string to process
 * @param baseUrl - The base URL to use for relative links
 * @returns The processed markdown string
 */
function processMarkdownLinks(markdown: string, baseUrl: string): string {
  // Ensure baseUrl ends with a slash for proper URL joining
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  // Regular expression to match markdown links: [text](url) and [text](url "title")
  const linkRegex = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;

  return markdown.replace(linkRegex, (match, text, url, title) => {
    let processedUrl = url;

    // Remove .md extension if present
    if (processedUrl.endsWith(".md")) {
      processedUrl = processedUrl.slice(0, -3);
    }

    // Convert relative URLs to absolute URLs
    if (!isAbsoluteUrl(processedUrl)) {
      // Remove leading './' if present
      if (processedUrl.startsWith("./")) {
        processedUrl = processedUrl.slice(2);
      }

      // Handle '../' paths by resolving them properly
      if (processedUrl.includes("../")) {
        try {
          const resolvedUrl = new URL(processedUrl, normalizedBaseUrl);
          processedUrl = resolvedUrl.href;
        } catch (error) {
          // If URL construction fails, fall back to simple concatenation
          processedUrl =
            normalizedBaseUrl + processedUrl.replace(/^\.\.\/+/, "");
        }
      } else {
        // Simple relative path
        processedUrl = normalizedBaseUrl + processedUrl;
      }
    }

    // Reconstruct the markdown link with title if present
    if (title) {
      return `[${text}](${processedUrl} "${title}")`;
    } else {
      return `[${text}](${processedUrl})`;
    }
  });
}

/**
 * Helper function to check if a URL is absolute
 *
 * @param url - The URL to check
 * @returns True if the URL is absolute, false otherwise
 */
function isAbsoluteUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return url.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(url);
  }
}

const formatterStep = createStep({
  id: "formatter",
  description: "Format context to answer the query",
  inputSchema: enrichersStep.outputSchema,
  outputSchema: z.object({
    context: z.string().describe("Retrieved related data"),
    query: z.string(),
    //answer: z.string(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    console.log("formatterStep", inputData);
    let context = "";
    if (inputData.entities.length) {
      context += "\n## Related Named entities\n\n";
      context += inputData.entities.map((e) => `### ${e}`).join("\n\n");
      context += "\n\n\n";
    }
    if (inputData.documents.length) {
      context += "\n## Related documentation entries\n\n";
      context += inputData.documents
        .map(
          (d) => `### ${d.url}\n\n${processMarkdownLinks(d.text, d.url)}\n\n`
        )
        .join("\n\n");
      context += "\n\n\n";
    }
    if (inputData.rows.length) {
      context += "\n## Related database rows that match the user query\n\n";
      context += markdownTable([
        Object.keys(inputData.rows[0]),
        // @ts-ignore todo
        ...inputData.rows.map((r) => Object.values(r)),
      ]);
      context += "\n\n\n";
      //      context += "\n## SQL Query used to get the results\n\n";
      // context += `\`\`\`sql\n${}\n\`\`\`\n\n`
      //    context += "\n\n\n";
    }
    return {
      context,
      query: inputData.query,
    };
  },
});

export const betaWorkflow = createWorkflow({
  id: "beta-workflow",
  description:
    "Return context data about beta.gouv.fr members, teams and startups",
  inputSchema: userQuerySchema,
  outputSchema: z.object({ answer: z.string() }),
})
  .then(hintersStep)
  .then(enrichersStep)
  .then(formatterStep)
  .commit();
