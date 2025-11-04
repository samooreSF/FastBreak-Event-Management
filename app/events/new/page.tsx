import { Navbar } from "@/components/Navbar";
import { EventForm } from "@/components/EventForm";
import { getUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function NewEventPage() {
  const { user } = await getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground">
            Fill in the details to create a new sporting event
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <EventForm />
        </div>
      </main>
    </div>
  );
}
