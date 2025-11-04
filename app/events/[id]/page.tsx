import { Navbar } from "@/components/Navbar";
import { getEventById } from "@/actions/events";
import { getUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Activity, Edit, ArrowLeft } from "lucide-react";
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
  const { user } = await getUser();

  if (error || !event) {
    notFound();
  }

  const canEdit = user?.id === event.created_by;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/events">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>

        <div className="bg-card rounded-lg border p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">{event.title}</h1>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
                  {event.sport_type}
                </span>
              </div>
            </div>

            {canEdit && (
              <Link href={`/events/${event.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
              </Link>
            )}
          </div>

          {event.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-muted-foreground">
                  {format(new Date(event.event_date), "PPP 'at' p")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">{event.location}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
