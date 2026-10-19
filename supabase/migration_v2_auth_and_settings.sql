-- ============================================================
-- WuWa Betting - Migration: Password Auth + Game Settings
-- ============================================================

-- 1. Add password_hash to players (for username+password auth)
ALTER TABLE players ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS recovery_code VARCHAR(20);
ALTER TABLE players ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE players ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Create index on recovery_code
CREATE INDEX IF NOT EXISTS idx_players_recovery_code ON players(recovery_code);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(LOWER(email));

-- 2. Generate recovery codes for players that don't have one
UPDATE players 
SET recovery_code = UPPER(
  SUBSTRING(md5(random()::text || id::text) FROM 1 FOR 4) || '-' ||
  SUBSTRING(md5(random()::text || id::text) FROM 5 FOR 4) || '-' ||
  SUBSTRING(md5(random()::text || id::text) FROM 9 FOR 4)
)
WHERE recovery_code IS NULL;

-- 3. GAME SETTINGS TABLE - Central configuration store
CREATE TABLE IF NOT EXISTS game_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_game_settings_category ON game_settings(category);
CREATE INDEX IF NOT EXISTS idx_game_settings_key ON game_settings(category, key);

ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read settings" ON game_settings FOR SELECT USING (is_admin());
CREATE POLICY "Admins can write settings" ON game_settings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update settings" ON game_settings FOR UPDATE USING (is_admin());

-- 4. Insert default game settings
INSERT INTO game_settings (category, key, value, description) VALUES
-- Auth settings
('auth', 'allow_registration', 'true', 'السماح بالتسجيل الجديد'),
('auth', 'initial_balance', '500', 'الرصيد الأولي للاعب الجديد'),
('auth', 'username_min_length', '2', 'الحد الأدنى لطول اسم المستخدم'),
('auth', 'username_max_length', '30', 'الحد الأقصى لطول اسم المستخدم'),
('auth', 'password_min_length', '6', 'الحد الأدنى لكلمة المرور'),
-- Economy settings
('economy', 'box_price_common', '100', 'سعر صندوق البطاقات العادية'),
('economy', 'box_price_rare', '300', 'سعر صندوق البطاقات النادرة'),
('economy', 'box_price_epic', '500', 'سعر صندوق البطاقات الملحمية'),
('economy', 'market_fee_percent', '5', 'رسوم السوق (%)'),
('economy', 'gift_daily_limit', '5', 'الحد الأقصى للهدايا اليومية'),
('economy', 'gift_min_player_level', '1', 'الحد الأدنى لمستوى اللاعب للإهداء'),
-- Challenges settings
('challenges', 'enabled', 'true', 'تفعيل التحديات'),
('challenges', 'min_stake', '50', 'الحد الأدنى للرهان في التحديات'),
('challenges', 'max_stake', '10000', 'الحد الأقصى للرهان في التحديات'),
('challenges', 'daily_challenge_limit', '10', 'الحد الأقصى للتحديات اليومية'),
('challenges', 'challenge_expire_hours', '24', 'مدة صلاحية التحدي (ساعات)'),
-- Guilds settings
('guilds', 'enabled', 'true', 'تفعيل الجيلدات'),
('guilds', 'creation_cost', '0', 'تكلفة إنشاء جيلد (نقاط)'),
('guilds', 'min_level_to_create', '0', 'الحد الأدنى لمستوى اللاعب لإنشاء جيلد'),
('guilds', 'max_members_default', '30', 'الحد الأقصى للأعضاء في الجيلد'),
-- Evolution settings
('evolution', 'enabled', 'true', 'تفعيل تطوير البطاقات'),
('evolution', 'max_level', '5', 'المستوى الأقصى للتطوير'),
('evolution', 'level_2_cost', '200', 'تكلفة تطوير المستوى 2'),
('evolution', 'level_3_cost', '500', 'تكلفة تطوير المستوى 3'),
('evolution', 'level_4_cost', '1000', 'تكلفة تطوير المستوى 4'),
('evolution', 'level_5_cost', '2000', 'تكلفة تطوير المستوى 5'),
('evolution', 'level_2_copies', '2', 'نسخ مطلوبة للمستوى 2'),
('evolution', 'level_3_copies', '3', 'نسخ مطلوبة للمستوى 3'),
('evolution', 'level_4_copies', '4', 'نسخ مطلوبة للمستوى 4'),
('evolution', 'level_5_copies', '5', 'نسخ مطلوبة للمستوى 5'),
-- Quests settings
('quests', 'daily_login_reward_day1', '50', 'مكافأة اليوم 1'),
('quests', 'daily_login_reward_day2', '75', 'مكافأة اليوم 2'),
('quests', 'daily_login_reward_day3', '100', 'مكافأة اليوم 3'),
('quests', 'daily_login_reward_day4', '125', 'مكافأة اليوم 4'),
('quests', 'daily_login_reward_day5', '150', 'مكافأة اليوم 5'),
('quests', 'daily_login_reward_day6', '200', 'مكافأة اليوم 6'),
('quests', 'daily_login_reward_day7', '300', 'مكافأة اليوم 7'),
-- Seasonal events settings
('seasonal', 'enabled', 'true', 'تفعيل الأحداث الموسمية'),
-- Notifications settings
('notifications', 'enabled', 'true', 'تفعيل الإشعارات'),
('notifications', 'challenge_notifications', 'true', 'إشعارات التحديات'),
('notifications', 'market_notifications', 'true', 'إشعارات السوق'),
('notifications', 'quest_notifications', 'true', 'إشعارات المهام'),
-- Balance settings
('balance', 'pvp_win_multiplier', '1.9', 'مضاعف الفوز في التحديات'),
('balance', 'evolution_bonus_percent_per_level', '20', 'نسبة مكافأة التطوير لكل مستوى'),
ON CONFLICT (category, key) DO NOTHING;

-- 5. SEASONAL EVENTS TABLE
CREATE TABLE IF NOT EXISTS seasonal_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  badge VARCHAR(10) DEFAULT '🌟',
  event_type VARCHAR(50) NOT NULL DEFAULT 'general',
  color VARCHAR(20) DEFAULT '#6366f1',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','ended','cancelled')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_participants INTEGER,
  rewards JSONB DEFAULT '[]',
  conditions JSONB DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasonal_events_status ON seasonal_events(status);
CREATE INDEX IF NOT EXISTS idx_seasonal_events_dates ON seasonal_events(start_date, end_date);

CREATE TRIGGER update_seasonal_events_updated_at
  BEFORE UPDATE ON seasonal_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE seasonal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active seasonal events" ON seasonal_events FOR SELECT USING (status = 'active' OR is_admin());
CREATE POLICY "Only admins can manage seasonal events" ON seasonal_events FOR ALL USING (is_admin());

-- 6. GUILDS TABLE
CREATE TABLE IF NOT EXISTS guilds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  tag VARCHAR(5) NOT NULL UNIQUE,
  description TEXT,
  badge VARCHAR(10) DEFAULT '🏰',
  color VARCHAR(20) DEFAULT '#6366f1',
  leader_id UUID REFERENCES players(id) ON DELETE SET NULL,
  max_members INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_winnings NUMERIC(15,2) NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT guild_tag_uppercase CHECK (tag = UPPER(tag)),
  CONSTRAINT guild_name_length CHECK (LENGTH(TRIM(name)) >= 2)
);

CREATE INDEX IF NOT EXISTS idx_guilds_leader ON guilds(leader_id);
CREATE INDEX IF NOT EXISTS idx_guilds_active ON guilds(is_active);

CREATE TRIGGER update_guilds_updated_at
  BEFORE UPDATE ON guilds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Guild memberships
CREATE TABLE IF NOT EXISTS guild_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('leader','officer','member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id)
);

CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_player ON guild_members(player_id);

ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view guilds" ON guilds FOR SELECT USING (true);
CREATE POLICY "Admins can manage guilds" ON guilds FOR ALL USING (is_admin());
CREATE POLICY "Players can create guilds" ON guilds FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view guild members" ON guild_members FOR SELECT USING (true);
CREATE POLICY "Players can join guilds" ON guild_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can leave" ON guild_members FOR DELETE USING (player_id = get_player_id() OR is_admin());

-- 7. PVP CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS pvp_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  stake NUMERIC(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','completed','expired','cancelled')),
  winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  message TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT different_players CHECK (challenger_id != challenged_id),
  CONSTRAINT positive_stake CHECK (stake > 0)
);

CREATE INDEX IF NOT EXISTS idx_pvp_challenger ON pvp_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_pvp_challenged ON pvp_challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_pvp_status ON pvp_challenges(status);

ALTER TABLE pvp_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players see own challenges" ON pvp_challenges FOR SELECT USING (challenger_id = get_player_id() OR challenged_id = get_player_id() OR is_admin());
CREATE POLICY "Players can create challenges" ON pvp_challenges FOR INSERT WITH CHECK (challenger_id = get_player_id());
CREATE POLICY "Players can update own challenges" ON pvp_challenges FOR UPDATE USING (challenged_id = get_player_id() OR is_admin());

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS player_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  icon VARCHAR(10) DEFAULT '🔔',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_player ON player_notifications(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON player_notifications(player_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON player_notifications(created_at DESC);

ALTER TABLE player_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players see own notifications" ON player_notifications FOR SELECT USING (player_id = get_player_id() OR is_admin());
CREATE POLICY "System can insert notifications" ON player_notifications FOR INSERT WITH CHECK (is_admin() OR true);
CREATE POLICY "Players can mark read" ON player_notifications FOR UPDATE USING (player_id = get_player_id());
CREATE POLICY "Players can delete own" ON player_notifications FOR DELETE USING (player_id = get_player_id());

-- 9. SYSTEM NOTIFICATIONS (admin broadcast)
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  icon VARCHAR(10) DEFAULT '📢',
  target_type VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (target_type IN ('all','specific')),
  target_player_ids UUID[] DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage system notifications" ON system_notifications FOR ALL USING (is_admin());
CREATE POLICY "Players see active system notifications" ON system_notifications FOR SELECT USING (is_active = true AND (target_type = 'all' OR get_player_id() = ANY(target_player_ids)));

-- 10. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','registration','active','completed','cancelled')),
  tournament_type VARCHAR(50) NOT NULL DEFAULT 'single_elimination',
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_participants INTEGER NOT NULL DEFAULT 64,
  entry_fee NUMERIC(15,2) NOT NULL DEFAULT 0,
  prizes JSONB DEFAULT '[]',
  rules JSONB DEFAULT '{}',
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Admins manage tournaments" ON tournaments FOR ALL USING (is_admin());

-- 11. ADMIN ACTION AUDIT (extended)
ALTER TABLE audit_logs ALTER COLUMN action TYPE TEXT;

-- ============================================================
-- AUTHENTICATION FUNCTIONS (Username + Password)
-- ============================================================

-- Register new player with password
CREATE OR REPLACE FUNCTION register_player_with_password(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username_normalized TEXT;
  v_player players%ROWTYPE;
  v_recovery_code TEXT;
  v_initial_balance NUMERIC;
BEGIN
  -- Trim and normalize
  p_username := TRIM(p_username);
  v_username_normalized := LOWER(p_username);
  
  -- Validate username
  IF LENGTH(p_username) < 2 THEN
    RETURN jsonb_build_object('success', false, 'message', 'اسم المستخدم يجب أن يكون حرفين على الأقل');
  END IF;
  IF LENGTH(p_username) > 30 THEN
    RETURN jsonb_build_object('success', false, 'message', 'اسم المستخدم يجب أن يكون 30 حرفاً كحد أقصى');
  END IF;
  IF p_username ~ '[^a-zA-Z0-9_\u0600-\u06FF\s]' THEN
    RETURN jsonb_build_object('success', false, 'message', 'اسم المستخدم يحتوي على رموز غير مسموحة');
  END IF;
  
  -- Validate password
  IF LENGTH(p_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'message', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  END IF;
  
  -- Check if username exists
  IF EXISTS (SELECT 1 FROM players WHERE username_normalized = v_username_normalized) THEN
    RETURN jsonb_build_object('success', false, 'message', 'اسم المستخدم مستخدم بالفعل، اختر اسماً آخر');
  END IF;
  
  -- Get initial balance from settings
  SELECT COALESCE((value::TEXT)::NUMERIC, 500)
  INTO v_initial_balance
  FROM game_settings WHERE category = 'auth' AND key = 'initial_balance';
  v_initial_balance := COALESCE(v_initial_balance, 500);
  
  -- Generate recovery code
  v_recovery_code := UPPER(
    SUBSTRING(md5(random()::text || p_username) FROM 1 FOR 4) || '-' ||
    SUBSTRING(md5(random()::text || NOW()::text) FROM 1 FOR 4) || '-' ||
    SUBSTRING(md5(random()::text) FROM 1 FOR 4)
  );
  
  -- Insert player with hashed password
  INSERT INTO players (
    username, username_normalized, balance,
    password_hash, recovery_code, account_status
  ) VALUES (
    p_username, v_username_normalized, v_initial_balance,
    crypt(p_password, gen_salt('bf', 10)), v_recovery_code, 'active'
  )
  RETURNING * INTO v_player;
  
  -- Record initial balance transaction
  INSERT INTO transactions (
    player_id, transaction_type, amount,
    balance_before, balance_after, description
  ) VALUES (
    v_player.id, 'initial_balance', v_initial_balance,
    0, v_initial_balance, 'رصيد ترحيبي للاعب الجديد'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'player', row_to_json(v_player),
    'is_new', true
  );
END;
$$;

-- Login player with username + password
CREATE OR REPLACE FUNCTION login_player_with_password(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player players%ROWTYPE;
BEGIN
  p_username := LOWER(TRIM(p_username));
  
  -- Find player
  SELECT * INTO v_player
  FROM players
  WHERE username_normalized = p_username;
  
  IF NOT FOUND THEN
    -- Return generic error to prevent username enumeration
    RETURN jsonb_build_object('success', false, 'message', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  END IF;
  
  -- Check account status
  IF v_player.account_status = 'banned' THEN
    RETURN jsonb_build_object('success', false, 'message', 'تم حظر هذا الحساب. تواصل مع الدعم');
  END IF;
  IF v_player.account_status = 'suspended' THEN
    RETURN jsonb_build_object('success', false, 'message', 'هذا الحساب معلق مؤقتاً');
  END IF;
  
  -- Check if player has password
  IF v_player.password_hash IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'هذا الحساب لا يملك كلمة مرور. استخدم رمز الاسترداد لتعيين كلمة مرور جديدة',
      'needs_password_setup', true
    );
  END IF;
  
  -- Verify password
  IF NOT (v_player.password_hash = crypt(p_password, v_player.password_hash)) THEN
    RETURN jsonb_build_object('success', false, 'message', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  END IF;
  
  -- Update last active
  UPDATE players SET last_active_at = NOW() WHERE id = v_player.id;
  SELECT * INTO v_player FROM players WHERE id = v_player.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'player', row_to_json(v_player),
    'is_new', false
  );
END;
$$;

-- Set password after recovery code verification
CREATE OR REPLACE FUNCTION set_password_with_recovery(
  p_username TEXT,
  p_recovery_code TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player players%ROWTYPE;
BEGIN
  p_username := LOWER(TRIM(p_username));
  p_recovery_code := UPPER(TRIM(p_recovery_code));
  
  -- Find player by username
  SELECT * INTO v_player
  FROM players
  WHERE username_normalized = p_username;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'اسم المستخدم أو رمز الاسترداد غير صحيح');
  END IF;
  
  -- Verify recovery code
  IF v_player.recovery_code != p_recovery_code THEN
    RETURN jsonb_build_object('success', false, 'message', 'اسم المستخدم أو رمز الاسترداد غير صحيح');
  END IF;
  
  -- Validate new password
  IF LENGTH(p_new_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'message', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  END IF;
  
  -- Set new password and generate new recovery code
  UPDATE players
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf', 10)),
    recovery_code = UPPER(
      SUBSTRING(md5(random()::text) FROM 1 FOR 4) || '-' ||
      SUBSTRING(md5(random()::text) FROM 1 FOR 4) || '-' ||
      SUBSTRING(md5(random()::text) FROM 1 FOR 4)
    ),
    last_active_at = NOW()
  WHERE id = v_player.id;
  
  SELECT * INTO v_player FROM players WHERE id = v_player.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'player', row_to_json(v_player),
    'message', 'تم تعيين كلمة المرور بنجاح'
  );
END;
$$;

-- Old quick_login_or_register kept for backward compatibility but disabled
-- New function replaces it
CREATE OR REPLACE FUNCTION quick_login_or_register(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'تسجيل الدخول بالاسم فقط لم يعد مدعوماً. يرجى استخدام اسم المستخدم وكلمة المرور',
    'requires_password', true
  );
END;
$$;

-- ============================================================
-- ADMIN MANAGEMENT FUNCTIONS
-- ============================================================

-- Get all game settings
CREATE OR REPLACE FUNCTION admin_get_settings(p_admin_id UUID, p_category TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin admins%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM admins WHERE id = p_admin_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'غير مصرح');
  END IF;
  
  IF p_category IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'settings', (SELECT jsonb_object_agg(key, value) FROM game_settings WHERE category = p_category)
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'settings', (SELECT jsonb_object_agg(category || '.' || key, value) FROM game_settings)
    );
  END IF;
END;
$$;

-- Update a game setting
CREATE OR REPLACE FUNCTION admin_update_setting(
  p_admin_id UUID,
  p_category TEXT,
  p_key TEXT,
  p_value JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin admins%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM admins WHERE id = p_admin_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'غير مصرح');
  END IF;
  
  INSERT INTO game_settings (category, key, value, updated_by)
  VALUES (p_category, p_key, p_value, p_admin_id)
  ON CONFLICT (category, key) DO UPDATE
    SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW();
  
  -- Audit log
  INSERT INTO audit_logs (admin_id, action, target_type, details)
  VALUES (p_admin_id, 'setting_updated', 'game_setting',
    jsonb_build_object('category', p_category, 'key', p_key, 'new_value', p_value));
  
  RETURN jsonb_build_object('success', true, 'message', 'تم حفظ الإعداد');
END;
$$;

-- Send system notification
CREATE OR REPLACE FUNCTION admin_send_notification(
  p_admin_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_icon TEXT DEFAULT '📢',
  p_target_type TEXT DEFAULT 'all',
  p_target_player_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin admins%ROWTYPE;
  v_notif_id UUID;
  v_player_id UUID;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_admin FROM admins WHERE id = p_admin_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'غير مصرح');
  END IF;
  
  INSERT INTO system_notifications (title, message, icon, target_type, target_player_ids, created_by, sent_at)
  VALUES (p_title, p_message, p_icon, p_target_type, p_target_player_ids, p_admin_id, NOW())
  RETURNING id INTO v_notif_id;
  
  -- Create individual notifications
  IF p_target_type = 'all' THEN
    INSERT INTO player_notifications (player_id, type, title, message, icon, metadata)
    SELECT id, 'system', p_title, p_message, p_icon, jsonb_build_object('system_notif_id', v_notif_id)
    FROM players WHERE account_status = 'active';
    GET DIAGNOSTICS v_count = ROW_COUNT;
  ELSIF p_target_type = 'specific' AND p_target_player_ids IS NOT NULL THEN
    INSERT INTO player_notifications (player_id, type, title, message, icon, metadata)
    SELECT unnest(p_target_player_ids), 'system', p_title, p_message, p_icon, jsonb_build_object('system_notif_id', v_notif_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'sent_to', v_count, 'notification_id', v_notif_id);
END;
$$;

-- Get admin dashboard stats
CREATE OR REPLACE FUNCTION admin_get_dashboard_stats(p_admin_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin admins%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM admins WHERE id = p_admin_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'غير مصرح');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'stats', jsonb_build_object(
      'total_players', (SELECT COUNT(*) FROM players WHERE account_status = 'active'),
      'total_bets', (SELECT COUNT(*) FROM bets),
      'total_events', (SELECT COUNT(*) FROM events),
      'open_events', (SELECT COUNT(*) FROM events WHERE status = 'open'),
      'total_guilds', (SELECT COUNT(*) FROM guilds WHERE is_active = true),
      'pending_challenges', (SELECT COUNT(*) FROM pvp_challenges WHERE status = 'pending'),
      'active_seasonal', (SELECT COUNT(*) FROM seasonal_events WHERE status = 'active'),
      'players_with_password', (SELECT COUNT(*) FROM players WHERE password_hash IS NOT NULL),
      'players_without_password', (SELECT COUNT(*) FROM players WHERE password_hash IS NULL)
    )
  );
END;
$$;
