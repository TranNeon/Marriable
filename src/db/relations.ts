import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { session, user } from "./auth-schema";
import { llmHistory, project } from "./schema";

// export const projectRelations = relations(project, ({ one }) => ({
//   owner: one(user, {
//     fields: [project.userId],
//     references: [user.id],
//   }),
// }));

// export const sessionRelations = relations(llmHistory, ({ one }) => ({
//   project: one(project, {
//     fields: [llmHistory.projectId],
//     references: [project.id],
//   }),
// }));
