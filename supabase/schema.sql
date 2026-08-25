-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Player Stats Table
CREATE TABLE IF NOT EXISTS public.player_stats (
    player_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    games_played INT DEFAULT 0 NOT NULL,
    games_won INT DEFAULT 0 NOT NULL,
    games_lost INT DEFAULT 0 NOT NULL,
    catches INT DEFAULT 0 NOT NULL,
    times_caught INT DEFAULT 0 NOT NULL,
    total_score INT DEFAULT 0 NOT NULL,
    total_time_as_seeker INT DEFAULT 0 NOT NULL,
    total_time_as_hider INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_player_stats_total_score ON public.player_stats (total_score DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_catches ON public.player_stats (catches DESC);

-- Enable Row Level Security
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access to leaderboards
CREATE POLICY "Allow public read access" 
ON public.player_stats 
FOR SELECT 
USING (true);

-- Allow service role full access (Server-only updates)
CREATE POLICY "Allow service role full access" 
ON public.player_stats 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_stats_updated_at
BEFORE UPDATE ON public.player_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
