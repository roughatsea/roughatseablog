import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { CreatePostForm } from "@/features/posts/components/CreatePostForm";

export default async function ComposePage() {
    // Protect the route at the server level.
    // If you aren't logged in, instantly kick you back to the home page.
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/");
    }

    return (
        <main className="max-w-3xl mx-auto py-12 px-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Write a New Post
                </h1>
                <p className="text-gray-500 mt-2">
                    Building the ship as you sail it.
                </p>
            </div>

            <CreatePostForm />
        </main>
    );
}