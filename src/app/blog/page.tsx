import Link from "next/link";
import { getPublishedPosts } from "@/features/posts/queries";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";

export default async function BlogFeedPage() {
    const posts = await getPublishedPosts();

    return (
        <main className="container mx-auto py-12 px-4 max-w-4xl min-h-screen">
            {/* Header section */}
            <div className="border-b border-border pb-8 mb-12">
                <div className="flex items-center gap-2 text-indigo-500 mb-2">
                    <BookOpen className="h-5 w-5" />
                    <span className="text-sm font-semibold tracking-wider uppercase">Ship Logs</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                    Rough at Sea
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
                    A chronicle of build logs, hopeposts, and late-night architectural notes. Documenting the struggle sessions as we sail.
                </p>
            </div>

            {/* Posts Feed */}
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border rounded-2xl bg-card/30">
                    <p className="text-muted-foreground text-lg">No log entries have been published yet.</p>
                    <p className="text-muted-foreground text-sm mt-1">Check back later once the captain logs the next journey.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {posts.map((post) => (
                        <article
                            key={post.id}
                            className="group relative flex flex-col items-start gap-3 p-6 -mx-6 rounded-2xl hover:bg-accent/40 border border-transparent hover:border-border transition-all duration-300"
                        >
                            {/* Date */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <time dateTime={post.createdAt?.toISOString()}>
                                    {new Date(post.createdAt!).toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric"
                                    })}
                                </time>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                <Link href={`/blog/${post.slug}`}>
                                    {post.title}
                                </Link>
                            </h2>

                            {/* Snippet */}
                            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed line-clamp-3">
                                {post.content}
                            </p>

                            {/* Read More link */}
                            <div className="mt-2">
                                <Link
                                    href={`/blog/${post.slug}`}
                                    className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 group/link"
                                >
                                    Read full post
                                    <ArrowRight className="h-4 w-4 transform group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
