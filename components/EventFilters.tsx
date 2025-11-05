"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X } from "lucide-react";

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
  
  const [sportType, setSportType] = useState(
    searchParams.get("sport") || "all"
  );
  const [title, setTitle] = useState(
    searchParams.get("title") || ""
  );

  // Update local state when URL params change
  useEffect(() => {
    setSportType(searchParams.get("sport") || "all");
    setTitle(searchParams.get("title") || "");
  }, [searchParams]);

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
  };

  const clearFilters = () => {
    setSportType("all");
    setTitle("");
    router.push("/events");
  };

  const hasActiveFilters = 
    (sportType && sportType !== "all") || 
    title.trim() !== "";

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
              className="text-sm sm:text-base"
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
              className="text-sm sm:text-base"
            />
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <Button onClick={updateFilters} className="flex-1 sm:flex-none sm:px-6 text-sm sm:text-base">
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
              {sportType && sportType !== "all" && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                  Sport: {sportType}
                </span>
              )}
              {title.trim() && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded truncate max-w-[200px] sm:max-w-none">
                  Title: {title}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

