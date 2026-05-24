import { notFound } from "next/navigation";
import { getPublishedPostBySlug } from "@/features/posts/queries";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const resolvedParams = await params;
    const post = await getPublishedPostBySlug(resolvedParams.slug);

    // If the post does not exist or is not published, render 404
    if (!post) {
        notFound();
    }

    return (
        <main className="container mx-auto py-12 px-4 max-w-3xl min-h-screen">
            {/* Back Navigation */}
            <div className="mb-8">
                <Link href="/blog">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 -ml-3 text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Blog
                    </Button>
                </Link>
            </div>

            <article className="space-y-8">
                <header className="space-y-4 border-b border-border pb-6">
                    {/* Title */}
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                        {post.title}
                    </h1>

                    {/* Meta info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={post.createdAt?.toISOString()}>
                            {new Date(post.createdAt!).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </time>
                    </div>
                </header>

                {/* Markdown Content */}
                <div className="prose dark:prose-invert max-w-none leading-relaxed">
                    <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            code(props) {
                                const { children, className, node, ref, ...rest } = props;
                                const match = /language-(\w+)/.exec(className || "");
                                const isBlock = match || String(children).includes("\n");

                                return isBlock ? (
                                    <SyntaxHighlighter
                                        {...rest}
                                        PreTag="div"
                                        language={match ? match[1] : "text"}
                                        style={vscDarkPlus}
                                    >
                                        {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code {...rest} className={className}>
                                        {children}
                                    </code>
                                );
                            },
                        }}
                    >
                        {post.content}
                    </ReactMarkdown>
                </div>
            </article>
        </main>
    );
}
