"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function addRSVP(eventId: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be signed in to RSVP" };
    }

    // Check if user already RSVP'd
    const { data: existingRSVP } = await supabase
      .from("rsvps")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (existingRSVP) {
      return { error: "You have already RSVP'd for this event" };
    }

    // Add RSVP
    const { error } = await supabase
      .from("rsvps")
      .insert([{ event_id: eventId, user_id: user.id }]);

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, error: null };
  } catch (error) {
    return { error: "Failed to add RSVP" };
  }
}

export async function removeRSVP(eventId: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be signed in" };
    }

    // Remove RSVP
    const { error } = await supabase
      .from("rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true, error: null };
  } catch (error) {
    return { error: "Failed to remove RSVP" };
  }
}

export async function getRSVPCount(eventId: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { count, error } = await supabase
      .from("rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    return { count: 0, error: "Failed to get RSVP count" };
  }
}

export async function getUserRSVP(eventId: string) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { hasRSVP: false, error: null };
    }

    const { data, error } = await supabase
      .from("rsvps")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      return { hasRSVP: false, error: error.message };
    }

    return { hasRSVP: !!data, error: null };
  } catch (error) {
    return { hasRSVP: false, error: "Failed to check RSVP status" };
  }
}

export async function getRSVPsForEvents(eventIds: string[], userId?: string) {
  const rsvpData = new Map<string, { count: number; hasRSVP: boolean }>();

  // Fetch RSVP counts for all events in parallel
  const countPromises = eventIds.map(async (eventId) => {
    const { count } = await getRSVPCount(eventId);
    return { eventId, count: count || 0 };
  });

  const counts = await Promise.all(countPromises);

  // Fetch user RSVP status if user is authenticated
  let userRSVPs: { eventId: string; hasRSVP: boolean }[] = [];
  if (userId) {
    const rsvpPromises = eventIds.map(async (eventId) => {
      const { hasRSVP } = await getUserRSVP(eventId);
      return { eventId, hasRSVP };
    });
    userRSVPs = await Promise.all(rsvpPromises);
  }

  // Combine data
  counts.forEach(({ eventId, count }) => {
    const userRSVP = userRSVPs.find((r) => r.eventId === eventId);
    rsvpData.set(eventId, {
      count,
      hasRSVP: userRSVP?.hasRSVP || false,
    });
  });

  return rsvpData;
}
