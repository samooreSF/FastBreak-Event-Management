import Link from "next/link";
import { AuthButton } from "./AuthButton";
import { getCurrentUser } from "@/actions/auth";
import { Button } from "./ui/button";
import { Activity, Plus } from "lucide-react";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-lg sm:text-xl font-bold">Sports Guru</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/events">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                All Events
              </Button>
            </Link>
            {user && (
              <Link href="/events/new">
                <Button size="sm" className="text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Event</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </Link>
            )}
            <AuthButton user={user} />
          </div>
        </div>
      </div>
    </nav>
  );
}
