"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X } from "lucide-react";

//I can probably make this more dynamic with an api , but I'll hardcode for now
const SPORT_TYPES = [
  "all",
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

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  // Local state for form inputs (updated immediately as user types/selects)
  const [sportType, setSportType] = useState("all");
  const [title, setTitle] = useState("");

  // Applied filters from URL params (only updated when Apply Filters is clicked)
  const [appliedSportType, setAppliedSportType] = useState("all");
  const [appliedTitle, setAppliedTitle] = useState("");

  // Set mounted flag and initialize from URL params only on client
  useEffect(() => {
    setMounted(true);
    const urlSport = searchParams.get("sport") || "all";
    const urlTitle = searchParams.get("title") || "";
    
    // Initialize both local and applied state from URL
    setSportType(urlSport);
    setTitle(urlTitle);
    setAppliedSportType(urlSport);
    setAppliedTitle(urlTitle);
  }, []); // Only run on mount

  // Update applied filters when URL params change (after initial mount)
  // This handles browser back/forward navigation
  useEffect(() => {
    if (mounted) {
      const urlSport = searchParams.get("sport") || "all";
      const urlTitle = searchParams.get("title") || "";
      setAppliedSportType(urlSport);
      setAppliedTitle(urlTitle);
      // Also update local state to keep form inputs in sync
      setSportType(urlSport);
      setTitle(urlTitle);
    }
  }, [searchParams, mounted]);

  const updateFilters = () => {
    const params = new URLSearchParams();
    
    if (sportType && sportType !== "all") {
      params.set("sport", sportType);
    }
    
    if (title.trim()) {
      params.set("title", title.trim());
    }
    
    // Update URL with new filters - this will trigger a server-side refetch
    const queryString = params.toString();
    router.push(`/events${queryString ? `?${queryString}` : ""}`);
    
    // Update applied filters to match what we just sent to URL
    setAppliedSportType(sportType);
    setAppliedTitle(title.trim());
  };

  const clearFilters = () => {
    setSportType("all");
    setTitle("");
    setAppliedSportType("all");
    setAppliedTitle("");
    router.push("/events");
  };

  const hasActiveFilters = 
    (appliedSportType && appliedSportType !== "all") || 
    appliedTitle.trim() !== "";

  return (
    <Card className="mb-6">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          Filter Events
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="sport-filter" className="text-sm font-medium">
              Sport Type
            </label>
            <Select
              id="sport-filter"
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              className="text-responsive"
            >
              {SPORT_TYPES.map((sport) => (
                <option key={sport} value={sport}>
                  {sport === "all" ? "All Sports" : sport}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="title-filter" className="text-sm font-medium">
              Search by Event Title
            </label>
            <Input
              id="title-filter"
              type="text"
              placeholder="Enter event title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateFilters();
                }
              }}
              className="text-responsive"
            />
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <Button onClick={updateFilters} className="flex-1 sm:flex-none sm:px-6 text-responsive text-black">
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                size="sm"
                className="px-3"
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">Active filters:</span>
              {appliedSportType && appliedSportType !== "all" && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                  Sport: {appliedSportType}
                </span>
              )}
              {appliedTitle.trim() && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded truncate max-w-[200px] sm:max-w-none">
                  Title: {appliedTitle}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

