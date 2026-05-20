import { notFound } from "next/navigation";
import { getPostBySlug } from "@/features/posts/queries";

// Next.js passes the URL parameters directly to the component
export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const resolvedParams = await params;
    const post = await getPostBySlug(resolvedParams.slug);

    // If someone types a URL that doesn't exist, trigger the 404 page
    if (!post) {
        notFound();
    }

    return (
        <main className="max-w-3xl mx-auto py-12 px-6">
            <article>
                <header className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        {post.title}
                    </h1>
                    <time className="text-sm text-gray-500 mt-2 block">
                        {new Date(post.createdAt!).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                        })}
                    </time>
                </header>

                {/* We use whitespace-pre-wrap to respect the line breaks from your textarea for now */}
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                    {post.content}
                </div>
            </article>
        </main>
    );
}