import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "../auth/schema"; // Import the users table
import { z } from "zod";

export const posts = pgTable("posts", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    isPublished: boolean("is_published").default(false),
    authorId: text("author_id").references(() => users.id, { onDelete: "cascade" }), // The new relational link
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// This defines the exact shape of the data the client is allowed to send
export const createPostSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    content: z.string().min(10, "Content must be at least 10 characters"),
    isPublished: z.boolean().default(false),
});

// We infer the TypeScript type directly from the Zod schema 
// so we don't have to write it twice.
export type CreatePostInput = z.input<typeof createPostSchema>;