"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { EventInsert, EventUpdate } from "@/types/database.types";

export async function createEvent(eventData: EventInsert) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("events")
      .insert([{ ...eventData, created_by: user.id }])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/events");
    revalidatePath("/");

    return { data, error: null };
  } catch (error) {
    return { error: "Failed to create event" };
  }
}

export async function getEvents(filters?: {
  sport_type?: string;
  title?: string;
}) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

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
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: "Failed to fetch events", data: null };
  }
}

export async function getTrendingEvents(limit: number = 6) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Get upcoming events (events happening in the future)
    const now = new Date().toISOString();
    
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", now)
      .order("event_date", { ascending: true });

    if (error) {
      return { error: error.message, data: null };
    }

    if (!events || events.length === 0) {
      return { data: [], error: null };
    }

    // Get RSVP counts for all upcoming events
    const rsvpCounts = await Promise.all(
      events.map(async (event) => {
        const { count } = await supabase
          .from("rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);
        
        return {
          eventId: event.id,
          rsvpCount: count || 0,
        };
      })
    );

    // Create a map of event ID to RSVP count
    const rsvpMap = new Map(
      rsvpCounts.map(({ eventId, rsvpCount }) => [eventId, rsvpCount])
    );

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
    return { data: sortedEvents.slice(0, limit), error: null };
  } catch (error) {
    return { error: "Failed to fetch trending events", data: null };
  }
}

export async function getEventById(id: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: "Failed to fetch event", data: null };
  }
}

export async function updateEvent(id: string, eventData: EventUpdate) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Check if user owns the event
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchError || existingEvent?.created_by !== user.id) {
      return { error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("events")
      .update({ ...eventData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
    revalidatePath("/");

    return { data, error: null };
  } catch (error) {
    return { error: "Failed to update event" };
  }
}

export async function deleteEvent(id: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Check if user owns the event
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchError || existingEvent?.created_by !== user.id) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/events");
    revalidatePath("/");

    return { error: null };
  } catch (error) {
    return { error: "Failed to delete event" };
  }
}
