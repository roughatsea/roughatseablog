import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { PostForm } from "@/features/posts/components/PostForm";

export default async function NewPostPage() {
    // Protect the route: Kick unauthenticated users back to the homepage
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/");
    }

    return (
        <main className="container mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Write a New Post</h1>
                <p className="text-muted-foreground text-sm mt-2">
                    Documenting the struggle sessions. Building the ship as we sail it.
                </p>
            </div>

            <PostForm />
        </main>
    );
}