"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
);

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { createPostSchema, type CreatePostInput } from "../schema";
import { createPostAction, updatePostAction } from "../actions";

interface PostFormProps {
    initialData?: {
        id: number;
        title: string;
        content: string;
        isPublished: boolean;
    };
}

export function PostForm({ initialData }: PostFormProps) {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 1. Initialize the form, pre-filling defaults if initialData is provided
    const form = useForm<CreatePostInput>({
        resolver: zodResolver(createPostSchema),
        defaultValues: {
            title: initialData?.title ?? "",
            content: initialData?.content ?? "",
            isPublished: initialData?.isPublished ?? false,
        },
    });

    // --- Image Upload Logic ---
    const insertTextAtCursor = (textToInsert: string) => {
        const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = form.getValues("content");

        const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
        form.setValue("content", newValue, { shouldValidate: true });

        // Restore cursor after React updates the DOM
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = start + textToInsert.length;
            textarea.selectionEnd = start + textToInsert.length;
        }, 10);
    };

    const processFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed.");
            return;
        }

        const placeholder = `\n![Uploading ${file.name}...]()\n`;
        insertTextAtCursor(placeholder);

        try {
            const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                method: "POST",
                body: file,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Upload failed");
            }

            const data = await response.json();
            
            // Replace placeholder with real URL
            const currentValue = form.getValues("content");
            const finalImageMarkdown = `\n![${file.name}](${data.url})\n`;
            form.setValue("content", currentValue.replace(placeholder, finalImageMarkdown), { shouldValidate: true });
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image");
            // Remove the placeholder
            const currentValue = form.getValues("content");
            form.setValue("content", currentValue.replace(placeholder, ""), { shouldValidate: true });
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        if (e.clipboardData.files.length > 0) {
            e.preventDefault();
            await processFile(e.clipboardData.files[0]);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        if (e.dataTransfer.files.length > 0) {
            e.preventDefault();
            await processFile(e.dataTransfer.files[0]);
        }
    };
    // --------------------------

    // 2. Submit handler connects to create or update Server Action
    async function onSubmit(data: CreatePostInput) {
        setServerError(null);
        try {
            if (initialData) {
                await updatePostAction(initialData.id, data);
                router.push("/dashboard");
            } else {
                await createPostAction(data);
                router.push("/");
            }
        } catch (error) {
            setServerError(error instanceof Error ? error.message : "Failed to save post.");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">

                {/* Title Field */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="The Lore of the Dark Knight..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Content Field */}
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                                <div data-color-mode={mounted ? (resolvedTheme === 'dark' ? 'dark' : 'light') : 'light'}>
                                    <MDEditor
                                        value={field.value}
                                        onChange={field.onChange}
                                        preview="edit"
                                        height={400}
                                        className="w-full"
                                        textareaProps={{
                                            placeholder: "Start writing your draft here...",
                                            onPaste: handlePaste,
                                            onDrop: handleDrop
                                        }}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Publish Toggle */}
                <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Publish immediately</FormLabel>
                                <FormDescription>
                                    If unchecked, this will be saved as a hidden draft.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                {serverError && <p className="text-sm text-red-500 font-medium">{serverError}</p>}

                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Saving..." : "Save Post"}
                </Button>
            </form>
        </Form>
    );
}
