"use client";

import { Event } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trash2, Edit, Activity, Users } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { deleteEvent } from "@/actions/events";
import { RSVPButton } from "./RSVPButton";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EventCardProps {
  event: Event;
  canEdit?: boolean;
  onDelete?: () => void;
  user?: SupabaseUser | null;
  rsvpCount?: number;
  hasRSVP?: boolean;
}

export function EventCard({
  event,
  canEdit = false,
  onDelete,
  user,
  rsvpCount = 0,
  hasRSVP = false,
}: EventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteEvent(event.id);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      onDelete?.();
      router.refresh();
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <h3 className="text-lg sm:text-xl font-semibold truncate">{event.title}</h3>
            </div>

            {event.description && (
              <p className="text-sm sm:text-base text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
            )}

            <div className="flex flex-col gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{format(new Date(event.event_date), "PPP 'at' p")}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{event.venues}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="capitalize">{event.sport_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>{rsvpCount} RSVP{rsvpCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <RSVPButton
            eventId={event.id}
            user={user}
            initialRSVPCount={rsvpCount}
            initialHasRSVP={hasRSVP}
          />
          <div className="flex flex-wrap gap-2">
            <Link href={`/events/${event.id}`} className="flex-1 sm:flex-none">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                View Details
              </Button>
            </Link>
            {canEdit && (
              <>
                <Link href={`/events/${event.id}/edit`} className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              event "{event.title}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
