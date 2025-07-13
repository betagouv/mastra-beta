import z from "zod";
import { StartupApiData } from "./search-startup";
import { MemberApiData } from "./search-member";

export const userQuerySchema = z.object({
  query: z.string().describe("Original full user query"),
});

export const entitySchema = z
  .object({
    type: z.enum(["member", "startup"]),
  })
  .catchall(z.any());

export const docDetectionSchema = z.object({
  documentation: z.object({
    topic: z.string(),
    score: z.number(),
    query: z.string().optional(),
  }),
});

export const docQuerySchema = userQuerySchema.merge(docDetectionSchema);

export const entitiesDocQuerySchema = docQuerySchema.extend({
  entities: z.array(entitySchema),
});

export type StartupEntitySchema = {
  type: "startup";
} & StartupApiData;

export type MemberEntitySchema = {
  type: "member";
} & MemberApiData;
