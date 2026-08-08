import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const session = await getServerSession(authOptions);

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-tight text-lg hover:text-indigo-500 transition-colors">
          Rough at Sea
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/blog">
             <Button variant="ghost" size="sm">Blog Feed</Button>
          </Link>
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Captain's Log
                </Button>
              </Link>
              <Link href="/api/auth/signout">
                <Button variant="ghost" size="sm">
                  Log out
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/api/auth/signin">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
