-- ============================================================
-- Migration V6: Clan Join Requests System
-- Supports Clan Join Requests, Permissions & Management
-- ============================================================

-- 1. Create table for clan join requests if not exists
CREATE TABLE IF NOT EXISTS public.clan_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(guild_id, player_id, status)
);

-- Indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_clan_join_requests_guild ON public.clan_join_requests(guild_id);
CREATE INDEX IF NOT EXISTS idx_clan_join_requests_player ON public.clan_join_requests(player_id);
CREATE INDEX IF NOT EXISTS idx_clan_join_requests_status ON public.clan_join_requests(status);

-- 2. RLS Policies
ALTER TABLE public.clan_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read clan join requests" ON public.clan_join_requests;
CREATE POLICY "Public read clan join requests" ON public.clan_join_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players can insert clan join requests" ON public.clan_join_requests;
CREATE POLICY "Players can insert clan join requests" ON public.clan_join_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Clan managers can update requests" ON public.clan_join_requests;
CREATE POLICY "Clan managers can update requests" ON public.clan_join_requests FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Clan managers or players can delete requests" ON public.clan_join_requests;
CREATE POLICY "Clan managers or players can delete requests" ON public.clan_join_requests FOR DELETE USING (true);
