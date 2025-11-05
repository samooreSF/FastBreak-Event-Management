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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/actions/events";

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
  const { toast } = useToast();
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

    let result;
    if (event) {
      // Update existing event
      result = await updateEvent(event.id, eventData);
    } else {
      // Create new event
      result = await createEvent(eventData);
    }

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Success",
        description: event
          ? "Event updated successfully"
          : "Event created successfully",
      });
      if (result.data) {
        router.push(`/events/${result.data.id}`);
        router.refresh();
      } else {
        router.push("/");
        router.refresh();
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base">Event Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Summer Soccer Tournament"
                  className="text-sm sm:text-base"
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
              <FormLabel className="text-sm sm:text-base">Sport Type *</FormLabel>
              <FormControl>
                <Select className="text-sm sm:text-base" {...field}>
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
              <FormLabel className="text-sm sm:text-base">Event Date & Time *</FormLabel>
              <FormControl>
                <Input type="datetime-local" className="text-sm sm:text-base" {...field} />
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
              <FormLabel className="text-sm sm:text-base">Venues *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Central Park, Madison Square Garden" 
                  className="text-sm sm:text-base"
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
              <FormLabel className="text-sm sm:text-base">Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Add details about the event..."
                  className="text-sm sm:text-base resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "Saving..." : event ? "Update Event" : "Create Event"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
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
