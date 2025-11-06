import { Navbar } from "@/components/Navbar";
import { EventCardsContainer } from "@/components/EventCardsContainer";
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

  const eventsResult = await getEvents(filters);
  const events = eventsResult.data ?? [];
  const error = eventsResult.error;
  const user = await getCurrentUser();

  // Protect route - redirect to home if not authenticated
  if (!user) {
    redirect("/?signin=required");
  }

  // Fetch RSVP data for all events
  const rsvpData = events.length > 0
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
          <EventCardsContainer
            events={events}
            user={user}
            rsvpData={rsvpData}
          />
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
