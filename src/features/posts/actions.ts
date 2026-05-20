"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, createPostSchema } from "./schema";
import { revalidatePath } from "next/cache";

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

    return { success: true };
}