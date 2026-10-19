-- ============================================================
-- WuWa Betting - Migration v3: Clan Wars System
-- ============================================================
-- Tables: clan_battles
-- RPCs:   create_clan_battle, play_clan_battle_round
-- ============================================================

-- ============================================================
-- 1. CLAN BATTLES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS clan_battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_a_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  clan_b_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  mode VARCHAR(5) NOT NULL CHECK (mode IN ('2v2', '4v4', '5v5')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  stake_per_player NUMERIC(15, 2) NOT NULL DEFAULT 100,
  total_prize NUMERIC(15, 2) NOT NULL DEFAULT 0,
  clan_a_score INTEGER NOT NULL DEFAULT 0,
  clan_b_score INTEGER NOT NULL DEFAULT 0,
  winner_clan_id UUID REFERENCES guilds(id) ON DELETE SET NULL,
  matches JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_clans CHECK (clan_a_id != clan_b_id),
  CONSTRAINT positive_stake CHECK (stake_per_player > 0)
);

CREATE INDEX IF NOT EXISTS idx_clan_battles_clan_a ON clan_battles(clan_a_id);
CREATE INDEX IF NOT EXISTS idx_clan_battles_clan_b ON clan_battles(clan_b_id);
CREATE INDEX IF NOT EXISTS idx_clan_battles_status ON clan_battles(status);
CREATE INDEX IF NOT EXISTS idx_clan_battles_created ON clan_battles(created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_clan_battles_updated_at'
  ) THEN
    CREATE TRIGGER update_clan_battles_updated_at
      BEFORE UPDATE ON clan_battles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

ALTER TABLE clan_battles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_battles' AND policyname = 'Anyone can view clan battles') THEN
    CREATE POLICY "Anyone can view clan battles" ON clan_battles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_battles' AND policyname = 'Players can create clan battles') THEN
    CREATE POLICY "Players can create clan battles" ON clan_battles FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_battles' AND policyname = 'Players can update clan battles') THEN
    CREATE POLICY "Players can update clan battles" ON clan_battles FOR UPDATE USING (true);
  END IF;
END $$;

-- Enable Supabase Realtime: FULL replica identity so JSONB diffs are sent
ALTER TABLE clan_battles REPLICA IDENTITY FULL;

-- Add to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'clan_battles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE clan_battles;
  END IF;
END $$;

-- ============================================================
-- 2. RPC: create_clan_battle
-- Picks random members from each clan matching the mode size,
-- assigns matchups (player_a vs player_b per round),
-- deducts stake from each participant, builds the matches array.
-- ============================================================

DROP FUNCTION IF EXISTS create_clan_battle(UUID, UUID, VARCHAR, NUMERIC);

CREATE OR REPLACE FUNCTION create_clan_battle(
  p_clan_a_id UUID,
  p_clan_b_id UUID,
  p_mode VARCHAR,
  p_stake_per_player NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_slots INTEGER;
  v_members_a UUID[];
  v_members_b UUID[];
  v_match JSONB;
  v_matches JSONB := '[]';
  v_total_prize NUMERIC;
  v_battle_id UUID;
  v_player_a_row RECORD;
  v_player_b_row RECORD;
  i INTEGER;
BEGIN
  IF p_mode = '2v2' THEN v_slots := 2;
  ELSIF p_mode = '4v4' THEN v_slots := 4;
  ELSIF p_mode = '5v5' THEN v_slots := 5;
  ELSE RAISE EXCEPTION 'Invalid battle mode: %', p_mode;
  END IF;

  SELECT ARRAY(
    SELECT gm.player_id FROM guild_members gm
    WHERE gm.guild_id = p_clan_a_id ORDER BY random() LIMIT v_slots
  ) INTO v_members_a;

  IF array_length(v_members_a, 1) IS NULL OR array_length(v_members_a, 1) < v_slots THEN
    RETURN jsonb_build_object('success', false, 'message', 'الكلان الأول لا يمتلك عدداً كافياً من الأعضاء');
  END IF;

  SELECT ARRAY(
    SELECT gm.player_id FROM guild_members gm
    WHERE gm.guild_id = p_clan_b_id ORDER BY random() LIMIT v_slots
  ) INTO v_members_b;

  IF array_length(v_members_b, 1) IS NULL OR array_length(v_members_b, 1) < v_slots THEN
    RETURN jsonb_build_object('success', false, 'message', 'الكلان الثاني لا يمتلك عدداً كافياً من الأعضاء');
  END IF;

  v_total_prize := p_stake_per_player * v_slots * 2;

  FOR i IN 1..v_slots LOOP
    UPDATE players SET balance = balance - p_stake_per_player
    WHERE id = v_members_a[i] AND balance >= p_stake_per_player;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'أحد أعضاء الكلان الأول لا يمتلك رصيداً كافياً');
    END IF;
  END LOOP;

  FOR i IN 1..v_slots LOOP
    UPDATE players SET balance = balance - p_stake_per_player
    WHERE id = v_members_b[i] AND balance >= p_stake_per_player;
    IF NOT FOUND THEN
      FOR i IN 1..v_slots LOOP
        UPDATE players SET balance = balance + p_stake_per_player WHERE id = v_members_a[i];
      END LOOP;
      RETURN jsonb_build_object('success', false, 'message', 'أحد أعضاء الكلان الثاني لا يمتلك رصيداً كافياً');
    END IF;
  END LOOP;

  FOR i IN 1..v_slots LOOP
    SELECT p.username, c.name AS card_name, c.image_path AS card_image,
           (1500 + (random() * 600)::int) AS atk,
           (1000 + (random() * 400)::int) AS def
    INTO v_player_a_row
    FROM players p
    LEFT JOIN LATERAL (SELECT ch.name, ch.image_path FROM characters ch WHERE ch.is_active = true ORDER BY random() LIMIT 1) c ON true
    WHERE p.id = v_members_a[i];

    SELECT p.username, c.name AS card_name, c.image_path AS card_image,
           (1500 + (random() * 600)::int) AS atk,
           (1000 + (random() * 400)::int) AS def
    INTO v_player_b_row
    FROM players p
    LEFT JOIN LATERAL (SELECT ch.name, ch.image_path FROM characters ch WHERE ch.is_active = true ORDER BY random() LIMIT 1) c ON true
    WHERE p.id = v_members_b[i];

    v_match := jsonb_build_object(
      'round', i,
      'player_a', jsonb_build_object('id', v_members_a[i], 'username', v_player_a_row.username,
        'card_name', v_player_a_row.card_name, 'card_image', v_player_a_row.card_image,
        'atk', v_player_a_row.atk, 'def', v_player_a_row.def),
      'player_b', jsonb_build_object('id', v_members_b[i], 'username', v_player_b_row.username,
        'card_name', v_player_b_row.card_name, 'card_image', v_player_b_row.card_image,
        'atk', v_player_b_row.atk, 'def', v_player_b_row.def),
      'status', 'pending', 'winner_side', null, 'winner_name', null, 'duel_score', null
    );
    v_matches := v_matches || v_match;
  END LOOP;

  INSERT INTO clan_battles (clan_a_id, clan_b_id, mode, status, stake_per_player, total_prize, matches)
  VALUES (p_clan_a_id, p_clan_b_id, p_mode, 'active', p_stake_per_player, v_total_prize, v_matches)
  RETURNING id INTO v_battle_id;

  RETURN jsonb_build_object('success', true, 'battle_id', v_battle_id, 'mode', p_mode, 'total_prize', v_total_prize);
END;
$$;

-- ============================================================
-- 3. RPC: play_clan_battle_round
-- ============================================================

DROP FUNCTION IF EXISTS play_clan_battle_round(UUID, INTEGER);

CREATE OR REPLACE FUNCTION play_clan_battle_round(
  p_battle_id UUID,
  p_round_index INTEGER
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_battle clan_battles%ROWTYPE;
  v_match JSONB;
  v_player_a JSONB;
  v_player_b JSONB;
  v_atk_a NUMERIC;
  v_atk_b NUMERIC;
  v_winner_side TEXT;
  v_winner_name TEXT;
  v_duel_score TEXT;
  v_updated_matches JSONB;
  v_new_score_a INTEGER := 0;
  v_new_score_b INTEGER := 0;
  v_is_all_done BOOLEAN;
  v_winner_clan_id UUID;
  i INTEGER;
BEGIN
  SELECT * INTO v_battle FROM clan_battles WHERE id = p_battle_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'المعركة غير موجودة');
  END IF;

  IF v_battle.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'message', 'المعركة غير نشطة أو انتهت بالفعل');
  END IF;

  v_match := v_battle.matches -> p_round_index;
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'الجولة المطلوبة غير موجودة');
  END IF;

  IF (v_match ->> 'status') = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'هذه الجولة تمت بالفعل');
  END IF;

  v_player_a := v_match -> 'player_a';
  v_player_b := v_match -> 'player_b';

  v_atk_a := (v_player_a ->> 'atk')::NUMERIC * (0.85 + random() * 0.30);
  v_atk_b := (v_player_b ->> 'atk')::NUMERIC * (0.85 + random() * 0.30);

  IF v_atk_a >= v_atk_b THEN
    v_winner_side := 'A';
    v_winner_name := v_player_a ->> 'username';
  ELSE
    v_winner_side := 'B';
    v_winner_name := v_player_b ->> 'username';
  END IF;

  v_duel_score := ROUND(v_atk_a)::TEXT || ' vs ' || ROUND(v_atk_b)::TEXT;

  v_updated_matches := v_battle.matches;
  v_updated_matches := jsonb_set(v_updated_matches, ARRAY[p_round_index::TEXT, 'status'], '"completed"');
  v_updated_matches := jsonb_set(v_updated_matches, ARRAY[p_round_index::TEXT, 'winner_side'], to_jsonb(v_winner_side));
  v_updated_matches := jsonb_set(v_updated_matches, ARRAY[p_round_index::TEXT, 'winner_name'], to_jsonb(v_winner_name));
  v_updated_matches := jsonb_set(v_updated_matches, ARRAY[p_round_index::TEXT, 'duel_score'], to_jsonb(v_duel_score));

  FOR i IN 0..(jsonb_array_length(v_updated_matches) - 1) LOOP
    IF (v_updated_matches -> i ->> 'winner_side') = 'A' THEN v_new_score_a := v_new_score_a + 1;
    ELSIF (v_updated_matches -> i ->> 'winner_side') = 'B' THEN v_new_score_b := v_new_score_b + 1;
    END IF;
  END LOOP;

  v_is_all_done := NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_updated_matches) m WHERE (m ->> 'status') != 'completed'
  );

  v_winner_clan_id := NULL;
  IF v_is_all_done THEN
    IF v_new_score_a >= v_new_score_b THEN
      v_winner_clan_id := v_battle.clan_a_id;
    ELSE
      v_winner_clan_id := v_battle.clan_b_id;
    END IF;

    UPDATE guilds SET total_winnings = total_winnings + v_battle.total_prize WHERE id = v_winner_clan_id;

    UPDATE clan_battles
    SET matches = v_updated_matches, clan_a_score = v_new_score_a, clan_b_score = v_new_score_b,
        status = 'completed', winner_clan_id = v_winner_clan_id
    WHERE id = p_battle_id;
  ELSE
    UPDATE clan_battles
    SET matches = v_updated_matches, clan_a_score = v_new_score_a, clan_b_score = v_new_score_b
    WHERE id = p_battle_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'winner_side', v_winner_side, 'winner_name', v_winner_name,
    'duel_score', v_duel_score, 'clan_a_score', v_new_score_a, 'clan_b_score', v_new_score_b,
    'matches', v_updated_matches, 'is_all_completed', v_is_all_done, 'winner_clan_id', v_winner_clan_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_clan_battle TO authenticated;
GRANT EXECUTE ON FUNCTION play_clan_battle_round TO authenticated;
