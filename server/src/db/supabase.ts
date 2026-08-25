import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function updatePlayerStatsInDb(stats: {
  username: string;
  won: boolean;
  catches: number;
  score: number;
  timeSeeker: number;
  timeHider: number;
}) {
  if (!supabase) return;

  try {
    const { data: existing } = await supabase
      .from('player_stats')
      .select('*')
      .eq('username', stats.username)
      .single();

    if (existing) {
      await supabase
        .from('player_stats')
        .update({
          games_played: existing.games_played + 1,
          games_won: existing.games_won + (stats.won ? 1 : 0),
          games_lost: existing.games_lost + (stats.won ? 0 : 1),
          catches: existing.catches + stats.catches,
          total_score: existing.total_score + stats.score,
          total_time_as_seeker: existing.total_time_as_seeker + stats.timeSeeker,
          total_time_as_hider: existing.total_time_as_hider + stats.timeHider,
        })
        .eq('username', stats.username);
    } else {
      await supabase.from('player_stats').insert({
        username: stats.username,
        games_played: 1,
        games_won: stats.won ? 1 : 0,
        games_lost: stats.won ? 0 : 1,
        catches: stats.catches,
        total_score: stats.score,
        total_time_as_seeker: stats.timeSeeker,
        total_time_as_hider: stats.timeHider,
      });
    }
  } catch (err) {
    console.error('Supabase DB Sync error:', err);
  }
}
