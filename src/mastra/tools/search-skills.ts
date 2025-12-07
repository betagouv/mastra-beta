import { Agent, createTool } from "@mastra/core";
import z from "zod";
import { getMembersData, memberApiDataSchema } from "./search-member";
import { createOpenAI } from "@ai-sdk/openai";
import { competencesExtractorAgent } from "../agents/competences-extractor-agent";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

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

const getSimilarity = (search: string[], terms: string[]): number => {
  // Return 0 if nothing to search for
  if (!search || search.length === 0) return 0;
  const normalize = (s: string) => (s || "").toLowerCase().trim();

  const normTerms = (terms || []).map(normalize).filter(Boolean);

  // Build character bigrams for Dice's coefficient
  const bigrams = (s: string) => {
    const str = s.replace(/\s+/g, " ");
    const padded = ` ${str} `;
    const out: string[] = [];
    for (let i = 0; i < padded.length - 1; i++)
      out.push(padded.slice(i, i + 2));
    return out;
  };

  const diceCoef = (a: string, b: string) => {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const A = bigrams(a);
    const B = bigrams(b);
    const counts = new Map<string, number>();
    for (const x of B) counts.set(x, (counts.get(x) || 0) + 1);
    let intersect = 0;
    for (const x of A) {
      const c = counts.get(x) || 0;
      if (c > 0) {
        intersect++;
        counts.set(x, c - 1);
      }
    }
    return (2 * intersect) / (A.length + B.length);
  };

  let sum = 0;
  for (const raw of search) {
    const s = normalize(raw);
    if (!s) continue;
    let best = 0;
    for (const t of normTerms) {
      // Exact or substring match -> perfect
      if (t === s || t.includes(s) || s.includes(t)) {
        best = 1;
        break;
      }
      // Otherwise use bigram similarity
      const sim = diceCoef(s, t);
      if (sim > best) best = sim;
    }
    sum += best;
  }

  const score = sum / search.length;
  // clamp and round to two decimals
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
};

export const searchSkillsTool = createTool({
  id: "search-members-skills",
  description: "Search for members by skills",
  inputSchema: z.object({
    query: z.string().describe("Skill(s)"),
    // count: z.number().default(10).optional(),
  }),
  outputSchema: z.object({
    members: z.array(memberApiDataSchema),
    skills: z.array(z.string()),
  }),
  execute: async (context, options) => {
    if (context.context.query) {
      const skillsResult = (
        await competencesExtractorAgent.generate(context.context.query)
      ).response.messages[0].content.toString();
      const skills: string[] = [];
      try {
        const resultSkills = JSON.parse(
          skillsResult
            .replace(/^```json/, "")
            .replace(/```$/, "")
            .trim()
        );
        skills.push(...resultSkills);
      } catch (e) {
        console.error(e);
      }
      //  console.log("skills", skills);
      // search member by competence
      const result = members.members
        .filter((member) =>
          (member.competences || []).find((competence) =>
            skills.includes(competence)
          )
        )
        .map((member) => ({
          ...member,
          similarity: getSimilarity(skills, member.competences),
        }))
        .sort((m1, m2) => m2.similarity - m1.similarity);
      //.slice(0, context.context.count);
      return { members: result, skills };
    }
    return { members: [], skills: [] };
  },
});
