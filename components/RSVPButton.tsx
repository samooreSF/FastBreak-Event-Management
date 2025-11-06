"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { addRSVP, removeRSVP } from "@/actions/rsvps";
import { UserCheck, UserPlus } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface RSVPButtonProps {
  eventId: string;
  user: SupabaseUser | null | undefined;
  initialRSVPCount: number;
  initialHasRSVP: boolean;
}

export function RSVPButton({
  eventId,
  user,
  initialRSVPCount,
  initialHasRSVP,
}: RSVPButtonProps) {
  const [rsvpCount, setRSVPCount] = useState(initialRSVPCount);
  const [hasRSVP, setHasRSVP] = useState(initialHasRSVP);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { handleActionResult } = useErrorHandler();
  const router = useRouter();

  const handleRSVP = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Sign In Required",
        description: "Please sign in to RSVP for events",
      });
      return;
    }

    setIsLoading(true);

    const result = hasRSVP
      ? await removeRSVP(eventId)
      : await addRSVP(eventId);

    const success = handleActionResult<boolean>(result, {
      successTitle: "Success",
      successMessage: hasRSVP
        ? "RSVP removed successfully"
        : "RSVP added successfully",
      onSuccess: () => {
        setHasRSVP(!hasRSVP);
        setRSVPCount(hasRSVP ? rsvpCount - 1 : rsvpCount + 1);
        router.refresh();
      },
    });

    setIsLoading(false);
  };

  return (
    <div className="flex-responsive items-start sm:items-center gap-2 sm:gap-3">
      <Button
        onClick={handleRSVP}
        disabled={isLoading || !user}
        variant={hasRSVP ? "default" : "outline"}
        size="sm"
        className="btn-responsive"
      >
        {hasRSVP ? (
          <>
            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">RSVP'd</span>
            <span className="sm:hidden">RSVP'd</span>
          </>
        ) : (
          <>
            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            RSVP
          </>
        )}
      </Button>
      <span className="text-xs sm:text-sm text-muted-foreground">
        {rsvpCount} {rsvpCount === 1 ? "person" : "people"} RSVP'd
      </span>
    </div>
  );
}

