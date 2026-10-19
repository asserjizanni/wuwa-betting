-- ============================================================
-- WuWa Betting - Database Schema
-- PostgreSQL via Supabase
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE account_status AS ENUM ('active', 'banned', 'suspended');
CREATE TYPE event_status AS ENUM (
  'draft',
  'scheduled',
  'open',
  'closed',
  'pending_result',
  'settling',
  'completed',
  'cancelled'
);
CREATE TYPE bet_status AS ENUM ('pending', 'confirmed', 'won', 'lost', 'refunded', 'cancelled');
CREATE TYPE transaction_type AS ENUM (
  'initial_balance',
  'bet_deduction',
  'win_reward',
  'event_settlement',
  'admin_adjustment',
  'bet_refund',
  'cancellation_refund'
);
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator');
CREATE TYPE audit_action AS ENUM (
  'event_created',
  'event_updated',
  'event_published',
  'event_opened',
  'event_closed',
  'event_result_declared',
  'event_settled',
  'event_cancelled',
  'player_banned',
  'player_unbanned',
  'player_balance_adjusted',
  'character_created',
  'character_updated',
  'character_image_updated',
  'character_deleted',
  'admin_created',
  'bet_refunded'
);

-- ============================================================
-- PLAYERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  username VARCHAR(50) NOT NULL,
  username_normalized VARCHAR(50) NOT NULL UNIQUE,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 500.00,
  total_winnings NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_bets INTEGER NOT NULL DEFAULT 0,
  winning_bets INTEGER NOT NULL DEFAULT 0,
  losing_bets INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  account_status account_status NOT NULL DEFAULT 'active',
  CONSTRAINT username_length CHECK (LENGTH(TRIM(username)) >= 2 AND LENGTH(TRIM(username)) <= 50),
  CONSTRAINT balance_not_extreme CHECK (balance > -1000000 AND balance < 10000000),
  CONSTRAINT stats_non_negative CHECK (total_bets >= 0 AND winning_bets >= 0 AND losing_bets >= 0)
);

-- Indexes
CREATE INDEX idx_players_auth_id ON players(auth_id);
CREATE INDEX idx_players_username_normalized ON players(username_normalized);
CREATE INDEX idx_players_balance ON players(balance DESC);
CREATE INDEX idx_players_account_status ON players(account_status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ADMINS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  role admin_role NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CHARACTERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  alternate_name VARCHAR(100),
  image_path TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) >= 1)
);

CREATE INDEX idx_characters_name ON characters(LOWER(name));
CREATE INDEX idx_characters_display_order ON characters(display_order);
CREATE INDEX idx_characters_is_active ON characters(is_active);

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- EVENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_path TEXT,
  character_a_id UUID NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
  character_b_id UUID NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
  multiplier NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
  max_bet_amount NUMERIC(15, 2),
  status event_status NOT NULL DEFAULT 'draft',
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  winner_character_id UUID REFERENCES characters(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  settling_started_at TIMESTAMPTZ,
  CONSTRAINT different_characters CHECK (character_a_id != character_b_id),
  CONSTRAINT valid_multiplier CHECK (multiplier >= 1.00 AND multiplier <= 100.00),
  CONSTRAINT valid_max_bet CHECK (max_bet_amount IS NULL OR max_bet_amount > 0),
  CONSTRAINT valid_dates CHECK (opens_at IS NULL OR closes_at IS NULL OR closes_at > opens_at),
  CONSTRAINT winner_is_participant CHECK (
    winner_character_id IS NULL OR 
    winner_character_id = character_a_id OR 
    winner_character_id = character_b_id
  )
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_character_a ON events(character_a_id);
CREATE INDEX idx_events_character_b ON events(character_b_id);
CREATE INDEX idx_events_opens_at ON events(opens_at);
CREATE INDEX idx_events_closes_at ON events(closes_at);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- BETS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  selected_character_id UUID NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
  stake NUMERIC(15, 2) NOT NULL,
  multiplier_snapshot NUMERIC(5, 2) NOT NULL,
  potential_payout NUMERIC(15, 2) NOT NULL GENERATED ALWAYS AS (stake * multiplier_snapshot) STORED,
  status bet_status NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  CONSTRAINT positive_stake CHECK (stake > 0),
  CONSTRAINT valid_multiplier_snapshot CHECK (multiplier_snapshot >= 1.00 AND multiplier_snapshot <= 100.00),
  CONSTRAINT one_bet_per_event UNIQUE (player_id, event_id)
);

CREATE INDEX idx_bets_player_id ON bets(player_id);
CREATE INDEX idx_bets_event_id ON bets(event_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_selected_character ON bets(selected_character_id);
CREATE INDEX idx_bets_created_at ON bets(created_at DESC);

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  balance_before NUMERIC(15, 2) NOT NULL,
  balance_after NUMERIC(15, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key VARCHAR(200) UNIQUE,
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  CONSTRAINT amount_not_zero CHECK (amount != 0),
  CONSTRAINT balance_consistency CHECK (ABS((balance_before + amount) - balance_after) < 0.01)
);

CREATE INDEX idx_transactions_player_id ON transactions(player_id);
CREATE INDEX idx_transactions_event_id ON transactions(event_id);
CREATE INDEX idx_transactions_bet_id ON transactions(bet_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- EVENT STATS VIEW (for performance)
-- ============================================================

CREATE OR REPLACE VIEW event_stats AS
SELECT
  e.id AS event_id,
  e.character_a_id,
  e.character_b_id,
  COALESCE(SUM(CASE WHEN b.selected_character_id = e.character_a_id AND b.status IN ('confirmed', 'won', 'lost') THEN b.stake ELSE 0 END), 0) AS char_a_total_stake,
  COALESCE(SUM(CASE WHEN b.selected_character_id = e.character_b_id AND b.status IN ('confirmed', 'won', 'lost') THEN b.stake ELSE 0 END), 0) AS char_b_total_stake,
  COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'won', 'lost') THEN b.stake ELSE 0 END), 0) AS total_stake,
  COUNT(CASE WHEN b.status IN ('confirmed', 'won', 'lost') THEN 1 END) AS total_participants,
  COUNT(CASE WHEN b.selected_character_id = e.character_a_id AND b.status IN ('confirmed', 'won', 'lost') THEN 1 END) AS char_a_participants,
  COUNT(CASE WHEN b.selected_character_id = e.character_b_id AND b.status IN ('confirmed', 'won', 'lost') THEN 1 END) AS char_b_participants
FROM events e
LEFT JOIN bets b ON b.event_id = e.id
GROUP BY e.id, e.character_a_id, e.character_b_id;

-- ============================================================
-- LEADERBOARD VIEW
-- ============================================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id,
  p.username,
  p.balance,
  p.total_winnings,
  p.total_bets,
  p.winning_bets,
  p.losing_bets,
  CASE 
    WHEN (p.winning_bets + p.losing_bets) > 0 
    THEN ROUND((p.winning_bets::NUMERIC / (p.winning_bets + p.losing_bets)::NUMERIC) * 100, 1)
    ELSE 0 
  END AS win_rate,
  ROW_NUMBER() OVER (ORDER BY p.balance DESC, p.total_winnings DESC) AS rank
FROM players p
WHERE p.account_status = 'active'
ORDER BY p.balance DESC, p.total_winnings DESC;

-- ============================================================
-- PLACE BET FUNCTION (Atomic, Safe)
-- ============================================================

CREATE OR REPLACE FUNCTION place_bet(
  p_player_id UUID,
  p_event_id UUID,
  p_character_id UUID,
  p_stake NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_player players%ROWTYPE;
  v_existing_bet bets%ROWTYPE;
  v_bet bets%ROWTYPE;
  v_idempotency_key VARCHAR;
BEGIN
  -- Lock the event row
  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'event_not_found', 'message', 'الإيفنت غير موجود');
  END IF;
  
  -- Check event is open
  IF v_event.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'event_not_open', 'message', 'الإيفنت غير مفتوح للرهان حالياً');
  END IF;
  
  -- Check closes_at
  IF v_event.closes_at IS NOT NULL AND NOW() > v_event.closes_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'event_closed', 'message', 'انتهى وقت قبول الرهانات');
  END IF;
  
  -- Check character is valid
  IF p_character_id != v_event.character_a_id AND p_character_id != v_event.character_b_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_character', 'message', 'الشخصية المختارة غير مشاركة في هذا الإيفنت');
  END IF;
  
  -- Check stake
  IF p_stake <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_stake', 'message', 'مبلغ الرهان يجب أن يكون أكبر من صفر');
  END IF;
  
  IF v_event.max_bet_amount IS NOT NULL AND p_stake > v_event.max_bet_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'exceeds_max_bet', 'message', 'مبلغ الرهان يتجاوز الحد الأقصى المسموح به: ' || v_event.max_bet_amount);
  END IF;
  
  -- Lock the player row
  SELECT * INTO v_player FROM players WHERE id = p_player_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'player_not_found', 'message', 'لاعب غير موجود');
  END IF;
  
  IF v_player.account_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'player_banned', 'message', 'حسابك موقوف');
  END IF;
  
  -- Check for existing bet
  SELECT * INTO v_existing_bet FROM bets WHERE player_id = p_player_id AND event_id = p_event_id;
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_bet', 'message', 'لقد راهنت في هذا الإيفنت مسبقاً');
  END IF;
  
  -- Idempotency key
  v_idempotency_key := 'bet_' || p_player_id || '_' || p_event_id;
  
  -- Check idempotency
  IF EXISTS (SELECT 1 FROM transactions WHERE idempotency_key = v_idempotency_key) THEN
    RETURN jsonb_build_object('success', false, 'error', 'duplicate_bet', 'message', 'تم تسجيل هذا الرهان مسبقاً');
  END IF;
  
  -- Insert bet
  INSERT INTO bets (player_id, event_id, selected_character_id, stake, multiplier_snapshot, status)
  VALUES (p_player_id, p_event_id, p_character_id, p_stake, v_event.multiplier, 'confirmed')
  RETURNING * INTO v_bet;
  
  -- Deduct from player balance
  UPDATE players 
  SET 
    balance = balance - p_stake,
    total_bets = total_bets + 1,
    last_active_at = NOW()
  WHERE id = p_player_id;
  
  -- Record transaction
  INSERT INTO transactions (
    player_id, event_id, bet_id, transaction_type, amount,
    balance_before, balance_after, description, idempotency_key
  ) VALUES (
    p_player_id, p_event_id, v_bet.id, 'bet_deduction', -p_stake,
    v_player.balance, v_player.balance - p_stake,
    'رهان على إيفنت: ' || (SELECT title FROM events WHERE id = p_event_id),
    v_idempotency_key
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet.id,
    'stake', p_stake,
    'multiplier', v_event.multiplier,
    'potential_payout', p_stake * v_event.multiplier,
    'new_balance', v_player.balance - p_stake
  );
END;
$$;

-- ============================================================
-- SETTLE EVENT FUNCTION (Atomic, Idempotent)
-- ============================================================

CREATE OR REPLACE FUNCTION settle_event(
  p_event_id UUID,
  p_winner_character_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_bet bets%ROWTYPE;
  v_player players%ROWTYPE;
  v_payout NUMERIC;
  v_winners INTEGER := 0;
  v_losers INTEGER := 0;
  v_total_paid NUMERIC := 0;
  v_idempotency_key VARCHAR;
BEGIN
  -- Lock the event
  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'event_not_found', 'message', 'الإيفنت غير موجود');
  END IF;
  
  -- Check status - prevent double settlement
  IF v_event.status IN ('completed', 'settling') THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_settled', 'message', 'تمت تسوية هذا الإيفنت مسبقاً');
  END IF;
  
  IF v_event.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'event_cancelled', 'message', 'لا يمكن تسوية إيفنت ملغى');
  END IF;
  
  -- Validate winner character
  IF p_winner_character_id != v_event.character_a_id AND p_winner_character_id != v_event.character_b_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_winner', 'message', 'الشخصية الفائزة غير مشاركة في هذا الإيفنت');
  END IF;
  
  -- Mark as settling to prevent concurrent settlements
  UPDATE events 
  SET status = 'settling', winner_character_id = p_winner_character_id, settling_started_at = NOW()
  WHERE id = p_event_id AND status NOT IN ('completed', 'settling', 'cancelled');
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'concurrent_settlement', 'message', 'جارٍ تسوية الإيفنت من جلسة أخرى');
  END IF;
  
  -- Process each bet
  FOR v_bet IN 
    SELECT * FROM bets WHERE event_id = p_event_id AND status = 'confirmed'
    FOR UPDATE
  LOOP
    v_idempotency_key := 'settlement_' || p_event_id || '_' || v_bet.id;
    
    -- Skip if already processed (idempotency)
    IF EXISTS (SELECT 1 FROM transactions WHERE idempotency_key = v_idempotency_key) THEN
      CONTINUE;
    END IF;
    
    -- Lock player
    SELECT * INTO v_player FROM players WHERE id = v_bet.player_id FOR UPDATE;
    
    IF v_bet.selected_character_id = p_winner_character_id THEN
      -- Winner
      v_payout := v_bet.stake * v_bet.multiplier_snapshot;
      
      UPDATE players
      SET 
        balance = balance + v_payout,
        total_winnings = total_winnings + (v_payout - v_bet.stake),
        winning_bets = winning_bets + 1
      WHERE id = v_bet.player_id;
      
      UPDATE bets SET status = 'won', settled_at = NOW() WHERE id = v_bet.id;
      
      INSERT INTO transactions (
        player_id, event_id, bet_id, transaction_type, amount,
        balance_before, balance_after, description, idempotency_key
      ) VALUES (
        v_bet.player_id, p_event_id, v_bet.id, 'win_reward', v_payout,
        v_player.balance, v_player.balance + v_payout,
        'مكافأة فوز في إيفنت: ' || (SELECT title FROM events WHERE id = p_event_id),
        v_idempotency_key
      );
      
      v_winners := v_winners + 1;
      v_total_paid := v_total_paid + v_payout;
    ELSE
      -- Loser - no additional deduction (already deducted at bet time)
      UPDATE bets SET status = 'lost', settled_at = NOW() WHERE id = v_bet.id;
      
      UPDATE players SET losing_bets = losing_bets + 1 WHERE id = v_bet.player_id;
      
      v_losers := v_losers + 1;
    END IF;
  END LOOP;
  
  -- Mark event as completed
  UPDATE events 
  SET status = 'completed', settled_at = NOW()
  WHERE id = p_event_id;
  
  -- Audit log
  INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (
    p_admin_id, 'event_settled', 'event', p_event_id,
    jsonb_build_object(
      'winner_character_id', p_winner_character_id,
      'winners_count', v_winners,
      'losers_count', v_losers,
      'total_paid', v_total_paid
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'winners', v_winners,
    'losers', v_losers,
    'total_paid', v_total_paid
  );
END;
$$;

-- ============================================================
-- CANCEL EVENT FUNCTION (with refunds)
-- ============================================================

CREATE OR REPLACE FUNCTION cancel_event(
  p_event_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'إلغاء من قبل المدير'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_bet bets%ROWTYPE;
  v_player players%ROWTYPE;
  v_refunded INTEGER := 0;
  v_total_refunded NUMERIC := 0;
  v_idempotency_key VARCHAR;
BEGIN
  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'event_not_found');
  END IF;
  
  IF v_event.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_completed', 'message', 'لا يمكن إلغاء إيفنت مكتمل');
  END IF;
  
  IF v_event.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_cancelled', 'message', 'الإيفنت ملغى مسبقاً');
  END IF;
  
  -- Refund all confirmed bets
  FOR v_bet IN
    SELECT * FROM bets WHERE event_id = p_event_id AND status = 'confirmed'
    FOR UPDATE
  LOOP
    v_idempotency_key := 'refund_' || p_event_id || '_' || v_bet.id;
    
    IF EXISTS (SELECT 1 FROM transactions WHERE idempotency_key = v_idempotency_key) THEN
      CONTINUE;
    END IF;
    
    SELECT * INTO v_player FROM players WHERE id = v_bet.player_id FOR UPDATE;
    
    UPDATE players SET balance = balance + v_bet.stake WHERE id = v_bet.player_id;
    UPDATE players SET total_bets = GREATEST(0, total_bets - 1) WHERE id = v_bet.player_id;
    
    UPDATE bets SET status = 'refunded', settled_at = NOW() WHERE id = v_bet.id;
    
    INSERT INTO transactions (
      player_id, event_id, bet_id, transaction_type, amount,
      balance_before, balance_after, description, idempotency_key
    ) VALUES (
      v_bet.player_id, p_event_id, v_bet.id, 'cancellation_refund', v_bet.stake,
      v_player.balance, v_player.balance + v_bet.stake,
      'استرداد رهان - إلغاء إيفنت: ' || p_reason,
      v_idempotency_key
    );
    
    v_refunded := v_refunded + 1;
    v_total_refunded := v_total_refunded + v_bet.stake;
  END LOOP;
  
  UPDATE events SET status = 'cancelled' WHERE id = p_event_id;
  
  INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (
    p_admin_id, 'event_cancelled', 'event', p_event_id,
    jsonb_build_object('reason', p_reason, 'refunded_bets', v_refunded, 'total_refunded', v_total_refunded)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'refunded_bets', v_refunded,
    'total_refunded', v_total_refunded
  );
END;
$$;

-- ============================================================
-- ADMIN BALANCE ADJUSTMENT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION admin_adjust_balance(
  p_admin_id UUID,
  p_player_id UUID,
  p_amount NUMERIC,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player players%ROWTYPE;
  v_idempotency_key VARCHAR;
BEGIN
  IF p_amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;
  
  SELECT * INTO v_player FROM players WHERE id = p_player_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'player_not_found');
  END IF;
  
  v_idempotency_key := 'admin_adj_' || p_admin_id || '_' || p_player_id || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  
  UPDATE players SET balance = balance + p_amount WHERE id = p_player_id;
  
  INSERT INTO transactions (
    player_id, transaction_type, amount, balance_before, balance_after, description, idempotency_key, admin_id
  ) VALUES (
    p_player_id, 'admin_adjustment', p_amount, v_player.balance, v_player.balance + p_amount,
    'تعديل إداري: ' || p_reason, v_idempotency_key, p_admin_id
  );
  
  INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (
    p_admin_id, 'player_balance_adjusted', 'player', p_player_id,
    jsonb_build_object('amount', p_amount, 'reason', p_reason, 'balance_before', v_player.balance)
  );
  
  RETURN jsonb_build_object('success', true, 'new_balance', v_player.balance + p_amount);
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE auth_id = auth.uid() AND is_active = true
  );
END;
$$;

-- Helper function to get admin id
CREATE OR REPLACE FUNCTION get_admin_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM admins WHERE auth_id = auth.uid() AND is_active = true;
  RETURN v_admin_id;
END;
$$;

-- Helper function to get player id from auth
CREATE OR REPLACE FUNCTION get_player_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id UUID;
BEGIN
  SELECT id INTO v_player_id FROM players WHERE auth_id = auth.uid();
  RETURN v_player_id;
END;
$$;

-- PLAYERS policies
CREATE POLICY "Players can view own profile" ON players
  FOR SELECT USING (auth_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can view all players" ON players
  FOR SELECT USING (is_admin());

CREATE POLICY "Only service can insert players" ON players
  FOR INSERT WITH CHECK (auth_id = auth.uid() OR is_admin());

CREATE POLICY "Players cannot update own balance directly" ON players
  FOR UPDATE USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete players" ON players
  FOR DELETE USING (is_admin());

-- ADMINS policies
CREATE POLICY "Admins can view admin table" ON admins
  FOR SELECT USING (is_admin() OR auth_id = auth.uid());

CREATE POLICY "Only super admins can manage admins" ON admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid() AND role = 'super_admin' AND is_active = true)
  );

-- CHARACTERS policies  
CREATE POLICY "Anyone can view active characters" ON characters
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Only admins can manage characters" ON characters
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update characters" ON characters
  FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete characters" ON characters
  FOR DELETE USING (is_admin());

-- EVENTS policies
CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage events" ON events
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update events" ON events
  FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete events" ON events
  FOR DELETE USING (is_admin());

-- BETS policies
CREATE POLICY "Players can view own bets" ON bets
  FOR SELECT USING (player_id = get_player_id() OR is_admin());

CREATE POLICY "Players cannot insert bets directly" ON bets
  FOR INSERT WITH CHECK (false); -- Must use place_bet function

CREATE POLICY "Bets are immutable for players" ON bets
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can view all bets" ON bets
  FOR SELECT USING (is_admin());

-- TRANSACTIONS policies
CREATE POLICY "Players can view own transactions" ON transactions
  FOR SELECT USING (player_id = get_player_id() OR is_admin());

CREATE POLICY "Transactions are insert-only via functions" ON transactions
  FOR INSERT WITH CHECK (false); -- Must use functions

CREATE POLICY "Transactions are immutable" ON transactions
  FOR UPDATE USING (false);

CREATE POLICY "Transactions cannot be deleted" ON transactions
  FOR DELETE USING (false);

-- AUDIT LOGS policies
CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "Audit logs are insert-only via functions" ON audit_logs
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Audit logs are immutable" ON audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "Audit logs cannot be deleted" ON audit_logs
  FOR DELETE USING (false);

-- ============================================================
-- LEADERBOARD - public read for top players
-- ============================================================

CREATE POLICY "Anyone can view leaderboard" ON players
  FOR SELECT USING (true); -- The view filters sensitive data

-- ============================================================
-- PUBLIC STATS FUNCTION (safe for frontend)
-- ============================================================

CREATE OR REPLACE FUNCTION get_public_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  username VARCHAR,
  balance NUMERIC,
  total_winnings NUMERIC,
  total_bets INTEGER,
  winning_bets INTEGER,
  losing_bets INTEGER,
  win_rate NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY p.balance DESC, p.total_winnings DESC) as rank,
    p.username,
    p.balance,
    p.total_winnings,
    p.total_bets,
    p.winning_bets,
    p.losing_bets,
    CASE 
      WHEN (p.winning_bets + p.losing_bets) > 0 
      THEN ROUND((p.winning_bets::NUMERIC / (p.winning_bets + p.losing_bets)::NUMERIC) * 100, 1)
      ELSE 0 
    END AS win_rate
  FROM players p
  WHERE p.account_status = 'active'
  ORDER BY p.balance DESC, p.total_winnings DESC
  LIMIT p_limit;
$$;

-- ============================================================
-- INITIAL SETUP: Create admin account helper
-- NOTE: Run this AFTER creating admin user in Supabase Auth
-- ============================================================

-- Example (uncomment and replace with actual auth user id):
-- INSERT INTO admins (auth_id, username, role)
-- VALUES ('YOUR_AUTH_USER_UUID_HERE', 'admin', 'super_admin');
