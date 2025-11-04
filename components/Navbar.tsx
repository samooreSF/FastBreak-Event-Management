import Link from "next/link"
import { AuthButton } from "./AuthButton"
import { getUser } from "@/actions/auth"
import { Button } from "./ui/button"
import { Activity, Plus } from "lucide-react"

export async function Navbar() {
  const { user } = await getUser()

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6" />
            <span className="text-xl font-bold">Sports Events</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/events">
              <Button variant="ghost">All Events</Button>
            </Link>
            {user && (
              <Link href="/events/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              </Link>
            )}
            <AuthButton user={user} />
          </div>
        </div>
      </div>
    </nav>
  )
}

