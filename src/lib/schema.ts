import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const desks = pgTable("desks", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  managerName: text("manager_name").notNull(),
  managerKey: text("manager_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const requests = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deskId: uuid("desk_id")
      .notNull()
      .references(() => desks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    category: text("category").notNull().default("other"),
    status: text("status").notNull().default("open"),
    priority: text("priority").notNull().default("normal"),
    requesterName: text("requester_name").notNull().default("Unknown"),
    assigneeName: text("assignee_name"),
    source: text("source").notNull().default("form"),
    sourceMessage: text("source_message"),
    closeNote: text("close_note"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("requests_desk_idx").on(table.deskId),
    index("requests_desk_status_idx").on(table.deskId, table.status),
  ],
);

export type Desk = typeof desks.$inferSelect;
export type RequestRow = typeof requests.$inferSelect;
