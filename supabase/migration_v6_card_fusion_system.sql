-- ============================================================
-- Migration V6: Comprehensive Card Fusion (دمج البطاقات المكررة)
-- Project: WuWa Betting
-- ============================================================

-- 1. Ensure fusion_level column exists on player_cards
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'player_cards' AND column_name = 'fusion_level'
  ) THEN
    ALTER TABLE public.player_cards ADD COLUMN fusion_level INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Create card_fusions_log table for audit trail
CREATE TABLE IF NOT EXISTS public.card_fusions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  base_player_card_id UUID NOT NULL REFERENCES public.player_cards(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  copies_consumed INTEGER NOT NULL,
  consumed_card_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  consumed_serials JSONB NOT NULL DEFAULT '[]'::jsonb,
  previous_fusion_level INTEGER NOT NULL,
  new_fusion_level INTEGER NOT NULL,
  stats_before JSONB NOT NULL DEFAULT '{}'::jsonb,
  stats_after JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.card_fusions_log ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for card_fusions_log & game_settings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'game_settings' AND policyname = 'Anyone can view game settings'
  ) THEN
    CREATE POLICY "Anyone can view game settings" ON public.game_settings FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'card_fusions_log' AND policyname = 'Anyone can view fusion logs'
  ) THEN
    CREATE POLICY "Anyone can view fusion logs" ON public.card_fusions_log FOR SELECT USING (true);
  END IF;
END $$;

-- 4. Default game settings for Card Fusion
INSERT INTO public.game_settings (category, key, value, description)
VALUES 
  ('fusion', 'enabled', 'true'::jsonb, 'تفعيل نظام دمج البطاقات المكررة'),
  ('fusion', 'max_level', '5'::jsonb, 'الحد الأقصى لمستوى الدمج'),
  ('fusion', 'copies_level_1', '1'::jsonb, 'النسخ المطلوبة للوصول إلى مستوى دمج 1'),
  ('fusion', 'copies_level_2', '1'::jsonb, 'النسخ المطلوبة للوصول إلى مستوى دمج 2'),
  ('fusion', 'copies_level_3', '2'::jsonb, 'النسخ المطلوبة للوصول إلى مستوى دمج 3'),
  ('fusion', 'copies_level_4', '2'::jsonb, 'النسخ المطلوبة للوصول إلى مستوى دمج 4'),
  ('fusion', 'copies_level_5', '3'::jsonb, 'النسخ المطلوبة للوصول إلى مستوى دمج 5'),
  ('fusion', 'bonus_hp_percent', '8'::jsonb, 'نسبة زيادة نقاط الصحة HP لكل مستوى دمج'),
  ('fusion', 'bonus_atk_percent', '7'::jsonb, 'نسبة زيادة الهجوم ATK لكل مستوى دمج'),
  ('fusion', 'bonus_def_percent', '6'::jsonb, 'نسبة زيادة الدفاع DEF لكل مستوى دمج'),
  ('fusion', 'bonus_speed', '2'::jsonb, 'زيادة السرعة Speed لكل مستوى دمج'),
  ('fusion', 'bonus_crit_rate', '1'::jsonb, 'زيادة فرصة الضربة الحرجة Crit Rate لكل مستوى دمج'),
  ('fusion', 'bonus_shield_heal_percent', '5'::jsonb, 'نسبة زيادة الشفاء والدروع لكل مستوى دمج'),
  ('fusion', 'allowed_rarities', '["common", "rare", "epic", "legendary", "mythic"]'::jsonb, 'الندرات المسموح بدمجها')
ON CONFLICT (category, key) DO UPDATE 
SET description = EXCLUDED.description;

-- 5. RPC function: get_player_fusible_cards
CREATE OR REPLACE FUNCTION public.get_player_fusible_cards(p_player_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(item) INTO v_result
  FROM (
    SELECT 
      c.id AS card_id,
      c.name,
      c.title,
      c.subtitle,
      c.element,
      c.rarity,
      c.image_path,
      c.stats,
      c.skills,
      count(pc.id) AS copy_count,
      max(COALESCE(pc.fusion_level, 0)) AS max_fusion_level,
      jsonb_agg(
        jsonb_build_object(
          'id', pc.id,
          'serial_number', pc.serial_number,
          'evolution_level', COALESCE(pc.evolution_level, 1),
          'fusion_level', COALESCE(pc.fusion_level, 0),
          'obtained_at', pc.obtained_at,
          'is_favorite', pc.is_favorite
        ) ORDER BY COALESCE(pc.fusion_level, 0) DESC, COALESCE(pc.evolution_level, 1) DESC, pc.serial_number ASC
      ) AS copies
    FROM public.player_cards pc
    JOIN public.cards c ON c.id = pc.card_id
    WHERE pc.player_id = p_player_id
      AND pc.status = 'owned'
      AND pc.id NOT IN (SELECT player_card_id FROM public.market_listings WHERE status = 'active')
    GROUP BY c.id
    HAVING count(pc.id) >= 2
    ORDER BY count(pc.id) DESC, c.name ASC
  ) item;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 6. RPC function: get_player_fusion_history
CREATE OR REPLACE FUNCTION public.get_player_fusion_history(p_player_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(item) INTO v_result
  FROM (
    SELECT 
      l.id,
      l.player_id,
      l.base_player_card_id,
      l.card_id,
      l.copies_consumed,
      l.consumed_card_ids,
      l.consumed_serials,
      l.previous_fusion_level,
      l.new_fusion_level,
      l.stats_before,
      l.stats_after,
      l.created_at,
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'title', c.title,
        'element', c.element,
        'rarity', c.rarity,
        'image_path', c.image_path
      ) AS card
    FROM public.card_fusions_log l
    LEFT JOIN public.cards c ON c.id = l.card_id
    WHERE l.player_id = p_player_id
    ORDER BY l.created_at DESC
    LIMIT 50
  ) item;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 7. Main Atomic Fusion Engine: execute_card_fusion
CREATE OR REPLACE FUNCTION public.execute_card_fusion(
  p_player_id UUID,
  p_base_player_card_id UUID,
  p_consumed_player_card_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player RECORD;
  v_base_pcard RECORD;
  v_base_card RECORD;
  v_fusion_enabled BOOLEAN := true;
  v_max_level INTEGER := 5;
  v_current_fusion_lvl INTEGER := 0;
  v_target_fusion_lvl INTEGER := 0;
  v_copies_consumed INTEGER := 0;
  v_distinct_consumed INTEGER := 0;
  v_valid_consumed_ids UUID[];
  v_valid_consumed_serials INTEGER[];
  v_fav_serial INTEGER;
  v_setting_val JSONB;
  
  v_copies_req INTEGER[] := ARRAY[1, 1, 2, 2, 3];
  v_copies_accum INTEGER := 0;
  v_level_idx INTEGER;
  v_copies_needed_for_level INTEGER;
  v_default_copies INTEGER;
  
  v_hp_pct NUMERIC := 8;
  v_atk_pct NUMERIC := 7;
  v_def_pct NUMERIC := 6;
  v_spd_bonus NUMERIC := 2;
  v_crit_bonus NUMERIC := 1;
  v_shield_heal_pct NUMERIC := 5;
  v_allowed_rarities JSONB;
  
  v_stats_before JSONB;
  v_stats_after JSONB;
  v_base_hp NUMERIC;
  v_base_atk NUMERIC;
  v_base_def NUMERIC;
  v_base_spd NUMERIC;
  v_base_crit NUMERIC;
  v_base_shield NUMERIC;
  v_base_heal NUMERIC;
  
  v_evo_lvl INTEGER;
  v_evo_hp_scale NUMERIC;
  v_evo_atk_scale NUMERIC;
  v_evo_def_scale NUMERIC;
BEGIN
  -- 1. Validate Player
  SELECT * INTO v_player FROM public.players WHERE id = p_player_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'اللاعب غير موجود');
  END IF;

  IF v_player.account_status = 'banned' THEN
    RETURN jsonb_build_object('success', false, 'message', 'حسابك محظور من تنفيذ هذه العملية');
  END IF;

  -- 2. Check Settings
  SELECT value INTO v_setting_val FROM public.game_settings WHERE category = 'fusion' AND key = 'enabled';
  IF v_setting_val IS NOT NULL THEN
    v_fusion_enabled := (v_setting_val)::text = 'true';
  END IF;

  IF NOT v_fusion_enabled THEN
    RETURN jsonb_build_object('success', false, 'message', 'نظام دمج البطاقات معطل حاليًا بأمر الإدارة');
  END IF;

  SELECT value INTO v_setting_val FROM public.game_settings WHERE category = 'fusion' AND key = 'max_level';
  IF v_setting_val IS NOT NULL THEN
    v_max_level := (v_setting_val)::text::integer;
  END IF;

  SELECT value INTO v_allowed_rarities FROM public.game_settings WHERE category = 'fusion' AND key = 'allowed_rarities';

  SELECT value INTO v_setting_val FROM public.game_settings WHERE category = 'fusion' AND key = 'bonus_hp_percent';
  IF v_setting_val IS NOT NULL THEN v_hp_pct := (v_setting_val)::text::numeric; END IF;
  SELECT value INTO v_setting_val FROM public.game_settings WHERE category = 'fusion' AND key = 'bonus_atk_percent';
  IF v_setting_val IS NOT NULL THEN v_atk_pct := (v_setting_val)::text::numeric; END IF;
  SELECT value INTO v_setting_val FROM public.game_settings WHERE category = 'fusion' AND key = 'bonus_def_percent';
  IF v_setting_val IS NOT NULL THEN v_def_pct := (v_setting_val)::text::numeric; END IF;
  SELECT value INTO v_setting_val FROM public.game_settings WHERE category = 'fusion' AND key = 'bonus_speed';
  IF v_setting_val IS NOT NULL THEN v_spd_bonus := (v_setting_val)::text::numeric; END IF;
  SELECT value INTO v_setting_val FROM public.game_settings WHERE category = 'fusion' AND key = 'bonus_crit_rate';
  IF v_setting_val IS NOT NULL THEN v_crit_bonus := (v_setting_val)::text::numeric; END IF;
  SELECT value INTO v_setting_val FROM public.game_settings WHERE category = 'fusion' AND key = 'bonus_shield_heal_percent';
  IF v_setting_val IS NOT NULL THEN v_shield_heal_pct := (v_setting_val)::text::numeric; END IF;

  -- 3. Validate Base Card
  SELECT * INTO v_base_pcard FROM public.player_cards 
  WHERE id = p_base_player_card_id AND player_id = p_player_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'البطاقة الأساسية غير موجودة أو لا تنتمي إلى حسابك');
  END IF;

  IF v_base_pcard.status != 'owned' THEN
    RETURN jsonb_build_object('success', false, 'message', 'لا يمكن دمج بطاقة معروضة للبيع أو محجوزة');
  END IF;

  IF EXISTS (SELECT 1 FROM public.market_listings WHERE player_card_id = p_base_player_card_id AND status = 'active') THEN
    RETURN jsonb_build_object('success', false, 'message', 'البطاقة الأساسية معروضة للبيع في السوق حاليًا');
  END IF;

  -- Check if base card is in active PvP challenge
  IF EXISTS (
    SELECT 1 FROM public.pvp_challenges 
    WHERE status IN ('pending', 'accepted') 
      AND (challenger_card_id = p_base_player_card_id OR challenged_card_id = p_base_player_card_id)
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'البطاقة الأساسية مستخدمة في تحدي مبارزة قائم حالياً');
  END IF;

  SELECT * INTO v_base_card FROM public.cards WHERE id = v_base_pcard.card_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'بيانات البطاقة غير متوفرة في النظام');
  END IF;

  IF v_allowed_rarities IS NOT NULL AND jsonb_typeof(v_allowed_rarities) = 'array' THEN
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_allowed_rarities) elem WHERE elem = v_base_card.rarity::text) THEN
      RETURN jsonb_build_object('success', false, 'message', 'ندرة هذه البطاقة غير مسموح بدمجها حاليًا وفق إعدادات اللعبة');
    END IF;
  END IF;

  v_current_fusion_lvl := COALESCE(v_base_pcard.fusion_level, 0);
  IF v_current_fusion_lvl >= v_max_level THEN
    RETURN jsonb_build_object('success', false, 'message', 'وصلت هذه البطاقة إلى الحد الأقصى لمستوى الدمج (Lv.' || v_max_level || ')');
  END IF;

  -- 4. Validate Consumed Cards Array
  IF p_consumed_player_card_ids IS NULL OR cardinality(p_consumed_player_card_ids) = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'يجب تحديد بطاقة مكررة واحدة على الأقل للاستهلاك');
  END IF;

  IF p_base_player_card_id = ANY(p_consumed_player_card_ids) THEN
    RETURN jsonb_build_object('success', false, 'message', 'لا يمكن استخدام البطاقة الأساسية كنسخة مستهلكة!');
  END IF;

  SELECT count(DISTINCT x) INTO v_distinct_consumed FROM unnest(p_consumed_player_card_ids) x;
  IF cardinality(p_consumed_player_card_ids) != v_distinct_consumed THEN
    RETURN jsonb_build_object('success', false, 'message', 'قائمة النسخ المستهلكة تحتوي على معرّفات مكررة');
  END IF;

  -- Check if any consumed card is in active PvP
  IF EXISTS (
    SELECT 1 FROM public.pvp_challenges 
    WHERE status IN ('pending', 'accepted') 
      AND (challenger_card_id = ANY(p_consumed_player_card_ids) OR challenged_card_id = ANY(p_consumed_player_card_ids))
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'إحدى النسخ المحددة مستخدمة حاليًا في مبارزة جارية!');
  END IF;

  -- 5. Fetch and Lock Consumed Cards
  SELECT 
    array_agg(id),
    array_agg(serial_number),
    count(*)
  INTO 
    v_valid_consumed_ids,
    v_valid_consumed_serials,
    v_copies_consumed
  FROM (
    SELECT id, serial_number
    FROM public.player_cards
    WHERE id = ANY(p_consumed_player_card_ids)
      AND player_id = p_player_id
      AND card_id = v_base_pcard.card_id
      AND status = 'owned'
      AND id NOT IN (SELECT player_card_id FROM public.market_listings WHERE status = 'active')
    FOR UPDATE
  ) locked_cards;

  IF v_copies_consumed IS NULL OR v_copies_consumed != cardinality(p_consumed_player_card_ids) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'إحدى النسخ المحددة غير صالحة، أو غير مملوكة لك، أو معروضة للبيع بالسوق، أو ليست من نفس نوع البطاقة!'
    );
  END IF;

  -- Check if any consumed card is marked as protected (is_favorite)
  SELECT serial_number INTO v_fav_serial
  FROM public.player_cards
  WHERE id = ANY(v_valid_consumed_ids) AND is_favorite = true
  LIMIT 1;

  IF v_fav_serial IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'النسخة رقم #' || v_fav_serial || ' محمية كمفضلة! يرجى إلغاء تمييزها كمفضلة أولاً قبل استهلاكها في الدمج.'
    );
  END IF;

  -- 6. Read copies requirements per level
  FOR v_level_idx IN 1..5 LOOP
    v_default_copies := v_copies_req[v_level_idx];
    SELECT COALESCE(value::text::integer, v_default_copies) INTO v_copies_needed_for_level 
    FROM public.game_settings 
    WHERE category = 'fusion' AND key = 'copies_level_' || v_level_idx;
    
    IF v_copies_needed_for_level IS NOT NULL THEN
      v_copies_req[v_level_idx] := v_copies_needed_for_level;
    END IF;
  END LOOP;

  v_target_fusion_lvl := v_current_fusion_lvl;
  v_copies_accum := 0;

  FOR v_level_idx IN (v_current_fusion_lvl + 1)..v_max_level LOOP
    v_copies_needed_for_level := v_copies_req[v_level_idx];
    IF (v_copies_consumed - v_copies_accum) >= v_copies_needed_for_level THEN
      v_copies_accum := v_copies_accum + v_copies_needed_for_level;
      v_target_fusion_lvl := v_level_idx;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  IF v_target_fusion_lvl = v_current_fusion_lvl THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'عدد النسخ المحددة (' || v_copies_consumed || ') غير كافٍ للوصول إلى المستوى القادم.'
    );
  END IF;

  IF v_copies_accum != v_copies_consumed THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'عدد النسخ المستهلكة (' || v_copies_consumed || ') لا يتطابق بدقة مع متطلبات المستوى المستهدف (' || v_copies_accum || ' نسخ). يرجى تحديد ' || v_copies_accum || ' نسخ لتفادي هدر البطاقات الإضافية.'
    );
  END IF;

  -- 7. Compute Stats Before & After
  v_evo_lvl := COALESCE(v_base_pcard.evolution_level, 1);
  v_evo_hp_scale := 1.0 + ((v_evo_lvl - 1) * 0.15);
  v_evo_atk_scale := 1.0 + ((v_evo_lvl - 1) * 0.12);
  v_evo_def_scale := 1.0 + ((v_evo_lvl - 1) * 0.10);

  v_base_hp := COALESCE((v_base_card.stats->>'hp')::numeric, 1200);
  v_base_atk := COALESCE((v_base_card.stats->>'atk')::numeric, 180);
  v_base_def := COALESCE((v_base_card.stats->>'def')::numeric, 90);
  v_base_spd := COALESCE((v_base_card.stats->>'speed')::numeric, 100);
  v_base_crit := COALESCE((v_base_card.stats->>'crit_rate')::numeric, 15);
  v_base_shield := COALESCE((v_base_card.stats->>'shield')::numeric, 0);
  v_base_heal := COALESCE((v_base_card.stats->>'heal')::numeric, 0);

  v_stats_before := jsonb_build_object(
    'hp', ROUND(v_base_hp * v_evo_hp_scale * (1.0 + (v_current_fusion_lvl * (v_hp_pct / 100.0)))),
    'atk', ROUND(v_base_atk * v_evo_atk_scale * (1.0 + (v_current_fusion_lvl * (v_atk_pct / 100.0)))),
    'def', ROUND(v_base_def * v_evo_def_scale * (1.0 + (v_current_fusion_lvl * (v_def_pct / 100.0)))),
    'speed', ROUND(v_base_spd + (v_current_fusion_lvl * v_spd_bonus)),
    'crit_rate', LEAST(50::numeric, ROUND(v_base_crit + (v_current_fusion_lvl * v_crit_bonus))),
    'shield', ROUND(v_base_shield * (1.0 + (v_current_fusion_lvl * (v_shield_heal_pct / 100.0)))),
    'heal', ROUND(v_base_heal * (1.0 + (v_current_fusion_lvl * (v_shield_heal_pct / 100.0))))
  );

  v_stats_after := jsonb_build_object(
    'hp', ROUND(v_base_hp * v_evo_hp_scale * (1.0 + (v_target_fusion_lvl * (v_hp_pct / 100.0)))),
    'atk', ROUND(v_base_atk * v_evo_atk_scale * (1.0 + (v_target_fusion_lvl * (v_atk_pct / 100.0)))),
    'def', ROUND(v_base_def * v_evo_def_scale * (1.0 + (v_target_fusion_lvl * (v_def_pct / 100.0)))),
    'speed', ROUND(v_base_spd + (v_target_fusion_lvl * v_spd_bonus)),
    'crit_rate', LEAST(50::numeric, ROUND(v_base_crit + (v_target_fusion_lvl * v_crit_bonus))),
    'shield', ROUND(v_base_shield * (1.0 + (v_target_fusion_lvl * (v_shield_heal_pct / 100.0)))),
    'heal', ROUND(v_base_heal * (1.0 + (v_target_fusion_lvl * (v_shield_heal_pct / 100.0))))
  );

  -- 8. Atomic Execution: Update status of consumed cards to 'consumed_fusion'
  UPDATE public.player_cards 
  SET status = 'consumed_fusion' 
  WHERE id = ANY(v_valid_consumed_ids);

  -- Upgrade base card fusion level
  UPDATE public.player_cards 
  SET fusion_level = v_target_fusion_lvl
  WHERE id = p_base_player_card_id;

  -- 9. Insert Fusion Audit Log
  INSERT INTO public.card_fusions_log (
    player_id,
    base_player_card_id,
    card_id,
    copies_consumed,
    consumed_card_ids,
    consumed_serials,
    previous_fusion_level,
    new_fusion_level,
    stats_before,
    stats_after,
    created_at
  ) VALUES (
    p_player_id,
    p_base_player_card_id,
    v_base_pcard.card_id,
    v_copies_consumed,
    to_jsonb(v_valid_consumed_ids),
    to_jsonb(v_valid_consumed_serials),
    v_current_fusion_lvl,
    v_target_fusion_lvl,
    v_stats_before,
    v_stats_after,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم دمج ' || v_copies_consumed || ' نسخ بنجاح! ارتقت البطاقة إلى مستوى دمج Lv.' || v_target_fusion_lvl || ' 🌟',
    'base_card_id', p_base_player_card_id,
    'previous_fusion_level', v_current_fusion_lvl,
    'new_fusion_level', v_target_fusion_lvl,
    'copies_consumed', v_copies_consumed,
    'stats_before', v_stats_before,
    'stats_after', v_stats_after
  );
END;
$$;
