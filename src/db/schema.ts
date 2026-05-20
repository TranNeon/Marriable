import { user } from "auth-schema";
import { text, jsonb, integer, pgTable, varchar } from "drizzle-orm/pg-core";

import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const project = pgTable("project", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }),
  userId: text().references(() => user.id),
  attachedContainer: text(),
});

export const llmHistory = pgTable("llm_history", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }),
  projectId: integer().references(() => project.id, { onDelete: "cascade" }),
  content: jsonb().$type<ChatCompletionMessageParam[]>(),
});
