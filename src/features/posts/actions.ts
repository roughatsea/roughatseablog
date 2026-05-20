"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, createPostSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createPostAction(formData: unknown) {
    // 1. Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in to post.");
    }

    // 2. Validate the incoming data against our strict Zod schema
    const parsedData = createPostSchema.safeParse(formData);

    if (!parsedData.success) {
        throw new Error("Invalid form data");
    }

    const { title, content, isPublished } = parsedData.data;

    // 3. Generate a simple slug (e.g., "My FFXIV Lore" -> "my-ffxiv-lore")
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 4. Execute the database mutation
    await db.insert(posts).values({
        title,
        slug,
        content,
        isPublished,
        authorId: session.user.id,
    });

    // 5. Tell Next.js to purge the cache for the blog feed so the new post appears instantly
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/dashboard");

    return { success: true };
}

export async function updatePostAction(id: number, formData: unknown) {
    // 1. Authenticate request
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in.");
    }

    // 2. Validate input
    const parsedData = createPostSchema.safeParse(formData);
    if (!parsedData.success) {
        throw new Error("Invalid form data");
    }

    const { title, content, isPublished } = parsedData.data;

    // 3. Verify ownership
    const [existingPost] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

    if (!existingPost) {
        throw new Error("Post not found");
    }

    if (existingPost.authorId !== session.user.id) {
        throw new Error("Unauthorized: You do not own this post.");
    }

    // 4. Update the slug
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 5. Update DB
    await db
        .update(posts)
        .set({
            title,
            slug,
            content,
            isPublished,
            updatedAt: new Date(),
        })
        .where(eq(posts.id, id));

    // 6. Revalidate caches
    revalidatePath("/dashboard");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    revalidatePath(`/blog/${existingPost.slug}`);
    revalidatePath("/");

    return { success: true };
}

export async function deletePostAction(id: number) {
    // 1. Authenticate request
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in.");
    }

    // 2. Verify ownership
    const [existingPost] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

    if (!existingPost) {
        throw new Error("Post not found");
    }

    if (existingPost.authorId !== session.user.id) {
        throw new Error("Unauthorized: You do not own this post.");
    }

    // 3. Delete from DB
    await db.delete(posts).where(eq(posts.id, id));

    // 4. Revalidate caches
    revalidatePath("/dashboard");
    revalidatePath("/blog");
    revalidatePath(`/blog/${existingPost.slug}`);
    revalidatePath("/");

    return { success: true };
}