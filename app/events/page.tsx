import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { getEvents } from "@/actions/events";
import { getUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function EventsPage() {
  const { data: events, error } = await getEvents();
  const { user } = await getUser();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">All Events</h1>
            <p className="text-muted-foreground">
              Browse all upcoming sporting events
            </p>
          </div>
          {user && (
            <Link href="/events/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                canEdit={user?.id === event.created_by}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              No events found. Be the first to create one!
            </p>
            {user && (
              <Link href="/events/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
