-- ============================================================
-- Fix: pass_or_end_empty_hand - remove ambiguous overload
-- Winner logic: more cards wins > higher LP wins > coin flip
-- ============================================================

-- Step 1: Drop BOTH overloads
DROP FUNCTION IF EXISTS pass_or_end_empty_hand(UUID, UUID);
DROP FUNCTION IF EXISTS pass_or_end_empty_hand(UUID, UUID, BOOLEAN);

-- Step 2: Create single clean version
CREATE OR REPLACE FUNCTION pass_or_end_empty_hand(
  p_challenge_id UUID,
  p_player_id    UUID,
  p_force_end    BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_challenge     RECORD;
  v_is_challenger BOOLEAN;
  v_opp_id        UUID;
  v_c_cards       INTEGER;
  v_d_cards       INTEGER;
  v_c_hp          NUMERIC;
  v_d_hp          NUMERIC;
  v_my_cards      INTEGER;
  v_opp_cards     INTEGER;
  v_is_finished   BOOLEAN := false;
  v_winner_id     UUID    := NULL;
  v_player_name   TEXT;
  v_opp_name      TEXT;
  v_winner_name   TEXT;
  v_win_reason    TEXT;
  v_log_msg       TEXT;
  v_reward        NUMERIC;
  v_old_bal       NUMERIC;
BEGIN
  SELECT * INTO v_challenge FROM pvp_challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'التحدي غير موجود');
  END IF;

  -- Already completed – return winner info without re-processing
  IF v_challenge.status = 'completed' THEN
    SELECT username INTO v_winner_name FROM players WHERE id = v_challenge.winner_id;
    RETURN jsonb_build_object(
      'success',     true,
      'is_finished', true,
      'winner_id',   v_challenge.winner_id,
      'winner_name', v_winner_name
    );
  END IF;

  v_is_challenger := (v_challenge.challenger_id = p_player_id);
  v_opp_id        := CASE WHEN v_is_challenger THEN v_challenge.challenged_id ELSE v_challenge.challenger_id END;

  SELECT username INTO v_player_name FROM players WHERE id = p_player_id;
  SELECT username INTO v_opp_name    FROM players WHERE id = v_opp_id;

  -- Card counts
  v_c_cards := jsonb_array_length(COALESCE(v_challenge.challenger_hand, '[]'::jsonb));
  v_d_cards := jsonb_array_length(COALESCE(v_challenge.challenged_hand, '[]'::jsonb));
  -- HP values
  v_c_hp    := COALESCE((v_challenge.battle_state -> 'challenger' ->> 'hp')::NUMERIC, 1200);
  v_d_hp    := COALESCE((v_challenge.battle_state -> 'challenged' ->> 'hp')::NUMERIC, 1200);

  IF v_is_challenger THEN
    v_my_cards  := v_c_cards;
    v_opp_cards := v_d_cards;
  ELSE
    v_my_cards  := v_d_cards;
    v_opp_cards := v_c_cards;
  END IF;

  -- ── CASE 1: Force-end OR both players are out of cards ──────────────────────
  IF p_force_end OR (v_c_cards = 0 AND v_d_cards = 0) THEN
    v_is_finished := true;

    -- Priority 1: more remaining cards wins (only relevant on force-end)
    IF v_c_cards > v_d_cards THEN
      v_winner_id  := v_challenge.challenger_id;
      v_win_reason := 'بطاقات أكثر عند انتهاء المبارزة';
    ELSIF v_d_cards > v_c_cards THEN
      v_winner_id  := v_challenge.challenged_id;
      v_win_reason := 'بطاقات أكثر عند انتهاء المبارزة';
    -- Priority 2: higher HP wins
    ELSIF v_c_hp > v_d_hp THEN
      v_winner_id  := v_challenge.challenger_id;
      v_win_reason := 'أعلى نقاط LP بعد نفاد البطاقات';
    ELSIF v_d_hp > v_c_hp THEN
      v_winner_id  := v_challenge.challenged_id;
      v_win_reason := 'أعلى نقاط LP بعد نفاد البطاقات';
    -- Priority 3: exact tie → caller wins by luck
    ELSE
      v_winner_id  := p_player_id;
      v_win_reason := 'تعادل تام – الفائز بالقرعة';
    END IF;

    SELECT username INTO v_winner_name FROM players WHERE id = v_winner_id;

  -- ── CASE 2: I am out, opponent has cards → pass my turn to them ─────────────
  ELSIF v_my_cards = 0 AND v_opp_cards > 0 THEN
    IF v_challenge.current_turn_player_id = p_player_id THEN
      v_log_msg := '🔄 نفدت بطاقات ' || v_player_name ||
                   '، انتقل الدور تلقائياً إلى ' || v_opp_name ||
                   ' (' || v_opp_cards || ' بطاقات متبقية)!';

      UPDATE pvp_challenges
      SET   current_turn_player_id = v_opp_id,
            combat_log = COALESCE(combat_log, '[]'::jsonb) ||
              jsonb_build_array(jsonb_build_object(
                'text', v_log_msg, 'time', NOW(), 'player_id', p_player_id
              ))
      WHERE id = p_challenge_id;

      RETURN jsonb_build_object(
        'success', true,
        'is_finished', false,
        'current_turn_player_id', v_opp_id,
        'message', v_log_msg
      );
    ELSE
      -- Turn already belongs to the opponent, nothing to do
      RETURN jsonb_build_object(
        'success', true,
        'is_finished', false,
        'current_turn_player_id', v_challenge.current_turn_player_id
      );
    END IF;

  -- ── CASE 3: Opponent is out, I still have cards → keep my turn ──────────────
  ELSIF v_opp_cards = 0 AND v_my_cards > 0 THEN
    IF v_challenge.current_turn_player_id = v_opp_id THEN
      v_log_msg := '🔄 نفدت بطاقات ' || v_opp_name ||
                   '، الدور مستمر لدى ' || v_player_name ||
                   ' (' || v_my_cards || ' بطاقات متبقية)!';

      UPDATE pvp_challenges
      SET   current_turn_player_id = p_player_id,
            combat_log = COALESCE(combat_log, '[]'::jsonb) ||
              jsonb_build_array(jsonb_build_object(
                'text', v_log_msg, 'time', NOW(), 'player_id', p_player_id
              ))
      WHERE id = p_challenge_id;

      RETURN jsonb_build_object(
        'success', true,
        'is_finished', false,
        'current_turn_player_id', p_player_id,
        'message', v_log_msg
      );
    END IF;
    RETURN jsonb_build_object(
      'success', true,
      'is_finished', false,
      'current_turn_player_id', v_challenge.current_turn_player_id
    );
  END IF;

  -- ── Finalise if the match is done ───────────────────────────────────────────
  IF v_is_finished THEN
    v_reward := v_challenge.stake * 2;
    SELECT balance INTO v_old_bal FROM players WHERE id = v_winner_id FOR UPDATE;

    UPDATE players
    SET   balance        = balance + v_reward,
          total_winnings = total_winnings + v_reward
    WHERE id = v_winner_id;

    INSERT INTO transactions (
      player_id, transaction_type, amount, balance_before, balance_after, description
    ) VALUES (
      v_winner_id,
      'win_reward'::transaction_type,
      v_reward,
      v_old_bal,
      v_old_bal + v_reward,
      'فوز في مبارزة WuWa (' || v_win_reason || ')'
    );

    v_log_msg := '🏆 انتصار! حُسمت المبارزة لصالح ' || v_winner_name ||
                 ' — ' || v_win_reason || '!';

    UPDATE pvp_challenges
    SET   status                 = 'completed',
          winner_id              = v_winner_id,
          current_turn_player_id = NULL,
          resolved_at            = NOW(),
          combat_log = COALESCE(combat_log, '[]'::jsonb) ||
            jsonb_build_array(jsonb_build_object(
              'text', v_log_msg, 'time', NOW(), 'player_id', v_winner_id
            ))
    WHERE id = p_challenge_id;

    RETURN jsonb_build_object(
      'success',     true,
      'is_finished', true,
      'winner_id',   v_winner_id,
      'winner_name', v_winner_name,
      'win_reason',  v_win_reason,
      'message',     v_log_msg
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'is_finished', false);
END;
$$;

GRANT EXECUTE ON FUNCTION pass_or_end_empty_hand(UUID, UUID, BOOLEAN) TO authenticated;
