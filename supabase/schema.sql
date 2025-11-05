-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  sport_type TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  venues TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can view events
CREATE POLICY "Anyone can view events"
  ON events
  FOR SELECT
  USING (true);

-- Only authenticated users can create events
CREATE POLICY "Authenticated users can create events"
  ON events
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can only update their own events
CREATE POLICY "Users can update their own events"
  ON events
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can only delete their own events
CREATE POLICY "Users can delete their own events"
  ON events
  FOR DELETE
  USING (auth.uid() = created_by);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

