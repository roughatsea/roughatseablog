"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeletePostButtonProps {
    postId: number;
}

export function DeletePostButton({ postId }: DeletePostButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function onDelete() {
        startTransition(async () => {
            try {
                await deletePostAction(postId);
                toast.success("Post deleted successfully.");
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to delete post.");
            }
        });
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your post and remove it from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        disabled={isPending}
                    >
                        {isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
