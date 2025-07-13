import { createTool } from "@mastra/core";
import { findResults } from "./utils";
import memoizee from "memoizee";
import z from "zod";

export interface MemberApiData {
  id: string;
  fullname: string;
  role: string;
  domaine: string;
  link: string;
  bio: string;
  missions: { start: string; end: string; startups: string[] }[];
  competences: string[];
}

const _getMembersData = async () => {
  console.log("_getMembersData");
  const members = (
    (await fetch("https://beta.gouv.fr/api/v2.6/authors.json").then((r) =>
      r.json()
    )) as MemberApiData[]
  ).filter((m) =>
    // only members with active missions
    (m.missions || []).find((m2) => !m2.end || new Date(m2.end) >= new Date())
  );

  // extract skills
  const skills = members
    .flatMap((m) => m.competences)
    .reduce(
      (a, c) => {
        if (a[c] === undefined) a[c] = 0;
        a[c] += 1;
        return a;
      },
      {} as Record<string, number>
    );

  const sortedSkills = Object.entries(skills).sort((a, b) => b[1] - a[1]);

  return {
    members,
    skills: sortedSkills.slice(0, 100).map(([k]) => k), // pick 100 first skills
    index: members.map((author) => ({
      type: "member",
      id: author.id,
      label: author.fullname,
    })),
  };
};

export const getMembersData = memoizee(_getMembersData, { maxAge: 5000 });

export const searchMemberTool = createTool({
  id: "search-member",
  description:
    "Search for a member from a given name.\n" +
    "Use this for fetch informations about some community member",
  inputSchema: z.object({
    query: z.string().describe("Search query, ex: Ada Lovelace"),
  }),
  execute: async (context, options) => {
    console.log("searchMemberTool.execute", context, options);
    const result = await searchMember(context.context.query);
    console.log("searchMemberTool.result", result);
    if (!result) {
      return {
        error: `Cannot find informations about "${context.context.query}"`,
      };
    }
    return { result };
  },
});

export const searchMember = async (query: string) => {
  const members = await getMembersData();
  const results = await findResults({ query, index: members.index });
  console.log("searchMember.results", query, results);
  if (results.length) {
    const memberData = members.members.find((m) => m.id === results[0].item.id);
    return memberData;
  }
};
