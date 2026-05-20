import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPostById } from "@/features/posts/queries";
import { PostForm } from "@/features/posts/components/PostForm";

interface EditPostPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
    // 1. Protect the route: Check authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/api/auth/signin");
    }

    // 2. Resolve parameters and validate the post ID
    const resolvedParams = await params;
    const postId = parseInt(resolvedParams.id, 10);
    if (isNaN(postId)) {
        notFound();
    }

    // 3. Retrieve the post and check if it exists
    const post = await getPostById(postId);
    if (!post) {
        notFound();
    }

    // 4. Critical security requirement: Verify user owns the post
    if (post.authorId !== session.user.id) {
        redirect("/dashboard");
    }

    // 5. Construct initialData and render the PostForm
    const initialData = {
        id: post.id,
        title: post.title,
        content: post.content,
        isPublished: post.isPublished ?? false,
    };

    return (
        <main className="container mx-auto py-10 px-4 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
                <p className="text-muted-foreground text-sm mt-2">
                    Revise your log entry and update the ship log.
                </p>
            </div>

            <PostForm initialData={initialData} />
        </main>
    );
}
