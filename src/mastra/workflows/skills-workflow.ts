import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { MemberApiData } from "../tools/search-member";
import { searchSkillsTool } from "../tools/search-skills";
import { getEspaceMembreCommunitySearchURL } from "../../utils";

const shuffleArray = (array: any[]): any[] => {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

const memberMarkdown = (data: MemberApiData) => {
  if (!data) return "";
  const created_at = data.missions
    .map((m) => m.start)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  return `### [${data.fullname}](https://espace-membre.incubateur.net/community/${data.id})

 - Date d'arrivée : ${created_at.split("-").reverse().join("/")}
 - Rôle: ${data.role}
 - Compétences: ${(data.competences || []).join(", ")}
 - Startups :  ${data.missions.map((m: MemberApiData["missions"][number]) => `${((m.startups || []).map((s) => `[${s}](${getStartupURL(s)})`) || []).join(", ")}`).join("\n")}
`;
};

export const userQuerySchema = z.object({
  query: z.string().describe("Original raw user query"),
});

const hinterStepOutputSchema = userQuerySchema.merge(
  z.object({
    hints: z.object({
      members: z.array(z.any()).describe("user query detected named entities"),
      skills: z.array(z.string()),
      //membersData: z.array(z.any()),
    }),
  })
);

const outputSchema = z.object({
  members: z.array(
    z.object({
      fullname: z.string(),
      username: z.string(),
    })
  ),
});

const hintsStep = createStep({
  id: "hinters",
  description: "Add hints to the user query",
  inputSchema: userQuerySchema,
  retries: 5,
  outputSchema: hinterStepOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    const searchSkillsToolResult = ((searchSkillsTool.execute &&
      (await searchSkillsTool.execute({
        context: { query: inputData.query },
        runtimeContext,
      }))) || { members: [], skill: [] }) as {
      members: any[];
      skills: [];
    };

    return {
      ...inputData,
      hints: {
        skills: searchSkillsToolResult.skills,
        members: shuffleArray(
          searchSkillsToolResult.members.slice(0, 15)
        ).slice(0, 5),
      },
    };
  },
});

const ListMembersStep = createStep({
  id: "context-builder",
  description: "Format context to answer the query",
  inputSchema: hintsStep.outputSchema,
  outputSchema: z.object({
    answer: z.string(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    // console.log("contextBuilderStep", inputData);
    if (inputData.hints.members.length === 0) {
      return {
        answer:
          "Nous n'avons pas trouvé de membre correspondant 🥲 peux-tu préciser ta recherche ? je me base sur les compétences déclarées dans l'espace membre",
      };
    }
    // only select first search filter
    const firstFilters = [
      { type: "active_only", value: true },
      inputData.hints.skills.map((s) => ({
        type: "competence",
        value: s,
      }))[0],
    ];
    const detailsURL = getEspaceMembreCommunitySearchURL(firstFilters);
    console.log("detailsURL", detailsURL);

    let answer = `Voici ${inputData.hints.members.length} membre${inputData.hints.members.length > 1 ? "s" : ""} correspondant${inputData.hints.members.length > 1 ? "s" : ""}  aux compétences ${inputData.hints.skills.join(", ")} :\n\n`;
    answer += inputData.hints.members
      .map((member) => memberMarkdown(member))
      .join("\n\n");
    answer += `👉 Plus de détails sur [l'espace membre](${detailsURL})`;
    console.log("answer", answer);
    return {
      // context,
      answer,
    };
  },
});

const getStartupURL = (ghid: string) => `https://beta.gouv.fr/startups/${ghid}`;
const getMemberSvgURL = (member: MemberApiData) =>
  `https://betagouv-cards.osc-secnum-fr1.scalingo.io/api/member/${member.id}.svg`;
const getMemberURL = (member: MemberApiData) =>
  `https://espace-member.incubateur.net/community/${member.id}.svg`;

const ListMembersStepWithSVG = createStep({
  id: "context-builder",
  description: "Format context to answer the query",
  inputSchema: hintsStep.outputSchema,
  outputSchema: z
    .object({
      answer: z.string().optional(),
    })
    .or(
      z.object({
        members: z.array(z.object({})).default([]).optional(),
        skills: z.array(z.string()).default([]).optional(),
        detailsURL: z.string(),
      })
    ),
  execute: async ({ inputData, runtimeContext }) => {
    // console.log("contextBuilderStep", inputData);
    if (inputData.hints.members.length === 0) {
      return {
        answer:
          "Nous n'avons pas trouvé de membre correspondant 🥲 peux-tu préciser ta recherche ? je me base sur les compétences déclarées dans l'espace membre",
      };
    }
    // only select first search filter
    const firstFilters = [
      { type: "active_only", value: true },
      inputData.hints.skills.map((s) => ({
        type: "competence",
        value: s,
      }))[0],
    ];
    const detailsURL = getEspaceMembreCommunitySearchURL(firstFilters);
    const getEspaceMembreMemberURL = (member: MemberApiData) =>
      `https://espace-membre.incubateur.net/community/${member.id}`;

    return {
      members: inputData.hints.members.map(
        (member) =>
          `[![](${getMemberSvgURL(member)})](${getEspaceMembreMemberURL(member)})`
      ),
      skills: inputData.hints.skills,
      detailsURL: `👉 Tous les détails et d'autres résultats sur [l'espace membre](${detailsURL})`,
    };
  },
});

export const skillsWorkflow = createWorkflow({
  id: "skills-workflow",
  description:
    "Use to search for community members by skill or to get help on some topics",
  inputSchema: userQuerySchema,
  outputSchema: outputSchema,
})
  .then(hintsStep)
  .then(ListMembersStepWithSVG)

  .commit();
