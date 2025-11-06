"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withErrorHandling, type ActionResult } from "@/types/errors";

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function addRSVP(eventId: string): Promise<ActionResult<{ success: true }>> {
  return withErrorHandling(async () => {
    if (!eventId || !isValidUUID(eventId)) {
      throw new Error("Invalid event ID");
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("You must be signed in to RSVP");
    }

    // Check if user already RSVP'd
    const { data: existingRSVP } = await supabase
      .from("rsvps")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (existingRSVP) {
      throw new Error("You have already RSVP'd for this event");
    }

    // Add RSVP
    const { error } = await supabase
      .from("rsvps")
      .insert([{ event_id: eventId, user_id: user.id }]);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true };
  });
}

export async function removeRSVP(eventId: string): Promise<ActionResult<{ success: true }>> {
  return withErrorHandling(async () => {
    if (!eventId || !isValidUUID(eventId)) {
      throw new Error("Invalid event ID");
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("You must be signed in");
    }

    // Remove RSVP
    const { error } = await supabase
      .from("rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");

    return { success: true };
  });
}

export async function getRSVPCount(eventId: string): Promise<ActionResult<number>> {
  return withErrorHandling(async () => {
    if (!eventId || !isValidUUID(eventId)) {
      throw new Error("Invalid event ID");
    }

    const supabase = await createClient();

    const { count, error } = await supabase
      .from("rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }, "Failed to get RSVP count");
}

export async function getUserRSVP(eventId: string): Promise<ActionResult<boolean>> {
  return withErrorHandling(async () => {
    if (!eventId || !isValidUUID(eventId)) {
      throw new Error("Invalid event ID");
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    const { data, error } = await supabase
      .from("rsvps")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      throw new Error(error.message);
    }

    return !!data;
  }, "Failed to check RSVP status");
}

export async function getRSVPsForEvents(eventIds: string[], userId?: string) {
  const rsvpData = new Map<string, { count: number; hasRSVP: boolean }>();

  // Fetch RSVP counts for all events in parallel
  const countPromises = eventIds.map(async (eventId) => {
    const result = await getRSVPCount(eventId);
    return { eventId, count: result.data ?? 0 };
  });

  const counts = await Promise.all(countPromises);

  // Fetch user RSVP status if user is authenticated
  let userRSVPs: { eventId: string; hasRSVP: boolean }[] = [];
  if (userId) {
    const rsvpPromises = eventIds.map(async (eventId) => {
      const result = await getUserRSVP(eventId);
      return { eventId, hasRSVP: result.data ?? false };
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
