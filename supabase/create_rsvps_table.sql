-- Create RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- Prevent duplicate RSVPs
);

-- Enable Row Level Security
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can view RSVPs
CREATE POLICY "Anyone can view RSVPs"
  ON rsvps
  FOR SELECT
  USING (true);

-- Only authenticated users can create RSVPs
CREATE POLICY "Authenticated users can create RSVPs"
  ON rsvps
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Users can only delete their own RSVPs
CREATE POLICY "Users can delete their own RSVPs"
  ON rsvps
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_user ON rsvps(event_id, user_id);

