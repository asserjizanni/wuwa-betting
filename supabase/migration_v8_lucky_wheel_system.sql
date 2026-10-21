-- ============================================================
-- Migration V8: Lucky Wheel (عجلة الحظ) System
-- Complete database schema, RPC functions, security policies & defaults
-- ============================================================

-- 1. Ensure transaction_type enum has 'lucky_wheel_reward'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ
    JOIN pg_enum enm ON typ.oid = enm.enumtypid
    WHERE typ.typname = 'transaction_type' AND enm.enumlabel = 'lucky_wheel_reward'
  ) THEN
    ALTER TYPE transaction_type ADD VALUE 'lucky_wheel_reward';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore if cannot alter enum outside transaction block
END $$;

-- 2. Lucky Wheel Settings Table
CREATE TABLE IF NOT EXISTS public.lucky_wheel_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  spins_per_period INTEGER NOT NULL DEFAULT 1 CHECK (spins_per_period >= 0),
  period_type TEXT NOT NULL DEFAULT 'daily' CHECK (period_type IN ('daily', 'hours_12', 'weekly', 'custom_hours')),
  period_hours INTEGER NOT NULL DEFAULT 24 CHECK (period_hours > 0),
  rollover_unused BOOLEAN NOT NULL DEFAULT false,
  max_accumulated_spins INTEGER NOT NULL DEFAULT 10 CHECK (max_accumulated_spins >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row if missing
INSERT INTO public.lucky_wheel_settings (id, is_enabled, spins_per_period, period_type, period_hours, rollover_unused, max_accumulated_spins)
VALUES ('default', true, 1, 'daily', 24, false, 10)
ON CONFLICT (id) DO NOTHING;

-- 3. Lucky Wheel Prizes Table
CREATE TABLE IF NOT EXISTS public.lucky_wheel_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('dollars', 'card', 'title', 'custom')),
  prize_value NUMERIC NOT NULL DEFAULT 0,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  card_copies INTEGER NOT NULL DEFAULT 1 CHECK (card_copies >= 1),
  title_id UUID REFERENCES public.titles(id) ON DELETE SET NULL,
  title_duplicate_reward_dollars NUMERIC NOT NULL DEFAULT 250 CHECK (title_duplicate_reward_dollars >= 0),
  image_url TEXT,
  icon_name TEXT,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  weight NUMERIC NOT NULL DEFAULT 10 CHECK (weight > 0),
  probability_pct NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_rare BOOLEAN NOT NULL DEFAULT false,
  is_legendary BOOLEAN NOT NULL DEFAULT false,
  max_wins_per_player INTEGER DEFAULT NULL,
  guaranteed_pity_spins INTEGER DEFAULT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active prizes
CREATE INDEX IF NOT EXISTS idx_lucky_wheel_prizes_active ON public.lucky_wheel_prizes(is_active, display_order);

-- 4. Player Lucky Wheel Attempts Table
CREATE TABLE IF NOT EXISTS public.player_lucky_wheel_attempts (
  player_id UUID PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  extra_spins INTEGER NOT NULL DEFAULT 0 CHECK (extra_spins >= 0),
  spins_used_in_period INTEGER NOT NULL DEFAULT 0 CHECK (spins_used_in_period >= 0),
  period_start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_spin_at TIMESTAMPTZ,
  total_spins_all_time INTEGER NOT NULL DEFAULT 0 CHECK (total_spins_all_time >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_wheel_attempts_player ON public.player_lucky_wheel_attempts(player_id);

-- 5. Lucky Wheel Spins History Table
CREATE TABLE IF NOT EXISTS public.lucky_wheel_spins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES public.lucky_wheel_prizes(id) ON DELETE SET NULL,
  prize_name TEXT NOT NULL,
  prize_type TEXT NOT NULL,
  prize_value NUMERIC NOT NULL DEFAULT 0,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  title_id UUID REFERENCES public.titles(id) ON DELETE SET NULL,
  reward_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_reason TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lucky_wheel_spins_player ON public.lucky_wheel_spins(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lucky_wheel_spins_created ON public.lucky_wheel_spins(created_at DESC);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.lucky_wheel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_wheel_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_lucky_wheel_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_wheel_spins ENABLE ROW LEVEL SECURITY;

-- Policies:
DROP POLICY IF EXISTS "Anyone can read lucky wheel settings" ON public.lucky_wheel_settings;
CREATE POLICY "Anyone can read lucky wheel settings" ON public.lucky_wheel_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update lucky wheel settings" ON public.lucky_wheel_settings;
CREATE POLICY "Admins can update lucky wheel settings" ON public.lucky_wheel_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read lucky wheel prizes" ON public.lucky_wheel_prizes;
CREATE POLICY "Anyone can read lucky wheel prizes" ON public.lucky_wheel_prizes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage lucky wheel prizes" ON public.lucky_wheel_prizes;
CREATE POLICY "Admins can manage lucky wheel prizes" ON public.lucky_wheel_prizes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Players can read own attempts" ON public.player_lucky_wheel_attempts;
CREATE POLICY "Players can read own attempts" ON public.player_lucky_wheel_attempts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and RPC manage player attempts" ON public.player_lucky_wheel_attempts;
CREATE POLICY "Admins and RPC manage player attempts" ON public.player_lucky_wheel_attempts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read wheel history" ON public.lucky_wheel_spins;
CREATE POLICY "Anyone can read wheel history" ON public.lucky_wheel_spins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and RPC insert wheel history" ON public.lucky_wheel_spins;
CREATE POLICY "Admins and RPC insert wheel history" ON public.lucky_wheel_spins FOR ALL USING (true) WITH CHECK (true);

-- 7. FUNCTION: Get player wheel status & cooldown
CREATE OR REPLACE FUNCTION public.get_player_lucky_wheel_status(p_player_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_attempt RECORD;
  v_period_interval INTERVAL;
  v_period_end TIMESTAMPTZ;
  v_spins_left INT;
  v_now TIMESTAMPTZ := NOW();
  v_last_prize RECORD;
  v_active_prizes JSONB;
BEGIN
  -- 1. Fetch settings
  SELECT * INTO v_settings FROM public.lucky_wheel_settings WHERE id = 'default' LIMIT 1;
  IF NOT FOUND THEN
    v_settings.is_enabled := true;
    v_settings.spins_per_period := 1;
    v_settings.period_hours := 24;
    v_settings.rollover_unused := false;
  END IF;

  v_period_interval := (v_settings.period_hours || ' hours')::INTERVAL;

  -- 2. Fetch or create player attempt record
  SELECT * INTO v_attempt FROM public.player_lucky_wheel_attempts WHERE player_id = p_player_id;
  IF NOT FOUND THEN
    INSERT INTO public.player_lucky_wheel_attempts (player_id, extra_spins, spins_used_in_period, period_start_at, total_spins_all_time)
    VALUES (p_player_id, 0, 0, v_now, 0)
    RETURNING * INTO v_attempt;
  END IF;

  -- 3. Check if current period has expired
  v_period_end := v_attempt.period_start_at + v_period_interval;
  IF v_now >= v_period_end THEN
    -- Period expired, reset period
    UPDATE public.player_lucky_wheel_attempts
    SET spins_used_in_period = 0,
        period_start_at = v_now,
        updated_at = v_now
    WHERE player_id = p_player_id
    RETURNING * INTO v_attempt;

    v_period_end := v_now + v_period_interval;
  END IF;

  -- 4. Calculate spins left
  v_spins_left := GREATEST(0, v_settings.spins_per_period - v_attempt.spins_used_in_period) + v_attempt.extra_spins;

  -- 5. Fetch last won prize
  SELECT * INTO v_last_prize
  FROM public.lucky_wheel_spins
  WHERE player_id = p_player_id AND status = 'success'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 6. Fetch active prizes for wheel display
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'prize_type', p.prize_type,
      'prize_value', p.prize_value,
      'card_id', p.card_id,
      'card_copies', p.card_copies,
      'title_id', p.title_id,
      'image_url', p.image_url,
      'icon_name', p.icon_name,
      'description', p.description,
      'color', p.color,
      'weight', p.weight,
      'probability_pct', p.probability_pct,
      'is_rare', p.is_rare,
      'is_legendary', p.is_legendary,
      'display_order', p.display_order
    ) ORDER BY p.display_order ASC, p.created_at ASC
  ) INTO v_active_prizes
  FROM public.lucky_wheel_prizes p
  WHERE p.is_active = true;

  RETURN jsonb_build_object(
    'success', true,
    'is_enabled', v_settings.is_enabled,
    'spins_per_period', v_settings.spins_per_period,
    'period_type', v_settings.period_type,
    'period_hours', v_settings.period_hours,
    'spins_used', v_attempt.spins_used_in_period,
    'extra_spins', v_attempt.extra_spins,
    'spins_left', v_spins_left,
    'period_start_at', v_attempt.period_start_at,
    'next_reset_at', v_period_end,
    'last_spin_at', v_attempt.last_spin_at,
    'total_spins_all_time', v_attempt.total_spins_all_time,
    'prizes', COALESCE(v_active_prizes, '[]'::jsonb),
    'last_prize', CASE WHEN v_last_prize.id IS NOT NULL THEN
      jsonb_build_object(
        'id', v_last_prize.id,
        'prize_name', v_last_prize.prize_name,
        'prize_type', v_last_prize.prize_type,
        'prize_value', v_last_prize.prize_value,
        'created_at', v_last_prize.created_at
      ) ELSE NULL END
  );
END;
$$;

-- 8. FUNCTION: Core Atomic Lucky Wheel Spin Execution
CREATE OR REPLACE FUNCTION public.spin_lucky_wheel(
  p_player_id UUID,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_player RECORD;
  v_attempt RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_period_interval INTERVAL;
  v_period_end TIMESTAMPTZ;
  v_spins_left INT;
  
  -- Prize selection
  v_total_weight NUMERIC := 0;
  v_rand_choice NUMERIC;
  v_running_weight NUMERIC := 0;
  v_chosen_prize RECORD;
  v_prize_index INT := 0;
  v_current_idx INT := 0;
  
  -- Reward granting
  v_new_balance NUMERIC;
  v_card RECORD;
  v_next_serial INT;
  v_title RECORD;
  v_already_owns_title BOOLEAN := false;
  v_final_reward_details JSONB := '{}'::jsonb;
  v_transaction_type_label TEXT;
BEGIN
  -- A. Idempotency Check
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    IF EXISTS (SELECT 1 FROM public.lucky_wheel_spins WHERE idempotency_key = p_idempotency_key) THEN
      SELECT * INTO v_chosen_prize FROM public.lucky_wheel_spins WHERE idempotency_key = p_idempotency_key;
      RETURN jsonb_build_object(
        'success', true,
        'idempotent', true,
        'prize', jsonb_build_object(
          'id', v_chosen_prize.prize_id,
          'name', v_chosen_prize.prize_name,
          'prize_type', v_chosen_prize.prize_type,
          'prize_value', v_chosen_prize.prize_value
        ),
        'reward_details', v_chosen_prize.reward_details,
        'message', 'تم استرجاع نتيجة الدوران السابقة'
      );
    END IF;
  END IF;

  -- B. Validate Player
  SELECT * INTO v_player FROM public.players WHERE id = p_player_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'حساب اللاعب غير موجود');
  END IF;

  IF v_player.account_status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'message', 'الحساب موقوف أو محظور');
  END IF;

  -- C. Validate Settings
  SELECT * INTO v_settings FROM public.lucky_wheel_settings WHERE id = 'default';
  IF NOT FOUND THEN
    v_settings.is_enabled := true;
    v_settings.spins_per_period := 1;
    v_settings.period_hours := 24;
  END IF;

  IF NOT v_settings.is_enabled THEN
    RETURN jsonb_build_object('success', false, 'message', 'عجلة الحظ معطلة مؤقتاً بأمر الإدارة');
  END IF;

  -- D. Validate & Update Attempts
  v_period_interval := (v_settings.period_hours || ' hours')::INTERVAL;
  SELECT * INTO v_attempt FROM public.player_lucky_wheel_attempts WHERE player_id = p_player_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.player_lucky_wheel_attempts (player_id, extra_spins, spins_used_in_period, period_start_at, total_spins_all_time)
    VALUES (p_player_id, 0, 0, v_now, 0)
    RETURNING * INTO v_attempt;
  END IF;

  v_period_end := v_attempt.period_start_at + v_period_interval;
  IF v_now >= v_period_end THEN
    v_attempt.spins_used_in_period := 0;
    v_attempt.period_start_at := v_now;
    v_period_end := v_now + v_period_interval;
  END IF;

  v_spins_left := GREATEST(0, v_settings.spins_per_period - v_attempt.spins_used_in_period) + v_attempt.extra_spins;

  IF v_spins_left <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'لا توجد لديك محاولات متبقية حالياً',
      'next_reset_at', v_period_end
    );
  END IF;

  -- E. Gather Active Eligible Prizes
  -- Calculate total weight
  SELECT COALESCE(SUM(weight), 0) INTO v_total_weight
  FROM public.lucky_wheel_prizes
  WHERE is_active = true;

  IF v_total_weight <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'لا توجد جوائز نشطة في عجلة الحظ');
  END IF;

  -- Random selection
  v_rand_choice := random() * v_total_weight;
  v_running_weight := 0;

  FOR v_chosen_prize IN
    SELECT * FROM public.lucky_wheel_prizes
    WHERE is_active = true
    ORDER BY display_order ASC, created_at ASC
  LOOP
    v_running_weight := v_running_weight + v_chosen_prize.weight;
    IF v_rand_choice <= v_running_weight THEN
      v_prize_index := v_current_idx;
      EXIT;
    END IF;
    v_current_idx := v_current_idx + 1;
  END LOOP;

  -- Fallback if rounding leaves choice
  IF v_chosen_prize IS NULL THEN
    SELECT * INTO v_chosen_prize FROM public.lucky_wheel_prizes WHERE is_active = true ORDER BY display_order ASC LIMIT 1;
    v_prize_index := 0;
  END IF;

  -- F. Distribute Prize Atomically
  IF v_chosen_prize.prize_type = 'dollars' THEN
    v_new_balance := v_player.balance + v_chosen_prize.prize_value;
    
    UPDATE public.players
    SET balance = v_new_balance,
        updated_at = v_now
    WHERE id = p_player_id;

    -- Add to transactions log
    INSERT INTO public.transactions (
      player_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      description,
      idempotency_key
    ) VALUES (
      p_player_id,
      'admin_adjustment'::transaction_type,
      v_chosen_prize.prize_value,
      v_player.balance,
      v_new_balance,
      'مكافأة عجلة الحظ: ' || v_chosen_prize.name,
      p_idempotency_key
    );

    v_final_reward_details := jsonb_build_object(
      'awarded_type', 'dollars',
      'amount', v_chosen_prize.prize_value,
      'new_balance', v_new_balance
    );

  ELSIF v_chosen_prize.prize_type = 'card' AND v_chosen_prize.card_id IS NOT NULL THEN
    SELECT * INTO v_card FROM public.cards WHERE id = v_chosen_prize.card_id;
    IF FOUND THEN
      -- Loop for card copies
      FOR i IN 1..GREATEST(1, v_chosen_prize.card_copies) LOOP
        SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_next_serial
        FROM public.player_cards
        WHERE card_id = v_card.id;

        INSERT INTO public.player_cards (
          player_id,
          card_id,
          serial_number,
          status,
          obtained_via,
          obtained_at
        ) VALUES (
          p_player_id,
          v_card.id,
          v_next_serial,
          'owned',
          'lucky_wheel',
          v_now
        );
      END LOOP;

      -- Update supply if applicable
      UPDATE public.cards
      SET current_supply = current_supply + GREATEST(1, v_chosen_prize.card_copies)
      WHERE id = v_card.id;

      v_final_reward_details := jsonb_build_object(
        'awarded_type', 'card',
        'card_id', v_card.id,
        'card_name', v_card.name,
        'card_rarity', v_card.rarity,
        'card_copies', v_chosen_prize.card_copies,
        'image_path', v_card.image_path
      );
    ELSE
      -- Fallback to default dollars if card vanished
      v_new_balance := v_player.balance + 200;
      UPDATE public.players SET balance = v_new_balance WHERE id = p_player_id;
      v_final_reward_details := jsonb_build_object('awarded_type', 'dollars', 'amount', 200, 'fallback', true);
    END IF;

  ELSIF v_chosen_prize.prize_type = 'title' AND v_chosen_prize.title_id IS NOT NULL THEN
    SELECT * INTO v_title FROM public.titles WHERE id = v_chosen_prize.title_id;
    
    -- Check if player already owns this title
    SELECT EXISTS(
      SELECT 1 FROM public.player_titles
      WHERE player_id = p_player_id AND title_id = v_chosen_prize.title_id
    ) INTO v_already_owns_title;

    IF v_already_owns_title THEN
      -- Compensation in dollars
      v_new_balance := v_player.balance + v_chosen_prize.title_duplicate_reward_dollars;
      UPDATE public.players SET balance = v_new_balance WHERE id = p_player_id;

      INSERT INTO public.transactions (
        player_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description
      ) VALUES (
        p_player_id,
        'admin_adjustment'::transaction_type,
        v_chosen_prize.title_duplicate_reward_dollars,
        v_player.balance,
        v_new_balance,
        'تعويض لقب مكرر من عجلة الحظ (' || COALESCE(v_title.name_ar, 'لقب') || ')'
      );

      v_final_reward_details := jsonb_build_object(
        'awarded_type', 'title_duplicate_compensation',
        'title_id', v_chosen_prize.title_id,
        'compensation_dollars', v_chosen_prize.title_duplicate_reward_dollars,
        'already_owned', true
      );
    ELSE
      INSERT INTO public.player_titles (
        player_id,
        title_id,
        is_equipped,
        unlocked_at,
        obtained_via
      ) VALUES (
        p_player_id,
        v_chosen_prize.title_id,
        false,
        v_now,
        'lucky_wheel'
      );

      v_final_reward_details := jsonb_build_object(
        'awarded_type', 'title',
        'title_id', v_chosen_prize.title_id,
        'title_name', v_title.name_ar,
        'title_rarity', v_title.rarity
      );
    END IF;
  ELSE
    -- Generic custom prize or points
    v_new_balance := v_player.balance + GREATEST(0, v_chosen_prize.prize_value);
    IF v_chosen_prize.prize_value > 0 THEN
      UPDATE public.players SET balance = v_new_balance WHERE id = p_player_id;
    END IF;
    v_final_reward_details := jsonb_build_object('awarded_type', v_chosen_prize.prize_type, 'value', v_chosen_prize.prize_value);
  END IF;

  -- G. Deduct Attempt
  IF v_attempt.extra_spins > 0 THEN
    v_attempt.extra_spins := v_attempt.extra_spins - 1;
  ELSE
    v_attempt.spins_used_in_period := v_attempt.spins_used_in_period + 1;
  END IF;

  v_attempt.last_spin_at := v_now;
  v_attempt.total_spins_all_time := v_attempt.total_spins_all_time + 1;

  UPDATE public.player_lucky_wheel_attempts
  SET extra_spins = v_attempt.extra_spins,
      spins_used_in_period = v_attempt.spins_used_in_period,
      period_start_at = v_attempt.period_start_at,
      last_spin_at = v_now,
      total_spins_all_time = v_attempt.total_spins_all_time,
      updated_at = v_now
  WHERE player_id = p_player_id;

  -- H. Record History Log
  INSERT INTO public.lucky_wheel_spins (
    player_id,
    prize_id,
    prize_name,
    prize_type,
    prize_value,
    card_id,
    title_id,
    reward_details,
    status,
    idempotency_key,
    created_at
  ) VALUES (
    p_player_id,
    v_chosen_prize.id,
    v_chosen_prize.name,
    v_chosen_prize.prize_type,
    v_chosen_prize.prize_value,
    v_chosen_prize.card_id,
    v_chosen_prize.title_id,
    v_final_reward_details,
    'success',
    p_idempotency_key,
    v_now
  );

  v_spins_left := GREATEST(0, v_settings.spins_per_period - v_attempt.spins_used_in_period) + v_attempt.extra_spins;

  -- I. Return Complete Response
  RETURN jsonb_build_object(
    'success', true,
    'prize', jsonb_build_object(
      'id', v_chosen_prize.id,
      'name', v_chosen_prize.name,
      'prize_type', v_chosen_prize.prize_type,
      'prize_value', v_chosen_prize.prize_value,
      'card_id', v_chosen_prize.card_id,
      'card_copies', v_chosen_prize.card_copies,
      'title_id', v_chosen_prize.title_id,
      'image_url', v_chosen_prize.image_url,
      'icon_name', v_chosen_prize.icon_name,
      'description', v_chosen_prize.description,
      'color', v_chosen_prize.color,
      'is_rare', v_chosen_prize.is_rare,
      'is_legendary', v_chosen_prize.is_legendary,
      'segment_index', v_prize_index
    ),
    'reward_details', v_final_reward_details,
    'spins_left', v_spins_left,
    'next_reset_at', v_period_end,
    'player_new_balance', COALESCE(v_new_balance, v_player.balance)
  );
END;
$$;

-- 9. Admin Functions
CREATE OR REPLACE FUNCTION public.admin_grant_player_spins(
  p_admin_id UUID,
  p_target_player_id UUID,
  p_count INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_count <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'يجب أن يكون عدد المحاولات موجباً');
  END IF;

  INSERT INTO public.player_lucky_wheel_attempts (player_id, extra_spins, spins_used_in_period, period_start_at, total_spins_all_time)
  VALUES (p_target_player_id, p_count, 0, NOW(), 0)
  ON CONFLICT (player_id) DO UPDATE
  SET extra_spins = player_lucky_wheel_attempts.extra_spins + p_count,
      updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'message', 'تم منح ' || p_count || ' محاولات إضافية للاعب بنجاح! 🎁');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_player_spins(
  p_admin_id UUID,
  p_target_player_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.player_lucky_wheel_attempts
  SET spins_used_in_period = 0,
      period_start_at = NOW(),
      updated_at = NOW()
  WHERE player_id = p_target_player_id;

  RETURN jsonb_build_object('success', true, 'message', 'تمت إعادة تعيين محاولات اللاعب بنجاح! 🔄');
END;
$$;

-- 10. Seed Default High-Quality Prizes (matching existing cards, titles, and dollars)
INSERT INTO public.lucky_wheel_prizes (name, prize_type, prize_value, image_url, icon_name, description, color, weight, is_rare, is_legendary, display_order)
VALUES
  ('100 Dollars', 'dollars', 100, '/coins.png', 'Coins', 'مبلغ بسيط لبدء المراهنات', '#10b981', 35, false, false, 1),
  ('250 Dollars', 'dollars', 250, '/coins.png', 'Coins', 'مكافأة نقدية إضافية', '#06b6d4', 25, false, false, 2),
  ('500 Dollars', 'dollars', 500, '/coins.png', 'Wallet', 'رصيد مميز يدعم مشاركاتك', '#8b5cf6', 15, true, false, 3),
  ('1,000 Dollars', 'dollars', 1000, '/coins.png', 'Gem', 'جائزة كبرى من الدولارات!', '#f59e0b', 8, true, false, 4),
  ('2,500 Dollars', 'dollars', 2500, '/coins.png', 'Trophy', 'ثروة حقيقية للمراهن المحظوظ', '#ec4899', 3, true, true, 5)
ON CONFLICT DO NOTHING;

-- Link default cards if they exist
DO $$
DECLARE
  v_changli_id UUID;
  v_jiyan_id UUID;
  v_title_id UUID;
BEGIN
  SELECT id INTO v_changli_id FROM public.cards WHERE rarity = 'legendary' LIMIT 1;
  IF v_changli_id IS NOT NULL THEN
    INSERT INTO public.lucky_wheel_prizes (name, prize_type, prize_value, card_id, card_copies, image_url, description, color, weight, is_rare, is_legendary, display_order)
    VALUES ('بطاقة ريزوناتور أسطورية', 'card', 1, v_changli_id, 1, '/logo.jpeg', 'بطاقة أسطورية نادرة تضاف لمخزونك', '#f97316', 5, true, true, 6)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_jiyan_id FROM public.cards WHERE rarity IN ('mythic', 'epic') LIMIT 1;
  IF v_jiyan_id IS NOT NULL THEN
    INSERT INTO public.lucky_wheel_prizes (name, prize_type, prize_value, card_id, card_copies, image_url, description, color, weight, is_rare, is_legendary, display_order)
    VALUES ('بطاقة ريزوناتور مميزة', 'card', 1, v_jiyan_id, 1, '/logo.jpeg', 'بطاقة قوية تدعم تشكيلتك', '#3b82f6', 6, true, false, 7)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_title_id FROM public.titles WHERE is_active = true LIMIT 1;
  IF v_title_id IS NOT NULL THEN
    INSERT INTO public.lucky_wheel_prizes (name, prize_type, prize_value, title_id, title_duplicate_reward_dollars, description, color, weight, is_rare, is_legendary, display_order)
    VALUES ('لقب شرفي نادر', 'title', 1, v_title_id, 300, 'لقب حصري يزين ملفك الشخصي', '#a855f7', 3, true, true, 8)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
