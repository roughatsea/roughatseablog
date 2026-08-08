import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        // 1. Verify Authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in to upload images." },
                { status: 401 }
            );
        }

        // 2. Parse filename from query params
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get("filename");

        if (!filename) {
            return NextResponse.json(
                { error: "Filename is required in the query parameters." },
                { status: 400 }
            );
        }

        if (!request.body) {
            return NextResponse.json(
                { error: "Request body is empty." },
                { status: 400 }
            );
        }

        // 3. Upload to Vercel Blob
        // We set access to 'public' because these are images for public blog posts.
        const blob = await put(filename, request.body, {
            access: "public",
        });

        // 4. Return the new Blob URL
        return NextResponse.json(blob);

    } catch (error) {
        console.error("Vercel Blob Upload Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error during upload." },
            { status: 500 }
        );
    }
}
