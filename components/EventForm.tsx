"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Event, EventInsert } from "@/types/database.types";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/actions/events";
import { Loader2 } from "lucide-react";

interface EventFormProps {
  event?: Event;
}

const SPORT_TYPES = [
  "Football",
  "Basketball",
  "Soccer",
  "Tennis",
  "Baseball",
  "Volleyball",
  "Hockey",
  "Swimming",
  "Running",
  "Cycling",
  "Other",
] as const;

const eventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  sport_type: z.string().min(1, "Please select a sport type"),
  event_date: z.string().min(1, "Event date and time is required"),
  venues: z.string().min(3, "Venues must be at least 3 characters"),
  description: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export function EventForm({ event }: EventFormProps) {
  const { handleActionResult } = useErrorHandler();
  const router = useRouter();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title || "",
      sport_type: event?.sport_type || "",
      event_date: event?.event_date
        ? new Date(event.event_date).toISOString().slice(0, 16)
        : "",
      venues: event?.venues || "",
      description: event?.description || "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: EventFormValues) => {
    const eventData: EventInsert = {
      title: values.title,
      description: values.description || null,
      sport_type: values.sport_type,
      event_date: values.event_date,
      venues: values.venues,
      created_by: event?.created_by || "",
    };

    const result = event
      ? await updateEvent(event.id, eventData)
      : await createEvent(eventData);

    handleActionResult<Event>(result, {
      successTitle: "Success",
      successMessage: event
        ? "Event updated successfully"
        : "Event created successfully",
      onSuccess: (data) => {
        if (data?.id) {
          router.push(`/events/${data.id}`);
        } else {
          router.push("/");
        }
        router.refresh();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-responsive relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {event ? "Updating event..." : "Creating event..."}
              </p>
            </div>
          </div>
        )}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-responsive">Event Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Summer Soccer Tournament"
                  className="text-responsive"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sport_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-responsive">Sport Type *</FormLabel>
              <FormControl>
                <Select className="text-responsive pr-5" {...field}>
                  <option value="">Select a sport</option>
                  {SPORT_TYPES.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="event_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-responsive">Event Date & Time *</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  className="text-responsive white-calendar-icon"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="venues"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-responsive">Venues *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Central Park, Madison Square Garden" 
                  className="text-responsive"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-responsive">Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Add details about the event..."
                  className="text-responsive resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex-responsive gap-responsive">
          <Button type="submit" disabled={isLoading} className="btn-responsive">
            {isLoading ? "Saving..." : event ? "Update Event" : "Create Event"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="btn-responsive"
            onClick={() => {
              if (event) {
                router.push(`/events/${event.id}`);
              } else {
                router.push("/");
              }
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
