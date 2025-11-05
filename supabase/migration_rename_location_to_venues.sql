-- Migration: Rename location column to venues
-- Run this in your Supabase SQL Editor

-- Rename the column
ALTER TABLE events RENAME COLUMN location TO venues;

-- Update the index name if it exists (optional, for consistency)
-- Note: Indexes on columns are automatically updated when column is renamed

