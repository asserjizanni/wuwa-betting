-- ============================================================
-- Migration V5: Comprehensive Game Systems Upgrade
-- Boxes Fixes, Bosses, Animated Titles, Cosmetics, Clan Roles,
-- Player Decks, Card Upgrades, and Rewards Architecture
-- ============================================================

-- ------------------------------------------------------------
-- 1. BOXES & BOX_CARDS FIXES (Phase 1)
-- ------------------------------------------------------------

-- Ensure RLS policies on boxes and box_cards allow administrative operations
DROP POLICY IF EXISTS "Public read boxes" ON public.boxes;
CREATE POLICY "Public read boxes" ON public.boxes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for boxes" ON public.boxes;
CREATE POLICY "Allow all for boxes" ON public.boxes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read box_cards" ON public.box_cards;
CREATE POLICY "Public read box_cards" ON public.box_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for box_cards" ON public.box_cards;
CREATE POLICY "Allow all for box_cards" ON public.box_cards FOR ALL USING (true) WITH CHECK (true);

-- Upgrade admin_save_box to safely handle inserts, updates, and card rates atomically
CREATE OR REPLACE FUNCTION public.admin_save_box(
  p_admin_id uuid DEFAULT NULL::uuid,
  p_box_id uuid DEFAULT NULL::uuid,
  p_name text DEFAULT NULL::text,
  p_name_ar text DEFAULT NULL::text,
  p_description_ar text DEFAULT NULL::text,
  p_image_url text DEFAULT NULL::text,
  p_price integer DEFAULT 100,
  p_multi_price integer DEFAULT NULL::integer,
  p_multi_count integer DEFAULT 10,
  p_badge text DEFAULT 'جديد'::text,
  p_accent_color text DEFAULT '#6366f1'::text,
  p_is_active boolean DEFAULT true,
  p_is_limited boolean DEFAULT false,
  p_starts_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_ends_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_pity_threshold integer DEFAULT 10,
  p_guaranteed_rarity text DEFAULT 'legendary'::text,
  p_duplicate_policy text DEFAULT 'keep'::text,
  p_sort_order integer DEFAULT 0,
  p_cards jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_box_id UUID;
  v_card RECORD;
  v_effective_multi_price INTEGER;
BEGIN
  -- Validate Admin if provided; if NULL, check if any active admin exists
  IF p_admin_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM admins WHERE id = p_admin_id AND is_active = true) THEN
      RETURN jsonb_build_object('success', false, 'message', 'غير مصرح: المشرف غير موجود أو معطل');
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM admins WHERE is_active = true) THEN
      RETURN jsonb_build_object('success', false, 'message', 'غير مصرح');
    END IF;
  END IF;

  IF p_name_ar IS NULL OR TRIM(p_name_ar) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'اسم الصندوق بالعربية مطلوب');
  END IF;

  IF p_price <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'سعر السحب يجب أن يكون أكبر من صفر');
  END IF;

  v_effective_multi_price := COALESCE(p_multi_price, p_price * p_multi_count);

  IF p_box_id IS NULL THEN
    INSERT INTO public.boxes (
      name, name_ar, description_ar, image_url, price, multi_price, multi_count,
      badge, accent_color, is_active, is_limited, starts_at, ends_at,
      pity_threshold, guaranteed_rarity, duplicate_policy, sort_order
    ) VALUES (
      COALESCE(p_name, p_name_ar), TRIM(p_name_ar), COALESCE(p_description_ar, ''), 
      COALESCE(p_image_url, '/logo.jpeg'), p_price, v_effective_multi_price, p_multi_count,
      COALESCE(p_badge, 'جديد'), COALESCE(p_accent_color, '#6366f1'), p_is_active,
      p_is_limited, p_starts_at, p_ends_at, p_pity_threshold, p_guaranteed_rarity,
      p_duplicate_policy, p_sort_order
    ) RETURNING id INTO v_box_id;
  ELSE
    UPDATE public.boxes SET
      name = COALESCE(p_name, name),
      name_ar = TRIM(p_name_ar),
      description_ar = COALESCE(p_description_ar, description_ar),
      image_url = COALESCE(p_image_url, image_url),
      price = p_price,
      multi_price = v_effective_multi_price,
      multi_count = p_multi_count,
      badge = p_badge,
      accent_color = p_accent_color,
      is_active = p_is_active,
      is_limited = p_is_limited,
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      pity_threshold = p_pity_threshold,
      guaranteed_rarity = p_guaranteed_rarity,
      duplicate_policy = p_duplicate_policy,
      sort_order = p_sort_order
    WHERE id = p_box_id;
    v_box_id := p_box_id;
  END IF;

  -- Update box cards if provided
  IF p_cards IS NOT NULL AND jsonb_array_length(p_cards) > 0 THEN
    DELETE FROM public.box_cards WHERE box_id = v_box_id;
    
    FOR v_card IN SELECT * FROM jsonb_to_recordset(p_cards) AS x(card_id uuid, drop_rate_pct numeric, weight integer)
    LOOP
      INSERT INTO public.box_cards (box_id, card_id, drop_rate_pct, weight)
      VALUES (
        v_box_id, 
        v_card.card_id, 
        COALESCE(v_card.drop_rate_pct, 1.0), 
        COALESCE(v_card.weight, 10)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'box_id', v_box_id, 'message', 'تم حفظ الصندوق بنجاح');
END;
$function$;

-- Admin delete box function
CREATE OR REPLACE FUNCTION public.admin_delete_box(
  p_admin_id uuid DEFAULT NULL::uuid,
  p_box_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF p_box_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'معرف الصندوق مطلوب');
  END IF;

  DELETE FROM public.box_cards WHERE box_id = p_box_id;
  DELETE FROM public.boxes WHERE id = p_box_id;

  RETURN jsonb_build_object('success', true, 'message', 'تم حذف الصندوق ومحتوياته بنجاح');
END;
$function$;

-- ------------------------------------------------------------
-- 2. TITLES & ANIMATED TITLES SYSTEM (Section 7)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  description text,
  icon text DEFAULT '👑',
  color text DEFAULT '#f59e0b',
  rarity text DEFAULT 'legendary', -- common, rare, epic, legendary, mythic
  animation_style text DEFAULT 'legendary_glow', -- legendary_glow, mythic_flame, abyssal_void, solaris_radiance, phantom
  source_type text DEFAULT 'achievement', -- event, boss, achievement, admin_grant
  source_id text,
  is_exclusive boolean DEFAULT false,
  is_active boolean DEFAULT true,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  title_id uuid REFERENCES public.titles(id) ON DELETE CASCADE,
  is_equipped boolean DEFAULT false,
  unlocked_at timestamp with time zone DEFAULT now(),
  obtained_via text DEFAULT 'achievement',
  UNIQUE(player_id, title_id)
);

ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_titles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read titles" ON public.titles;
CREATE POLICY "Public read titles" ON public.titles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage titles" ON public.titles;
CREATE POLICY "Admin manage titles" ON public.titles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read player_titles" ON public.player_titles;
CREATE POLICY "Public read player_titles" ON public.player_titles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Player manage player_titles" ON public.player_titles;
CREATE POLICY "Player manage player_titles" ON public.player_titles FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 3. COSMETICS & PROFILE SYSTEM (Section 6)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cosmetics (
  id text PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text,
  type text NOT NULL, -- frame, background, name_effect
  rarity text DEFAULT 'rare',
  asset_url text,
  preview_style jsonb DEFAULT '{}'::jsonb,
  description text,
  is_animated boolean DEFAULT false,
  is_exclusive boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_cosmetics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  cosmetic_id text REFERENCES public.cosmetics(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone DEFAULT now(),
  UNIQUE(player_id, cosmetic_id)
);

ALTER TABLE public.cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_cosmetics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read cosmetics" ON public.cosmetics;
CREATE POLICY "Public read cosmetics" ON public.cosmetics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage cosmetics" ON public.cosmetics;
CREATE POLICY "Admin manage cosmetics" ON public.cosmetics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read player_cosmetics" ON public.player_cosmetics;
CREATE POLICY "Public read player_cosmetics" ON public.player_cosmetics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Player manage player_cosmetics" ON public.player_cosmetics FOR ALL USING (true) WITH CHECK (true);

-- Add profile customization columns to players
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS equipped_title_id uuid REFERENCES public.titles(id) ON DELETE SET NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS avatar_frame_id text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS profile_bg_id text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS favorite_card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS custom_avatar_url text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"show_history": true, "show_collection": true, "show_stats": true}'::jsonb;

-- ------------------------------------------------------------
-- 4. LEGENDARY BOSSES SYSTEM (Section 5)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.bosses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  title text,
  description text,
  avatar_url text,
  cover_image_url text,
  difficulty text DEFAULT 'Hard', -- Hard, Nightmare, Abyssal, Impossible
  ai_level text DEFAULT 'Tactical', -- Tactical, Advanced, Mastermind
  accent_color text DEFAULT '#ef4444',
  is_active boolean DEFAULT true,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  stats jsonb DEFAULT '{"hp": 6000, "atk": 280, "def": 140, "speed": 110, "crit_rate": 15, "crit_dmg": 160, "shield": 300, "heal": 150, "revive_count": 0}'::jsonb,
  deck jsonb DEFAULT '[]'::jsonb,
  rewards jsonb DEFAULT '{"points": 1000, "exclusive_card_id": null, "exclusive_title_id": null, "exclusive_frame_id": null}'::jsonb,
  total_attempts integer DEFAULT 0,
  total_defeats integer DEFAULT 0,
  first_defeat_player_id uuid REFERENCES public.players(id),
  first_defeat_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.boss_battle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_id uuid REFERENCES public.bosses(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  player_deck jsonb DEFAULT '[]'::jsonb,
  boss_deck jsonb DEFAULT '[]'::jsonb,
  is_victory boolean NOT NULL,
  turns_count integer DEFAULT 1,
  damage_dealt numeric DEFAULT 0,
  damage_taken numeric DEFAULT 0,
  rewards_granted jsonb DEFAULT '{}'::jsonb,
  combat_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.boss_first_victories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_id uuid REFERENCES public.bosses(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  claimed_at timestamp with time zone DEFAULT now(),
  UNIQUE(boss_id, player_id)
);

ALTER TABLE public.bosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_battle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_first_victories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read bosses" ON public.bosses;
CREATE POLICY "Public read bosses" ON public.bosses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage bosses" ON public.bosses;
CREATE POLICY "Admin manage bosses" ON public.bosses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read boss logs" ON public.boss_battle_logs;
CREATE POLICY "Public read boss logs" ON public.boss_battle_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert boss logs" ON public.boss_battle_logs;
CREATE POLICY "Public insert boss logs" ON public.boss_battle_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read boss first victories" ON public.boss_first_victories;
CREATE POLICY "Public read boss first victories" ON public.boss_first_victories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public manage boss first victories" ON public.boss_first_victories;
CREATE POLICY "Public manage boss first victories" ON public.boss_first_victories FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 5. CLAN ROLES & PERMISSIONS SYSTEM (Section 8)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.clan_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid REFERENCES public.guilds(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#6366f1',
  icon text DEFAULT '🛡️',
  display_order integer DEFAULT 0,
  can_invite boolean DEFAULT true,
  can_accept_requests boolean DEFAULT false,
  can_manage_events boolean DEFAULT false,
  can_post_announcements boolean DEFAULT false,
  can_manage_roles boolean DEFAULT false,
  created_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.guild_members ADD COLUMN IF NOT EXISTS base_role text DEFAULT 'member'; -- leader, deputy_leader, member
ALTER TABLE public.guild_members ADD COLUMN IF NOT EXISTS custom_role_id uuid REFERENCES public.clan_custom_roles(id) ON DELETE SET NULL;

ALTER TABLE public.clan_custom_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read clan roles" ON public.clan_custom_roles;
CREATE POLICY "Public read clan roles" ON public.clan_custom_roles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Clan manage custom roles" ON public.clan_custom_roles;
CREATE POLICY "Clan manage custom roles" ON public.clan_custom_roles FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 6. PLAYER CHALLENGE DECKS SYSTEM (Section 3)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.player_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  name text NOT NULL,
  card_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_favorite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.player_decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Player view own decks" ON public.player_decks;
CREATE POLICY "Player view own decks" ON public.player_decks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Player manage own decks" ON public.player_decks;
CREATE POLICY "Player manage own decks" ON public.player_decks FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 7. CARD UPGRADE & STATS SYSTEM (Section 4)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upgrade_player_card(
  p_player_id uuid,
  p_player_card_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_player RECORD;
  v_pcard RECORD;
  v_card RECORD;
  v_current_level INTEGER;
  v_next_level INTEGER;
  v_cost INTEGER;
  v_new_balance NUMERIC;
BEGIN
  -- 1. Validate Player
  SELECT * INTO v_player FROM public.players WHERE id = p_player_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'اللاعب غير موجود');
  END IF;

  -- 2. Validate Card Ownership
  SELECT * INTO v_pcard FROM public.player_cards WHERE id = p_player_card_id AND player_id = p_player_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'البطاقة غير موجودة في مجموعتك');
  END IF;

  SELECT * INTO v_card FROM public.cards WHERE id = v_pcard.card_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'بيانات البطاقة الأساسية غير متوفرة');
  END IF;

  v_current_level := COALESCE(v_pcard.evolution_level, 1);
  IF v_current_level >= 10 THEN
    RETURN jsonb_build_object('success', false, 'message', 'وصلت هذه البطاقة إلى أقصى مستوى تطوير (Lv.10)!');
  END IF;

  v_next_level := v_current_level + 1;
  -- Upgrade Cost Formula: level * 150 points
  v_cost := v_current_level * 150;

  IF v_player.balance < v_cost THEN
    RETURN jsonb_build_object('success', false, 'message', 'رصيدك غير كافٍ لتطوير البطاقة (تحتاج ' || v_cost || ' نقطة)');
  END IF;

  -- Deduct Balance
  v_new_balance := v_player.balance - v_cost;
  UPDATE public.players
  SET balance = v_new_balance, updated_at = now()
  WHERE id = p_player_id;

  -- Record Transaction
  INSERT INTO public.transactions (
    player_id, transaction_type, amount, balance_before, balance_after, description, created_at
  ) VALUES (
    p_player_id, 'card_evolution'::transaction_type, -v_cost, v_player.balance, v_new_balance,
    'تطوير بطاقة [' || COALESCE(v_card.name, 'بطاقة') || '] إلى المستوى Lv.' || v_next_level, now()
  );

  -- Upgrade player card level (Rarity stays EXACTLY the same)
  UPDATE public.player_cards
  SET evolution_level = v_next_level
  WHERE id = p_player_card_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم تطوير إحصائيات البطاقة بنجاح إلى Lv.' || v_next_level || '! 🌟',
    'new_level', v_next_level,
    'new_balance', v_new_balance,
    'cost', v_cost
  );
END;
$function$;

-- ------------------------------------------------------------
-- 8. BOSS MANAGEMENT RPC FUNCTIONS (Phase 4)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_save_boss(
  p_admin_id uuid DEFAULT NULL::uuid,
  p_boss_id uuid DEFAULT NULL::uuid,
  p_name text DEFAULT NULL::text,
  p_name_ar text DEFAULT NULL::text,
  p_title text DEFAULT NULL::text,
  p_description text DEFAULT NULL::text,
  p_avatar_url text DEFAULT NULL::text,
  p_cover_image_url text DEFAULT NULL::text,
  p_difficulty text DEFAULT 'Hard'::text,
  p_ai_level text DEFAULT 'Tactical'::text,
  p_accent_color text DEFAULT '#ef4444'::text,
  p_is_active boolean DEFAULT true,
  p_stats jsonb DEFAULT '{"hp": 6000, "atk": 280, "def": 140, "speed": 110, "crit_rate": 15, "crit_dmg": 160, "shield": 300, "heal": 150, "revive_count": 0}'::jsonb,
  p_deck jsonb DEFAULT '[]'::jsonb,
  p_rewards jsonb DEFAULT '{"points": 1000}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_boss_id UUID;
BEGIN
  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'اسم الزعيم مطلوب');
  END IF;

  IF p_boss_id IS NULL THEN
    INSERT INTO public.bosses (
      name, name_ar, title, description, avatar_url, cover_image_url,
      difficulty, ai_level, accent_color, is_active, stats, deck, rewards
    ) VALUES (
      TRIM(p_name), COALESCE(p_name_ar, p_name), p_title, p_description,
      COALESCE(p_avatar_url, '/characters/scar.webp'), p_cover_image_url,
      p_difficulty, p_ai_level, p_accent_color, p_is_active, p_stats, p_deck, p_rewards
    ) RETURNING id INTO v_boss_id;
  ELSE
    UPDATE public.bosses SET
      name = TRIM(p_name),
      name_ar = COALESCE(p_name_ar, name_ar),
      title = p_title,
      description = p_description,
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      cover_image_url = p_cover_image_url,
      difficulty = p_difficulty,
      ai_level = p_ai_level,
      accent_color = p_accent_color,
      is_active = p_is_active,
      stats = p_stats,
      deck = p_deck,
      rewards = p_rewards,
      updated_at = now()
    WHERE id = p_boss_id;
    v_boss_id := p_boss_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'boss_id', v_boss_id, 'message', 'تم حفظ الزعيم الأسطوري بنجاح! 🐉');
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_boss(
  p_admin_id uuid DEFAULT NULL::uuid,
  p_boss_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF p_boss_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'معرف الزعيم مطلوب');
  END IF;

  DELETE FROM public.boss_battle_logs WHERE boss_id = p_boss_id;
  DELETE FROM public.bosses WHERE id = p_boss_id;

  RETURN jsonb_build_object('success', true, 'message', 'تم حذف الزعيم وسجلاته بنجاح');
END;
$function$;

-- ------------------------------------------------------------
-- 9. BOSS BATTLE ENGINE WITH DYNAMIC AI (Section 5)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.execute_boss_battle(
  p_player_id uuid,
  p_boss_id uuid,
  p_player_card_ids jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_player RECORD;
  v_boss RECORD;
  v_card_id UUID;
  v_pcard RECORD;
  v_base_card RECORD;
  
  -- Player Team aggregates
  v_player_total_hp NUMERIC := 0;
  v_player_current_hp NUMERIC := 0;
  v_player_team_atk NUMERIC := 0;
  v_player_team_def NUMERIC := 0;
  v_player_team_spd NUMERIC := 0;
  v_player_team_crit NUMERIC := 0;
  v_player_team_crit_dmg NUMERIC := 150;
  v_player_card_count INTEGER := 0;
  v_player_deck_info JSONB := '[]'::jsonb;

  -- Boss aggregates
  v_boss_max_hp NUMERIC;
  v_boss_current_hp NUMERIC;
  v_boss_atk NUMERIC;
  v_boss_def NUMERIC;
  v_boss_spd NUMERIC;
  v_boss_crit NUMERIC;
  v_boss_crit_dmg NUMERIC;
  v_boss_shield NUMERIC;
  v_boss_heal NUMERIC;
  v_boss_revives INTEGER;

  -- Battle state
  v_turn INTEGER := 0;
  v_is_victory BOOLEAN := false;
  v_log JSONB := '[]'::jsonb;
  v_dmg NUMERIC;
  v_boss_dmg NUMERIC;
  v_is_crit BOOLEAN;
  v_reward_points NUMERIC := 0;
  v_first_blood BOOLEAN := false;
  v_first_victory BOOLEAN := false;
  v_rewards_granted JSONB := '{}'::jsonb;
  v_exclusive_card_id UUID := NULL;
  v_exclusive_title_id UUID := NULL;
  v_new_serial INTEGER;
BEGIN
  -- 1. Validate Player
  SELECT * INTO v_player FROM public.players WHERE id = p_player_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'اللاعب غير موجود');
  END IF;

  -- 2. Validate Boss
  SELECT * INTO v_boss FROM public.bosses WHERE id = p_boss_id FOR UPDATE;
  IF NOT FOUND OR v_boss.is_active = false THEN
    RETURN jsonb_build_object('success', false, 'message', 'الزعيم غير متوفر حالياً');
  END IF;

  -- 3. Validate Player Deck (Between 1 and 5 cards allowed!)
  IF p_player_card_ids IS NULL OR jsonb_array_length(p_player_card_ids) < 1 THEN
    RETURN jsonb_build_object('success', false, 'message', 'تحتاج لاختيار بطاقة واحدة على الأقل لخوض المعركة!');
  END IF;

  IF jsonb_array_length(p_player_card_ids) > 5 THEN
    RETURN jsonb_build_object('success', false, 'message', 'الحد الأقصى لتشكيلة المعركة هو 5 بطاقات فقط!');
  END IF;

  -- Build Player Team Stats with REAL Evolution Levels
  FOR v_card_id IN SELECT value::text::uuid FROM jsonb_array_elements_text(p_player_card_ids)
  LOOP
    -- Look up in player_cards to ensure real ownership and real evolution level
    SELECT * INTO v_pcard 
    FROM public.player_cards 
    WHERE (id = v_card_id OR card_id = v_card_id) AND player_id = p_player_id
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'إحدى البطاقات المختارة غير مملوكة لك!');
    END IF;

    SELECT * INTO v_base_card FROM public.cards WHERE id = v_pcard.card_id;
    IF FOUND THEN
      DECLARE
        lvl INTEGER := COALESCE(v_pcard.evolution_level, 1);
        stat_scale NUMERIC := 1.0 + ((lvl - 1) * 0.15);
        c_hp NUMERIC := COALESCE((v_base_card.stats->>'hp')::numeric, 1200) * stat_scale;
        c_atk NUMERIC := COALESCE((v_base_card.stats->>'atk')::numeric, 180) * (1.0 + ((lvl - 1) * 0.12));
        c_def NUMERIC := COALESCE((v_base_card.stats->>'def')::numeric, 90) * (1.0 + ((lvl - 1) * 0.10));
        c_spd NUMERIC := COALESCE((v_base_card.stats->>'speed')::numeric, 100);
        c_crit NUMERIC := COALESCE((v_base_card.stats->>'crit_rate')::numeric, 15);
      BEGIN
        v_player_total_hp := v_player_total_hp + c_hp;
        v_player_team_atk := v_player_team_atk + c_atk;
        v_player_team_def := v_player_team_def + c_def;
        v_player_team_spd := GREATEST(v_player_team_spd, c_spd);
        v_player_team_crit := GREATEST(v_player_team_crit, c_crit);
        v_player_card_count := v_player_card_count + 1;

        v_player_deck_info := v_player_deck_info || jsonb_build_array(jsonb_build_object(
          'id', v_base_card.id,
          'name', v_base_card.name,
          'rarity', v_base_card.rarity,
          'element', v_base_card.element,
          'level', lvl,
          'image', v_base_card.image_path,
          'hp', c_hp,
          'atk', c_atk,
          'def', c_def
        ));
      END;
    END IF;
  END LOOP;

  v_player_current_hp := v_player_total_hp;

  -- Extract Boss Stats
  v_boss_max_hp := COALESCE((v_boss.stats->>'hp')::numeric, 6000);
  v_boss_current_hp := v_boss_max_hp;
  v_boss_atk := COALESCE((v_boss.stats->>'atk')::numeric, 280);
  v_boss_def := COALESCE((v_boss.stats->>'def')::numeric, 140);
  v_boss_spd := COALESCE((v_boss.stats->>'speed')::numeric, 110);
  v_boss_crit := COALESCE((v_boss.stats->>'crit_rate')::numeric, 15);
  v_boss_crit_dmg := COALESCE((v_boss.stats->>'crit_dmg')::numeric, 160);
  v_boss_shield := COALESCE((v_boss.stats->>'shield')::numeric, 300);
  v_boss_heal := COALESCE((v_boss.stats->>'heal')::numeric, 150);
  v_boss_revives := COALESCE((v_boss.stats->>'revive_count')::integer, 0);

  -- Initial Log
  v_log := v_log || jsonb_build_array(jsonb_build_object(
    'turn', 0,
    'phase', 'START',
    'player_hp', v_player_current_hp,
    'boss_hp', v_boss_current_hp,
    'message', '⚔️ بدأت المواجهة الأسطورية ضد ' || v_boss.name || ' (' || v_boss.difficulty || ') بتشكيلة مكونة من ' || v_player_card_count || ' بطاقات!'
  ));

  -- Battle Loop: Max 20 turns
  WHILE v_turn < 20 AND v_player_current_hp > 0 AND v_boss_current_hp > 0 LOOP
    v_turn := v_turn + 1;

    -- PLAYER TURN
    v_is_crit := (random() * 100) < v_player_team_crit;
    v_dmg := GREATEST(80, ROUND((v_player_team_atk * (0.85 + (random() * 0.3))) - (v_boss_def * 0.4)));
    IF v_is_crit THEN
      v_dmg := ROUND(v_dmg * (v_player_team_crit_dmg / 100.0));
    END IF;

    v_boss_current_hp := GREATEST(0, v_boss_current_hp - v_dmg);

    v_log := v_log || jsonb_build_array(jsonb_build_object(
      'turn', v_turn,
      'actor', 'player',
      'damage', v_dmg,
      'is_crit', v_is_crit,
      'player_hp', v_player_current_hp,
      'boss_hp', v_boss_current_hp,
      'message', '💥 الجولة ' || v_turn || ': وجهت تشكيلتك هجوماً ساحقاً ألحق ' || v_dmg || ' ضرراً بالزعيم!' || CASE WHEN v_is_crit THEN ' [ضربة حرجة! CRIT]' ELSE '' END
    ));

    -- Check Boss Defeat
    IF v_boss_current_hp <= 0 THEN
      IF v_boss_revives > 0 THEN
        v_boss_revives := v_boss_revives - 1;
        v_boss_current_hp := ROUND(v_boss_max_hp * 0.35);
        v_log := v_log || jsonb_build_array(jsonb_build_object(
          'turn', v_turn,
          'actor', 'boss_revive',
          'player_hp', v_player_current_hp,
          'boss_hp', v_boss_current_hp,
          'message', '🔥 نهض الزعيم مجدداً بفضل طاقة الهاوية واستعاد ' || v_boss_current_hp || ' نقطة حياة!'
        ));
      ELSE
        v_is_victory := true;
        EXIT;
      END IF;
    END IF;

    -- BOSS TURN (Controlled by AI Level)
    IF v_boss.ai_level = 'Mastermind' AND v_boss_current_hp < (v_boss_max_hp * 0.3) AND v_boss_heal > 0 THEN
      -- Mastermind heals and activates shield
      v_boss_current_hp := LEAST(v_boss_max_hp, v_boss_current_hp + v_boss_heal);
      v_log := v_log || jsonb_build_array(jsonb_build_object(
        'turn', v_turn,
        'actor', 'boss_skill',
        'player_hp', v_player_current_hp,
        'boss_hp', v_boss_current_hp,
        'message', '🛡️ استدعى الزعيم بذكائه درع الهاوية وتجدد صحته بمقدار +' || v_boss_heal || ' HP!'
      ));
    END IF;

    v_is_crit := (random() * 100) < v_boss_crit;
    v_boss_dmg := GREATEST(60, ROUND((v_boss_atk * (0.85 + (random() * 0.3))) - (v_player_team_def * 0.35)));
    IF v_is_crit THEN
      v_boss_dmg := ROUND(v_boss_dmg * (v_boss_crit_dmg / 100.0));
    END IF;

    v_player_current_hp := GREATEST(0, v_player_current_hp - v_boss_dmg);

    v_log := v_log || jsonb_build_array(jsonb_build_object(
      'turn', v_turn,
      'actor', 'boss',
      'damage', v_boss_dmg,
      'is_crit', v_is_crit,
      'player_hp', v_player_current_hp,
      'boss_hp', v_boss_current_hp,
      'message', '⚡ شن ' || v_boss.name || ' ضربة رنين مضادة وألحق ' || v_boss_dmg || ' ضرراً بفريقك!'
    ));

    IF v_player_current_hp <= 0 THEN
      v_is_victory := false;
      EXIT;
    END IF;
  END LOOP;

  -- Increment Boss Attempts
  UPDATE public.bosses
  SET total_attempts = total_attempts + 1
  WHERE id = p_boss_id;

  -- Victory Processing
  IF v_is_victory THEN
    UPDATE public.bosses
    SET total_defeats = total_defeats + 1
    WHERE id = p_boss_id;

    -- Points reward
    v_reward_points := COALESCE((v_boss.rewards->>'points')::numeric, 500);

    -- Check First Blood
    IF v_boss.first_defeat_player_id IS NULL THEN
      v_first_blood := true;
      UPDATE public.bosses
      SET first_defeat_player_id = p_player_id,
          first_defeat_at = now()
      WHERE id = p_boss_id;
    END IF;

    -- Check if first victory for this player
    IF NOT EXISTS (SELECT 1 FROM public.boss_first_victories WHERE boss_id = p_boss_id AND player_id = p_player_id) THEN
      v_first_victory := true;
      INSERT INTO public.boss_first_victories (boss_id, player_id) VALUES (p_boss_id, p_player_id);
    END IF;

    -- Award points
    IF v_reward_points > 0 THEN
      UPDATE public.players
      SET balance = balance + v_reward_points,
          total_winnings = total_winnings + v_reward_points,
          updated_at = now()
      WHERE id = p_player_id;

      INSERT INTO public.transactions (
        player_id, transaction_type, amount, balance_before, balance_after, description, created_at
      ) VALUES (
        p_player_id, 'win_reward'::transaction_type, v_reward_points,
        v_player.balance, v_player.balance + v_reward_points,
        'مكافأة هزيمة الزعيم الأسطوري: ' || v_boss.name, now()
      );
    END IF;

    -- Drop Exclusive Card if configured
    IF (v_boss.rewards->>'exclusive_card_id') IS NOT NULL AND v_first_victory THEN
      BEGIN
        v_exclusive_card_id := (v_boss.rewards->>'exclusive_card_id')::uuid;
        SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_new_serial FROM public.player_cards WHERE card_id = v_exclusive_card_id;

        INSERT INTO public.player_cards (
          player_id, card_id, serial_number, status, obtained_via, obtained_at, evolution_level
        ) VALUES (
          p_player_id, v_exclusive_card_id, v_new_serial, 'owned', 'boss_drop', now(), 1
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;

    -- Drop Exclusive Title if configured
    IF (v_boss.rewards->>'exclusive_title_id') IS NOT NULL AND v_first_victory THEN
      BEGIN
        v_exclusive_title_id := (v_boss.rewards->>'exclusive_title_id')::uuid;
        INSERT INTO public.player_titles (player_id, title_id, obtained_via)
        VALUES (p_player_id, v_exclusive_title_id, 'boss_victory')
        ON CONFLICT (player_id, title_id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;

    v_rewards_granted := jsonb_build_object(
      'points', v_reward_points,
      'first_blood', v_first_blood,
      'first_victory', v_first_victory,
      'exclusive_card_id', v_exclusive_card_id,
      'exclusive_title_id', v_exclusive_title_id
    );

    v_log := v_log || jsonb_build_array(jsonb_build_object(
      'turn', v_turn,
      'phase', 'VICTORY',
      'message', '👑 انتصار مجيد! تم سحق الزعيم ' || v_boss.name || ' وحصلت على ' || v_reward_points || ' نقطة!'
    ));
  ELSE
    v_log := v_log || jsonb_build_array(jsonb_build_object(
      'turn', v_turn,
      'phase', 'DEFEAT',
      'message', '💀 سقطت تشكيلتك أمام جبروت ' || v_boss.name || '. طوّر بطاقاتك وحاول مجدداً!'
    ));
  END IF;

  -- Record Boss Battle Log
  INSERT INTO public.boss_battle_logs (
    boss_id, player_id, player_deck, boss_deck, is_victory,
    turns_count, damage_dealt, damage_taken, rewards_granted, combat_log
  ) VALUES (
    p_boss_id, p_player_id, v_player_deck_info, v_boss.deck, v_is_victory,
    v_turn, v_boss_max_hp - v_boss_current_hp, v_player_total_hp - v_player_current_hp,
    v_rewards_granted, v_log
  );

  RETURN jsonb_build_object(
    'success', true,
    'is_victory', v_is_victory,
    'turns', v_turn,
    'player_final_hp', v_player_current_hp,
    'player_max_hp', v_player_total_hp,
    'boss_final_hp', v_boss_current_hp,
    'boss_max_hp', v_boss_max_hp,
    'rewards', v_rewards_granted,
    'log', v_log
  );
END;
$function$;

-- ------------------------------------------------------------
-- 10. PROFILE CUSTOMIZATION RPC FUNCTIONS (Section 6 & 7)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.equip_player_title(
  p_player_id uuid,
  p_title_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF p_title_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.player_titles WHERE player_id = p_player_id AND title_id = p_title_id) THEN
      RETURN jsonb_build_object('success', false, 'message', 'أنت لا تمتلك هذا اللقب بعد');
    END IF;
  END IF;

  -- Reset equipped state
  UPDATE public.player_titles SET is_equipped = false WHERE player_id = p_player_id;
  IF p_title_id IS NOT NULL THEN
    UPDATE public.player_titles SET is_equipped = true WHERE player_id = p_player_id AND title_id = p_title_id;
  END IF;

  UPDATE public.players SET equipped_title_id = p_title_id WHERE id = p_player_id;

  RETURN jsonb_build_object('success', true, 'message', 'تم تجهيز اللقب بنجاح ✨');
END;
$function$;

CREATE OR REPLACE FUNCTION public.equip_player_cosmetic(
  p_player_id uuid,
  p_type text,
  p_cosmetic_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF p_cosmetic_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.player_cosmetics WHERE player_id = p_player_id AND cosmetic_id = p_cosmetic_id) THEN
      RETURN jsonb_build_object('success', false, 'message', 'أنت لا تمتلك هذا العنصر التجميلي بعد');
    END IF;
  END IF;

  IF p_type = 'frame' THEN
    UPDATE public.players SET avatar_frame_id = p_cosmetic_id WHERE id = p_player_id;
  ELSIF p_type = 'background' THEN
    UPDATE public.players SET profile_bg_id = p_cosmetic_id WHERE id = p_player_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'تم تحديث مظهر الملف الشخصي بنجاح 🎨');
END;
$function$;
