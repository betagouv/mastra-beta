import { Agent, createTool } from "@mastra/core";
import { findResults } from "./utils";
import memoizee from "memoizee";
import z from "zod";
import { getMembersData } from "./search-member";
import { createOpenAI } from "@ai-sdk/openai";

import { betaAgent } from "../agents/beta-agent";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

const embeddingModel = process.env.EMBEDDING_MODEL || "bge-multilingual-gemma2";
const languageModel = process.env.LANGUAGE_MODEL || "llama-3.3-70b-instruct";

interface MemberApiData {
  id: string;
  fullname: string;
  role: string;
  domaine: string;
  link: string;
  bio: string;
  missions: { start: string; end: string; startups: string[] }[];
  competences: string[];
}

const members = await getMembersData();

const instructions = `Based on the user input, you return up to 3 relevant categories from the below list.

Pick only the first most relevant item or synonyms if it fits closely the user query.

The result is returned as a raw text list without any other text or wrappign around.

LIST:
${members.skills.map((s) => ` - ${s}\n`)}
`;

const skillsAgent = new Agent({
  name: "skills-search-agent",
  instructions,
  model: openai(languageModel),
});

const extractSkillsFromQuery = async (query: string) =>
  skillsAgent
    .generate(query)
    .then((result) =>
      result.text.split("\n").map((r) => r.replace(/^\s*[-*]\s*/, ""))
    );

export const searchMembersTool = createTool({
  id: "search-member",
  description: "Search for members by skills",
  inputSchema: z.object({
    query: z.string().describe("Skill"),
  }),
  execute: async (context, options) => {
    if (context.context.query) {
      const skills = await extractSkillsFromQuery(context.context.query);
      console.log("SKILLS", context.context.query, skills);
      const result = members.members
        .filter((member) =>
          (member.competences || []).find((competence) =>
            skills.includes(competence)
          )
        )
        .map((m) => ({
          id: m.id,
          fullname: m.fullname,
          domaine: m.domaine,
          competences: m.competences,
        }))
        .slice(0, 50);
      return { result };
    }
    return { result: "no results" };
  },
});
