import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { getTrendingEvents } from "@/actions/events";
import { getCurrentUser } from "@/actions/auth";
import { getRSVPsForEvents } from "@/actions/rsvps";
import { Event } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, TrendingUp, Users, Calendar, Target, LogIn } from "lucide-react";
import Link from "next/link";
import { AuthErrorToast } from "@/components/AuthErrorToast";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signin?: string }>;
}) {
  const trendingEventsResult = await getTrendingEvents(6);
  const trendingEvents = trendingEventsResult.data ?? [];
  const user = await getCurrentUser();
  const params = await searchParams;
  const signinRequired = params?.signin === "required";

  // Fetch RSVP data for trending events
  const rsvpData = trendingEvents.length > 0
    ? await getRSVPsForEvents(
        trendingEvents.map((e) => e.id),
        user?.id
      )
    : new Map();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Auth Error Toast - handles URL error params */}
        <AuthErrorToast />

        {/* Sign In Required Prompt */}
        {signinRequired && !user && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4 sm:py-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="rounded-full bg-primary/10 p-2 sm:p-3 flex-shrink-0">
                  <LogIn className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold mb-1">
                    Sign In Required
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Please sign in with Google to access the events page and
                    RSVP for events.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hero / Mission Statement Section */}
        <section className="mb-12 sm:mb-16">
          <Card className="border-2 bg-gradient-to-br from-primary/5 via-background to-background">
            <CardHeader className="text-center py-8 sm:py-12 px-4 sm:px-6">
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="rounded-full bg-primary/10 p-3 sm:p-4">
                  <Target className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                Building Community Through Sports
              </CardTitle>
              <CardDescription className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
                At Sports Guru, we believe that sports bring people together.
                Our mission is to create a vibrant community where athletes,
                fans, and sports enthusiasts can discover, organize, and
                participate in local sporting events. Whether you're looking to
                join a pickup game, compete in a tournament, or simply connect
                with fellow sports lovers, we're here to help you find your next
                adventure.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8 sm:pb-12 px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 mb-2 sm:mb-3">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-responsive font-semibold mb-2">
                    Community First
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Connect with local athletes and sports enthusiasts in your
                    area
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 mb-2 sm:mb-3">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-responsive font-semibold mb-2">
                    Easy Discovery
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Find and join events that match your interests and schedule
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 mb-2 sm:mb-3">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-responsive font-semibold mb-2">
                    Organize & Grow
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Create and manage your own events to build your sports
                    community
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Trending Events Section */}
        <section className="mb-12">
          <div className="flex-responsive items-start sm:items-center justify-between gap-responsive mb-6 sm:mb-8">
            <div className="flex-center-responsive">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-bold">
                Trending Events
              </h2>
            </div>
            {user && (
              <Link href="/events" className="btn-responsive">
                <Button variant="outline" size="sm" className="btn-responsive">
                  View All Events
                </Button>
              </Link>
            )}
          </div>

          {trendingEvents && trendingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingEvents.map((event) => {
                const rsvp = rsvpData.get(event.id) || {
                  count: 0,
                  hasRSVP: false,
                };
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
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-muted p-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      No Trending Events Yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Be the first to create an event and get it trending!
                    </p>
                    {user ? (
                      <Link href="/events/new">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Event
                        </Button>
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sign in to create events
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Call to Action */}
        {!user && (
          <section className="mt-12 sm:mt-16">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-6 sm:py-8 text-center px-4 sm:px-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  Ready to Join the Community?
                </h3>
                <p className="text-responsive text-muted-foreground mb-4 sm:mb-6">
                  Sign in to discover events, create your own, and connect with
                  fellow sports enthusiasts
                </p>
                <Link href="/events" className="inline-block">
                  <Button size="lg" className="btn-responsive">
                    Become a Guru Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
