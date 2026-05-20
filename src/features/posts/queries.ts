import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "./schema";

// 1. Fetch all published posts for the home page feed
export async function getPublishedPosts() {
    return await db
        .select()
        .from(posts)
        .where(eq(posts.isPublished, true))
        .orderBy(desc(posts.createdAt));
}

// 2. Fetch a single post by its URL slug
export async function getPostBySlug(slug: string) {
    const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.slug, slug))
        .limit(1);

    return post;
}

// Fetch a single published post by its slug
export async function getPublishedPostBySlug(slug: string) {
    const [post] = await db
        .select()
        .from(posts)
        .where(and(eq(posts.slug, slug), eq(posts.isPublished, true)))
        .limit(1);

    return post;
}

// 3. Fetch all posts belonging to a specific author ID, ordered by newest first
export async function getPostsByAuthor(authorId: string) {
    return await db
        .select()
        .from(posts)
        .where(eq(posts.authorId, authorId))
        .orderBy(desc(posts.createdAt));
}

// 4. Fetch a single post by its ID
export async function getPostById(id: number) {
    const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

    return post;
}