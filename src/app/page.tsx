import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  // Check if you are currently logged in
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-4">Rough at Sea</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Building the ship as I sail it.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link href="/blog">
          <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-indigo-500/10">
            Read the Blog
          </Button>
        </Link>
        {session ? (
          // If logged in, show the dashboard button
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Go to Captain&apos;s Log (Dashboard)
            </Button>
          </Link>
        ) : (
          // If logged out, show the login button
          <Link href="/api/auth/signin">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Login to Write
            </Button>
          </Link>
        )}
      </div>
    </main>
  );
}