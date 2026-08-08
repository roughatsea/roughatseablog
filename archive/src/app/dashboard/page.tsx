import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPostsByAuthor } from "@/features/posts/queries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ExternalLink, Pencil } from "lucide-react";
import { DeletePostButton } from "@/features/posts/components/DeletePostButton";

export default async function DashboardPage() {
    // 1. Protect the route by checking the NextAuth session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/api/auth/signin");
    }

    // 2. Fetch the user's posts using the query we created
    const posts = await getPostsByAuthor(session.user.id);

    return (
        <main className="container mx-auto py-10 px-4 max-w-5xl">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-8 mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-sky-400">
                        Captain&apos;s Log
                    </h1>
                    <p className="text-muted-foreground text-sm mt-2">
                        Welcome back, <span className="font-semibold text-foreground">{session.user.name || session.user.email}</span>. Manage your posts and drafts below.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/new">
                        <Button className="shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Write New Post
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-2xl p-16 text-center bg-card/30 backdrop-blur-sm">
                    <div className="p-4 bg-muted/50 rounded-full mb-4">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No logs written yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-6 text-sm">
                        The sea is quiet. Chart your journey by drafting or publishing your first blog post.
                    </p>
                    <Link href="/dashboard/new">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create First Post
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className="group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border rounded-xl bg-card hover:bg-accent/40 hover:border-muted-foreground/30 hover:shadow-md transition-all duration-300"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h2>
                                    {post.isPublished ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Published
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                            Draft
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span>
                                        {new Date(post.createdAt!).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                    {post.updatedAt && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                Updated {new Date(post.updatedAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/blog/${post.slug}`}>
                                    <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                                        View
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                                <Link href={`/dashboard/edit/${post.id}`}>
                                    <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                    </Button>
                                </Link>
                                <DeletePostButton postId={post.id} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
