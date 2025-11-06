"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { EventInsert, EventUpdate, Event } from "@/types/database.types";
import { withErrorHandling, type ActionResult } from "@/types/errors";

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function createEvent(eventData: EventInsert): Promise<ActionResult<Event>> {
  return withErrorHandling(async () => {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Validate required fields
    if (!eventData.title || !eventData.title.trim()) {
      throw new Error("Title is required");
    }
    if (!eventData.sport_type || !eventData.sport_type.trim()) {
      throw new Error("Sport type is required");
    }
    if (!eventData.event_date) {
      throw new Error("Event date is required");
    }
    if (!eventData.venues || !eventData.venues.trim()) {
      throw new Error("Venues is required");
    }

    const { data, error } = await supabase
      .from("events")
      .insert([{ ...eventData, created_by: user.id }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/events");
    revalidatePath("/");

    return data;
  });
}

export async function getEvents(filters?: {
  sport_type?: string;
  title?: string;
}): Promise<ActionResult<Event[]>> {
  return withErrorHandling(async () => {
    const supabase = await createClient();

    let query = supabase.from("events").select("*");

    // Filter by sport type
    if (filters?.sport_type && filters.sport_type !== "all") {
      query = query.eq("sport_type", filters.sport_type);
    }

    // Filter by title (case-insensitive partial match)
    if (filters?.title && filters.title.trim() !== "") {
      query = query.ilike("title", `%${filters.title.trim()}%`);
    }

    query = query.order("event_date", { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }, "Failed to fetch events");
}

export async function getTrendingEvents(limit: number = 6): Promise<ActionResult<Event[]>> {
  return withErrorHandling(async () => {
    const supabase = await createClient();

    // Get upcoming events (events happening in the future)
    const now = new Date().toISOString();
    
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", now)
      .order("event_date", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    if (!events || events.length === 0) {
      return [];
    }

    // Get RSVP counts for all events in a single query (optimize N+1 issue)
    const eventIds = events.map((e) => e.id);
    const { data: rsvpData, error: rsvpError } = await supabase
      .from("rsvps")
      .select("event_id")
      .in("event_id", eventIds);

    // Create a map of event ID to RSVP count
    const rsvpMap = new Map<string, number>();
    if (rsvpData && !rsvpError) {
      rsvpData.forEach((rsvp) => {
        const currentCount = rsvpMap.get(rsvp.event_id) || 0;
        rsvpMap.set(rsvp.event_id, currentCount + 1);
      });
    }

    // Sort events by RSVP count descending, then by event date ascending
    const sortedEvents = [...events].sort((a, b) => {
      const aCount = rsvpMap.get(a.id) || 0;
      const bCount = rsvpMap.get(b.id) || 0;
      
      // First sort by RSVP count (descending)
      if (bCount !== aCount) {
        return bCount - aCount;
      }
      
      // If RSVP counts are equal, sort by event date (ascending - soonest first)
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });

    // Return the top N events
    return sortedEvents.slice(0, limit);
  }, "Failed to fetch trending events");
}

export async function getEventById(id: string): Promise<ActionResult<Event>> {
  return withErrorHandling(async () => {
    if (!id || !isValidUUID(id)) {
      throw new Error("Invalid event ID");
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }, "Failed to fetch event");
}

export async function updateEvent(id: string, eventData: EventUpdate): Promise<ActionResult<Event>> {
  return withErrorHandling(async () => {
    if (!id || !isValidUUID(id)) {
      throw new Error("Invalid event ID");
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user owns the event
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchError || existingEvent?.created_by !== user.id) {
      throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
      .from("events")
      .update({ ...eventData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Clear cache for the event page and the home page
    // This ensures users see updates immediately
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
    revalidatePath("/");

    return data;
  });
}

export async function deleteEvent(id: string): Promise<ActionResult<null>> {
  return withErrorHandling(async () => {
    if (!id || !isValidUUID(id)) {
      throw new Error("Invalid event ID");
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user owns the event
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchError || existingEvent?.created_by !== user.id) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/events");
    revalidatePath("/");

    return null;
  });
}
