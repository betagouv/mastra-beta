import memoizee from "memoizee";
import { createTool } from "@mastra/core";
import z from "zod";
import { findResults } from "./utils";
import { getMembersData } from "./search-member";

interface StartupApiData {
  id: string;
  type: string;
  attributes: StartupApiDataAttributes;
  relationships: StartupApiDataRelationships;
}

interface StartupApiDataAttributes {
  name: string;
  pitch: string;
  stats_url: string;
  link: string;
  contact: string;
  content_url_encoded_markdown: string;
  events: StartupApiDataEvent[];
  phases: StartupApiDataPhase[];
  sponsors: string[];
  thematiques: string[];
  accessibility_status: string;
}

interface StartupApiDataEvent {
  name: string;
  date: string;
  comment: string;
}

interface StartupApiDataPhase {
  name: string;
  start: string;
  end: string;
}

interface StartupApiDataRelationships {
  incubator: StartupApiDataIncubator;
}

interface StartupApiDataIncubator {
  data: {
    type: string;
    id: string;
  };
}

const _getStartupsData = async () => {
  console.log("_getStartupsData");
  const startups = (await fetch("https://beta.gouv.fr/api/v2.6/startups.json")
    .then((r) => r.json())
    .then((j) => j.data)) as StartupApiData[];
  return {
    startups,
    index: startups.map((startup) => ({
      type: "startup",
      id: startup.id,
      label: startup.attributes.name,
    })),
  };
};

export const getStartupsData = memoizee(_getStartupsData, { maxAge: 5000 });

export const searchStartupTool = createTool({
  id: "search-startup",
  description:
    "Search for a startup or product from a given name.\n" +
    "Use this for fetch informations about some product, team, startup ",
  inputSchema: z.object({
    query: z
      .string()
      .describe("Name of the team, product or service, ex: code du travail"),
  }),
  execute: async (context, options) => {
    console.log("searchMemberTool.execute", context, options);
    const result = await searchStartup(context.context.query);
    console.log("searchMemberTool.result", result);
    if (!result) {
      return {
        error: `Cannot find informations about "${context.context.query}"`,
      };
    }
    return { result };
  },
});

export const searchStartup = async (query: string) => {
  const startups = await getStartupsData();
  const members = await getMembersData();
  const results = await findResults({ query, index: startups.index });
  const memberHasActiveMissionInStartup =
    (startupId: string) => (member: (typeof members.members)[number]) => {
      return member.missions.find(
        (m) =>
          (m.startups || []).includes(startupId) && // est dans cette equipe
          (!m.end || new Date(m.end) >= new Date()) && // mission pas terminée
          new Date(m.start) <= new Date() // mission démarée
      );
    };
  if (results.length) {
    const startupId = results[0].item.id;
    const startupData = startups.startups.find((m) => m.id === startupId);
    // todo: better format and add team
    return {
      ...startupData,
      content_url_encoded_markdown: null,
      description: decodeURIComponent(
        startupData?.attributes.content_url_encoded_markdown || ""
      ),
      members: members.members
        .filter(memberHasActiveMissionInStartup(startupId))
        .map((m) => ({
          role: m.role,
          fullname: m.fullname,
          id: m.id,
          bio: m.bio,
          domaine: m.domaine,
        })),
    };
  }
};
