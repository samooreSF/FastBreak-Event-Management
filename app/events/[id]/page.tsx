import { Navbar } from "@/components/Navbar";
import { getEventById } from "@/actions/events";
import { getUserRSVP, getRSVPCount } from "@/actions/rsvps";
import { getCurrentUser } from "@/actions/auth";
import { RSVPButton } from "@/components/RSVPButton";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Activity, Edit, ArrowLeft, Users } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: event, error } = await getEventById(id);
  const user = await getCurrentUser();
  const { count: rsvpCount } = await getRSVPCount(id);
  const { hasRSVP } = await getUserRSVP(id);

  if (error || !event) {
    notFound();
  }

  const canEdit = user?.id === event.created_by;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="mb-4 sm:mb-6">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back to Events</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>

        <div className="bg-card rounded-lg border p-4 sm:p-6 lg:p-8">
          <div className="flex-responsive sm:items-start sm:justify-between gap-responsive mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex-center-responsive mb-3 sm:mb-4">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words">{event.title}</h1>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium capitalize">
                  {event.sport_type}
                </span>
              </div>
            </div>

            {canEdit && (
              <Link href={`/events/${event.id}/edit`} className="flex-shrink-0">
                <Button size="sm" className="btn-responsive">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Event</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </Link>
            )}
          </div>

          {event.description && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Description</h2>
              <p className="text-responsive text-muted-foreground whitespace-pre-wrap break-words">
                {event.description}
              </p>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-responsive font-medium">Date & Time</p>
                <p className="text-responsive text-muted-foreground break-words">
                  {format(new Date(event.event_date), "PPP 'at' p")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-responsive font-medium">Venues</p>
                <p className="text-responsive text-muted-foreground break-words">{event.venues}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-responsive font-medium mb-2">RSVPs</p>
                <RSVPButton
                  eventId={event.id}
                  user={user}
                  initialRSVPCount={rsvpCount}
                  initialHasRSVP={hasRSVP}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
