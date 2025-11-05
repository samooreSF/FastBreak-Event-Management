import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import { getEvents } from "@/actions/events";
import { getCurrentUser } from "@/actions/auth";
import { getRSVPsForEvents } from "@/actions/rsvps";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; title?: string }>;
}) {
  const params = await searchParams;
  const filters = {
    sport_type: params.sport,
    title: params.title,
  };

  const { data: events, error } = await getEvents(filters);
  const user = await getCurrentUser();

  // Protect route - redirect to home if not authenticated
  if (!user) {
    redirect("/?signin=required");
  }

  // Fetch RSVP data for all events
  const rsvpData = events
    ? await getRSVPsForEvents(
        events.map((e) => e.id),
        user?.id
      )
    : new Map();

  const hasFilters = params.sport || params.title;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex-responsive items-start sm:items-center justify-between gap-responsive mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">All Events</h1>
            <p className="text-responsive text-muted-foreground">
              Browse all upcoming sporting events
            </p>
          </div>
          {user && (
            <Link href="/events/new" className="btn-responsive">
              <Button size="sm" className="btn-responsive">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                Create Event
              </Button>
            </Link>
          )}
        </div>

        <EventFilters />

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {events && events.length > 0 ? (
          <>
            {hasFilters && (
              <div className="mb-4 text-sm text-muted-foreground">
                Found {events.length} event{events.length !== 1 ? "s" : ""}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const rsvp = rsvpData.get(event.id) || { count: 0, hasRSVP: false };
                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    canEdit={user?.id === event.created_by}
                    user={user}
                    rsvpCount={rsvp.count}
                    hasRSVP={rsvp.hasRSVP}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-responsive lg:text-lg text-muted-foreground mb-4 px-4">
              {hasFilters
                ? "No events found matching your filters. Try adjusting your search criteria."
                : "No events found. Be the first to create one!"}
            </p>
            {user && (
              <Link href="/events/new" className="inline-block">
                <Button size="sm" className="btn-responsive">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
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
