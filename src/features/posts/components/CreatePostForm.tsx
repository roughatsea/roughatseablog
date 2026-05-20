"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { createPostSchema, type CreatePostInput } from "../schema";
import { createPostAction } from "../actions";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreatePostForm() {
    // useTransition keeps the UI responsive while the server action runs
    const [isPending, startTransition] = useTransition();

    const form = useForm<CreatePostInput>({
        resolver: zodResolver(createPostSchema),
        defaultValues: {
            title: "",
            content: "",
            isPublished: false,
        },
    });

    function onSubmit(values: CreatePostInput) {
        startTransition(async () => {
            try {
                const result = await createPostAction(values);
                if (result.success) {
                    toast.success("Ship logged. Post created successfully!");
                    form.reset();
                }
            } catch {
                toast.error("Failed to create post. The sea is rough today.");
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g., The Fall of the Allagan Empire..."
                                    {...field}
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Start writing your deep dive or hopeposting here. Markdown is welcome..."
                                    className="min-h-[300px] resize-y"
                                    {...field}
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isPending}>
                    {isPending ? "Publishing..." : "Publish Post"}
                </Button>
            </form>
        </Form>
    );
}