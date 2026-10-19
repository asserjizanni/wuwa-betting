-- ============================================================
-- Migration v4: Real-Time WuWa Card Duels (Replaces Uno)
-- ============================================================

-- 1. Add duel state columns to pvp_challenges
ALTER TABLE pvp_challenges ADD COLUMN IF NOT EXISTS challenger_ready BOOLEAN DEFAULT false;
ALTER TABLE pvp_challenges ADD COLUMN IF NOT EXISTS challenged_ready BOOLEAN DEFAULT false;
ALTER TABLE pvp_challenges ADD COLUMN IF NOT EXISTS current_turn_player_id UUID REFERENCES players(id);
ALTER TABLE pvp_challenges ADD COLUMN IF NOT EXISTS challenger_hand JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pvp_challenges ADD COLUMN IF NOT EXISTS challenged_hand JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pvp_challenges ADD COLUMN IF NOT EXISTS table_cards JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pvp_challenges ADD COLUMN IF NOT EXISTS battle_state JSONB DEFAULT '{"challenger": {"hp": 4000, "shield": 0}, "challenged": {"hp": 4000, "shield": 0}}'::jsonb;
ALTER TABLE pvp_challenges ADD COLUMN IF NOT EXISTS combat_log JSONB DEFAULT '[]'::jsonb;

-- 2. Enable REPLICA IDENTITY FULL on pvp_challenges so Realtime broadcasts complete row diffs
ALTER TABLE pvp_challenges REPLICA IDENTITY FULL;

-- 3. Safely ensure pvp_challenges is in supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pvp_challenges'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pvp_challenges;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Ensure RLS policies allow participating players to update their challenge during duels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pvp_challenges' AND policyname = 'Participants can update challenges'
  ) THEN
    CREATE POLICY "Participants can update challenges" ON pvp_challenges
      FOR UPDATE USING (
        challenger_id = get_player_id() OR challenged_id = get_player_id() OR is_admin()
      );
  END IF;
END $$;

-- ============================================================
-- 5. RPC: start_or_join_manual_duel
-- Called when a player enters the duel arena.
-- Prepares authentic WuWa card hands from player's inventory
-- or assigns high-quality resonator cards if player has none yet.
-- ============================================================
DROP FUNCTION IF EXISTS start_or_join_manual_duel(uuid, uuid);

CREATE OR REPLACE FUNCTION start_or_join_manual_duel(
  p_challenge_id UUID,
  p_player_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
  v_is_challenger BOOLEAN;
  v_hand_c JSONB;
  v_hand_d JSONB;
  v_default_cards JSONB;
  v_both_ready BOOLEAN;
BEGIN
  SELECT * INTO v_challenge FROM pvp_challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'التحدي غير موجود');
  END IF;

  v_is_challenger := (v_challenge.challenger_id = p_player_id);

  -- Set player ready
  IF v_is_challenger THEN
    UPDATE pvp_challenges SET challenger_ready = true WHERE id = p_challenge_id;
    v_challenge.challenger_ready := true;
  ELSE
    UPDATE pvp_challenges SET challenged_ready = true WHERE id = p_challenge_id;
    v_challenge.challenged_ready := true;
  END IF;

  v_both_ready := (v_challenge.challenger_ready AND v_challenge.challenged_ready);

  -- Starter WuWa resonator pool for authentic card battles
  v_default_cards := '[
    {"id": "wuwa_jiyan", "name": "Jiyan (جييان)", "element": "Aero", "rarity": "legendary", "atk": 1150, "def": 750, "image_path": "/characters/jiyan.webp", "type": "resonator", "skill": "Qingloong Swirl (إعصار التنين)"},
    {"id": "wuwa_jinshi", "name": "Jinhsi (جينهسي)", "element": "Spectro", "rarity": "mythic", "atk": 1300, "def": 680, "image_path": "/characters/jinshi.webp", "type": "resonator", "skill": "Temporal Bloom (الازدهار الزمني)"},
    {"id": "wuwa_changli", "name": "Changli (تشانغلي)", "element": "Fusion", "rarity": "mythic", "atk": 1280, "def": 700, "image_path": "/characters/changli.webp", "type": "resonator", "skill": "Flaming Feather (الريشة الملتهبة)"},
    {"id": "wuwa_yinlin", "name": "Yinlin (يينلين)", "element": "Electro", "rarity": "legendary", "atk": 1180, "def": 620, "image_path": "/characters/yinlin.webp", "type": "resonator", "skill": "Thunder Puppeteer (صاعقة الدمية)"},
    {"id": "wuwa_camellya", "name": "Camellya (كاميليا)", "element": "Havoc", "rarity": "legendary", "atk": 1220, "def": 650, "image_path": "/characters/camellya.webp", "type": "resonator", "skill": "Crimson Vines (الكروم القرمزية)"},
    {"id": "wuwa_verina", "name": "Verina (فيرينا)", "element": "Spectro", "rarity": "epic", "atk": 850, "def": 950, "image_path": "/characters/verina.webp", "type": "support", "skill": "Photosynthesis (شفاء الأوراق)"},
    {"id": "wuwa_calcharo", "name": "Calcharo (كالتشارو)", "element": "Electro", "rarity": "legendary", "atk": 1100, "def": 720, "image_path": "/characters/calcharo.webp", "type": "resonator", "skill": "Phantom Blade (نصل الظل)"},
    {"id": "wuwa_encore", "name": "Encore (أنكور)", "element": "Fusion", "rarity": "epic", "atk": 980, "def": 690, "image_path": "/characters/encore.webp", "type": "resonator", "skill": "Woolies Frenzy (هياج الصوف)"},
    {"id": "wuwa_sanhua", "name": "Sanhua (سانهوا)", "element": "Glacio", "rarity": "rare", "atk": 920, "def": 640, "image_path": "/characters/sanhua.webp", "type": "resonator", "skill": "Glacier Burst (انفجار الجليد)"},
    {"id": "wuwa_rover", "name": "Rover (المسافر)", "element": "Havoc", "rarity": "epic", "atk": 1050, "def": 800, "image_path": "/characters/rover-electro.webp", "type": "resonator", "skill": "Echo Resonance (رنين الصدى)"}
  ]'::jsonb;

  -- Deal hands if empty
  IF v_challenge.challenger_hand IS NULL OR jsonb_array_length(v_challenge.challenger_hand) = 0 THEN
    -- Try to fetch actual cards owned by challenger
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', pc.id::text,
        'card_id', c.id::text,
        'name', COALESCE(c.name, 'بطاقة رنين'),
        'element', COALESCE(c.element, 'Spectro'),
        'rarity', COALESCE(c.rarity, 'rare'),
        'atk', COALESCE((c.stats->>'atk')::numeric, 900 + FLOOR(random() * 300)),
        'def', COALESCE((c.stats->>'def')::numeric, 600 + FLOOR(random() * 200)),
        'image_path', COALESCE(c.image_path, '/characters/rover-electro.webp'),
        'type', 'resonator',
        'skill', COALESCE(c.title, 'ضربة الرنين الخاصة')
      )
    ) INTO v_hand_c
    FROM (
      SELECT id, card_id FROM player_cards WHERE player_id = v_challenge.challenger_id LIMIT 5
    ) pc
    JOIN cards c ON c.id = pc.card_id;

    -- If challenger has fewer than 5 cards, populate from curated WuWa pool
    IF v_hand_c IS NULL OR jsonb_array_length(v_hand_c) < 5 THEN
      v_hand_c := jsonb_build_array(
        v_default_cards->0,
        v_default_cards->1,
        v_default_cards->2,
        v_default_cards->5,
        v_default_cards->9
      );
    END IF;

    -- Try to fetch actual cards owned by challenged player
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', pc.id::text,
        'card_id', c.id::text,
        'name', COALESCE(c.name, 'بطاقة رنين'),
        'element', COALESCE(c.element, 'Electro'),
        'rarity', COALESCE(c.rarity, 'rare'),
        'atk', COALESCE((c.stats->>'atk')::numeric, 900 + FLOOR(random() * 300)),
        'def', COALESCE((c.stats->>'def')::numeric, 600 + FLOOR(random() * 200)),
        'image_path', COALESCE(c.image_path, '/characters/yangyang.webp'),
        'type', 'resonator',
        'skill', COALESCE(c.title, 'ضربة الرنين الخاصة')
      )
    ) INTO v_hand_d
    FROM (
      SELECT id, card_id FROM player_cards WHERE player_id = v_challenge.challenged_id LIMIT 5
    ) pc
    JOIN cards c ON c.id = pc.card_id;

    IF v_hand_d IS NULL OR jsonb_array_length(v_hand_d) < 5 THEN
      v_hand_d := jsonb_build_array(
        v_default_cards->3,
        v_default_cards->4,
        v_default_cards->6,
        v_default_cards->7,
        v_default_cards->8
      );
    END IF;

    UPDATE pvp_challenges
    SET
      challenger_hand = v_hand_c,
      challenged_hand = v_hand_d,
      current_turn_player_id = v_challenge.challenger_id,
      battle_state = '{"challenger": {"hp": 4000, "shield": 0}, "challenged": {"hp": 4000, "shield": 0}}'::jsonb,
      table_cards = '[]'::jsonb,
      combat_log = jsonb_build_array(
        jsonb_build_object(
          'text', '⚔️ بدأت ساحة معركة كروت رنين WuWa! الدور يبدأ عند المتحدي.',
          'type', 'info',
          'time', NOW()
        )
      )
    WHERE id = p_challenge_id;

    v_challenge.challenger_hand := v_hand_c;
    v_challenge.challenged_hand := v_hand_d;
    v_challenge.current_turn_player_id := v_challenge.challenger_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'both_ready', v_both_ready,
    'challenger_ready', v_challenge.challenger_ready,
    'challenged_ready', v_challenge.challenged_ready,
    'current_turn_player_id', v_challenge.current_turn_player_id,
    'battle_state', v_challenge.battle_state,
    'table_cards', COALESCE(v_challenge.table_cards, '[]'::jsonb),
    'combat_log', COALESCE(v_challenge.combat_log, '[]'::jsonb),
    'challenger_hand', v_challenge.challenger_hand,
    'challenged_hand', v_challenge.challenged_hand
  );
END;
$$;

-- ============================================================
-- 6. RPC: play_manual_card_turn
-- Plays a WuWa resonator card onto the arena table.
-- Applies ATK / DEF / Healing / Shielding mechanics.
-- Broadcasts via Supabase Realtime to both screens instantly!
-- ============================================================
DROP FUNCTION IF EXISTS play_manual_card_turn(uuid, uuid, text);

CREATE OR REPLACE FUNCTION play_manual_card_turn(
  p_challenge_id UUID,
  p_player_id UUID,
  p_card_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
  v_is_challenger BOOLEAN;
  v_my_hand JSONB;
  v_new_hand JSONB := '[]'::jsonb;
  v_played_card JSONB := NULL;
  v_card JSONB;
  v_atk NUMERIC;
  v_def NUMERIC;
  v_dmg NUMERIC;
  v_heal NUMERIC := 0;
  v_shield_gain NUMERIC := 0;
  v_bs JSONB;
  v_target_hp NUMERIC;
  v_target_shield NUMERIC;
  v_my_hp NUMERIC;
  v_my_shield NUMERIC;
  v_next_turn_id UUID;
  v_is_finished BOOLEAN := false;
  v_winner_id UUID := NULL;
  v_log_msg TEXT;
  v_player_name TEXT;
  v_table_entry JSONB;
  v_reward NUMERIC;
  i INTEGER;
BEGIN
  SELECT * INTO v_challenge FROM pvp_challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'التحدي غير موجود');
  END IF;

  IF v_challenge.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'المبارزة منتهية بالفعل');
  END IF;

  IF v_challenge.current_turn_player_id IS NOT NULL AND v_challenge.current_turn_player_id != p_player_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'ليس دورك الآن! بانتظار حركة الخصم');
  END IF;

  v_is_challenger := (v_challenge.challenger_id = p_player_id);
  v_my_hand := CASE WHEN v_is_challenger THEN v_challenge.challenger_hand ELSE v_challenge.challenged_hand END;

  -- Locate card in player's hand
  FOR i IN 0..(jsonb_array_length(v_my_hand) - 1) LOOP
    v_card := v_my_hand->i;
    IF (v_card->>'id') = p_card_id AND v_played_card IS NULL THEN
      v_played_card := v_card;
    ELSE
      v_new_hand := v_new_hand || jsonb_build_array(v_card);
    END IF;
  END LOOP;

  IF v_played_card IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'البطاقة غير موجودة في يدك');
  END IF;

  -- Load players name
  SELECT username INTO v_player_name FROM players WHERE id = p_player_id;

  v_bs := v_challenge.battle_state;
  IF v_is_challenger THEN
    v_my_hp := (v_bs->'challenger'->>'hp')::numeric;
    v_my_shield := (v_bs->'challenger'->>'shield')::numeric;
    v_target_hp := (v_bs->'challenged'->>'hp')::numeric;
    v_target_shield := (v_bs->'challenged'->>'shield')::numeric;
    v_next_turn_id := v_challenge.challenged_id;
  ELSE
    v_my_hp := (v_bs->'challenged'->>'hp')::numeric;
    v_my_shield := (v_bs->'challenged'->>'shield')::numeric;
    v_target_hp := (v_bs->'challenger'->>'hp')::numeric;
    v_target_shield := (v_bs->'challenger'->>'shield')::numeric;
    v_next_turn_id := v_challenge.challenger_id;
  END IF;

  -- Card calculation based on resonator stats & element
  v_atk := COALESCE((v_played_card->>'atk')::numeric, 900);
  v_def := COALESCE((v_played_card->>'def')::numeric, 600);

  IF (v_played_card->>'type') = 'support' THEN
    -- Healing card restores HP and provides shield
    v_heal := 500 + FLOOR(random() * 300);
    v_shield_gain := 300;
    v_dmg := 250;
    v_my_hp := LEAST(4000::numeric, v_my_hp + v_heal);
    v_my_shield := v_my_shield + v_shield_gain;
    v_log_msg := v_player_name || ' أطلق دعم ' || (v_played_card->>'name') || ' واستعاد ' || v_heal::text || ' LP ودرع +' || v_shield_gain::text;
  ELSE
    -- Attack resonator strikes opponent's shield and HP
    v_dmg := FLOOR(v_atk * (0.80 + random() * 0.40));
    
    -- Element synergy bonus (15% chance of critical resonance)
    IF random() < 0.20 THEN
      v_dmg := FLOOR(v_dmg * 1.35);
      v_log_msg := '💥 ضربة رنين خارقة! ' || v_player_name || ' ألقى ' || (v_played_card->>'name') || ' بقوة ' || v_dmg::text || ' ضرر!';
    ELSE
      v_log_msg := v_player_name || ' ألقى ' || (v_played_card->>'name') || ' ملحقاً ' || v_dmg::text || ' ضرر بالمنافس.';
    END IF;
  END IF;

  -- Apply damage to target shield then HP
  IF v_target_shield > 0 THEN
    IF v_dmg <= v_target_shield THEN
      v_target_shield := v_target_shield - v_dmg;
      v_dmg := 0;
    ELSE
      v_dmg := v_dmg - v_target_shield;
      v_target_shield := 0;
    END IF;
  END IF;

  v_target_hp := GREATEST(0::numeric, v_target_hp - v_dmg);

  -- Check if win condition met
  IF v_target_hp <= 0 THEN
    v_is_finished := true;
    v_winner_id := p_player_id;
  END IF;

  -- If both hands empty and no one knocked out, highest remaining HP wins
  IF NOT v_is_finished AND jsonb_array_length(v_new_hand) = 0 THEN
    IF v_is_challenger THEN
      IF jsonb_array_length(v_challenge.challenged_hand) = 0 THEN
        v_is_finished := true;
        v_winner_id := CASE WHEN v_my_hp >= v_target_hp THEN p_player_id ELSE v_challenge.challenged_id END;
      END IF;
    ELSE
      IF jsonb_array_length(v_challenge.challenger_hand) = 0 THEN
        v_is_finished := true;
        v_winner_id := CASE WHEN v_my_hp >= v_target_hp THEN p_player_id ELSE v_challenge.challenger_id END;
      END IF;
    END IF;
  END IF;

  -- Rebuild battle state
  IF v_is_challenger THEN
    v_bs := jsonb_build_object(
      'challenger', jsonb_build_object('hp', v_my_hp, 'shield', v_my_shield),
      'challenged', jsonb_build_object('hp', v_target_hp, 'shield', v_target_shield)
    );
  ELSE
    v_bs := jsonb_build_object(
      'challenger', jsonb_build_object('hp', v_target_hp, 'shield', v_target_shield),
      'challenged', jsonb_build_object('hp', v_my_hp, 'shield', v_my_shield)
    );
  END IF;

  -- Table entry for the played card
  v_table_entry := jsonb_build_object(
    'card', v_played_card,
    'played_by_id', p_player_id,
    'played_by_name', v_player_name,
    'damage_dealt', v_dmg,
    'heal_amount', v_heal,
    'played_at', NOW()
  );

  -- Award prize on finish
  IF v_is_finished THEN
    v_reward := v_challenge.stake * 2;
    UPDATE players SET balance = balance + v_reward, total_winnings = total_winnings + v_reward WHERE id = v_winner_id;
    
    INSERT INTO balance_transactions (player_id, amount, type, description)
    VALUES (
      v_winner_id,
      v_reward,
      'win_reward',
      'فوز في تحدي ساحة كروت WuWa المباشر برهان ' || v_challenge.stake::text
    );
  END IF;

  -- Update database record
  UPDATE pvp_challenges
  SET
    challenger_hand = CASE WHEN v_is_challenger THEN v_new_hand ELSE challenger_hand END,
    challenged_hand = CASE WHEN NOT v_is_challenger THEN v_new_hand ELSE challenged_hand END,
    current_turn_player_id = CASE WHEN v_is_finished THEN NULL ELSE v_next_turn_id END,
    battle_state = v_bs,
    table_cards = COALESCE(table_cards, '[]'::jsonb) || jsonb_build_array(v_table_entry),
    combat_log = COALESCE(combat_log, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('text', v_log_msg, 'time', NOW(), 'player_id', p_player_id)
    ),
    status = CASE WHEN v_is_finished THEN 'completed' ELSE status END,
    winner_id = CASE WHEN v_is_finished THEN v_winner_id ELSE winner_id END,
    resolved_at = CASE WHEN v_is_finished THEN NOW() ELSE resolved_at END
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object(
    'success', true,
    'is_finished', v_is_finished,
    'winner_id', v_winner_id,
    'current_turn_player_id', CASE WHEN v_is_finished THEN NULL ELSE v_next_turn_id END,
    'battle_state', v_bs,
    'table_cards', COALESCE(v_challenge.table_cards, '[]'::jsonb) || jsonb_build_array(v_table_entry),
    'combat_log', COALESCE(v_challenge.combat_log, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('text', v_log_msg, 'time', NOW(), 'player_id', p_player_id)
    )
  );
END;
$$;
