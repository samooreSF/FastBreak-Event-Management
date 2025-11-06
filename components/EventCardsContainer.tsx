"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import type { User } from "@supabase/supabase-js";
import type { Event } from "@/types/database.types";

interface EventCardsContainerProps {
  events: Event[];
  user: User;
  rsvpData: Map<string, { count: number; hasRSVP: boolean }>;
}

export function EventCardsContainer({
  events,
  user,
  rsvpData,
}: EventCardsContainerProps) {
  const searchParams = useSearchParams();
  const [displayEvents, setDisplayEvents] = useState(events);
  const [isLoading, setIsLoading] = useState(false);
  const prevSearchParamsRef = useRef<string>(searchParams.toString());
  const prevEventsRef = useRef<Event[]>(events);

  // Track search params to detect filter changes
  useEffect(() => {
    const currentParams = searchParams.toString();
    
    // Only show loading if search params actually changed
    if (currentParams !== prevSearchParamsRef.current) {
      setIsLoading(true);
      prevSearchParamsRef.current = currentParams;
    }
  }, [searchParams]);

  // Update display events when new events are received
  useEffect(() => {
    // Check if events actually changed (different array reference or different IDs)
    const eventsChanged = 
      events !== prevEventsRef.current ||
      events.length !== prevEventsRef.current.length ||
      events.some((e, i) => e.id !== prevEventsRef.current[i]?.id);

    if (eventsChanged) {
      setDisplayEvents(events);
      prevEventsRef.current = events;
      
      // Hide loading after events are updated
      if (isLoading) {
        // Small delay to ensure smooth transition
        const timer = setTimeout(() => setIsLoading(false), 150);
        return () => clearTimeout(timer);
      }
    } else if (isLoading) {
      // Events didn't change but we're loading - hide loading
      const timer = setTimeout(() => setIsLoading(false), 150);
      return () => clearTimeout(timer);
    }
  }, [events, isLoading]);

  const hasFilters = searchParams.get("sport") || searchParams.get("title");

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading events...</p>
          </div>
        </div>
      )}
      {displayEvents && displayEvents.length > 0 ? (
        <>
          {hasFilters && (
            <div className="mb-4 text-sm text-muted-foreground">
              Found {displayEvents.length} event{displayEvents.length !== 1 ? "s" : ""}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map((event) => {
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
        </div>
      )}
    </div>
  );
}

