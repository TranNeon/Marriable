// export const usersRelations = relations(users, ({ many }) => ({
// 	posts: many(posts),
// }));
// export const postsRelations = relations(posts, ({ one }) => ({
// 	author: one(users, {
// 		fields: [posts.authorId],
// 		references: [users.id],
// 	}),
// }));
//

import { relations } from "drizzle-orm";
import { user } from "./auth-schema";
import { llmHistory, project } from "./schema";

export const userRelations = relations(user, ({ many }) => ({
  hasProject: many(project),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  owner: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  hasLlmHistory: many(llmHistory),
}));

export const llmHistoryRelations = relations(llmHistory, ({ one }) => ({
  parentProject: one(project, {
    fields: [llmHistory.projectId],
    references: [project.id],
  }),
}));
