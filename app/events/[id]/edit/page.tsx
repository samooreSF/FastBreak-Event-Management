import { Navbar } from "@/components/Navbar";
import { EventForm } from "@/components/EventForm";
import { getEventById } from "@/actions/events";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: event, error } = await getEventById(id);
  const user = await getCurrentUser();

  if (error || !event) {
    redirect("/events");
  }

  if (user?.id !== event.created_by) {
    redirect(`/events/${id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Event</h1>
          <p className="text-muted-foreground">
            Update the details of your event
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <EventForm event={event} />
        </div>
      </main>
    </div>
  );
}
