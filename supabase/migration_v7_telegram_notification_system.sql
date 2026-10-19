-- ==============================================================================
-- Migration v7: Comprehensive Telegram Notification System
-- WuWa Betting (Solaris World)
-- ==============================================================================

-- 1. Telegram Subscribers Table
CREATE TABLE IF NOT EXISTS public.telegram_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  preferences JSONB DEFAULT '{
    "bosses": true,
    "cards": true,
    "box_cards": true,
    "boxes": true,
    "events": true,
    "shop": true,
    "announcements": true
  }'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  blocked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tg_subscribers_chat_id ON public.telegram_subscribers (chat_id);
CREATE INDEX IF NOT EXISTS idx_tg_subscribers_is_active ON public.telegram_subscribers (is_active);

-- 2. System-wide Notification Settings Table
CREATE TABLE IF NOT EXISTS public.telegram_notification_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bosses_enabled BOOLEAN DEFAULT true NOT NULL,
  cards_enabled BOOLEAN DEFAULT true NOT NULL,
  box_cards_enabled BOOLEAN DEFAULT true NOT NULL,
  boxes_enabled BOOLEAN DEFAULT true NOT NULL,
  events_enabled BOOLEAN DEFAULT true NOT NULL,
  shop_enabled BOOLEAN DEFAULT true NOT NULL,
  announcements_enabled BOOLEAN DEFAULT true NOT NULL,
  bot_active BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

INSERT INTO public.telegram_notification_settings (id, bosses_enabled, cards_enabled, box_cards_enabled, boxes_enabled, events_enabled, shop_enabled, announcements_enabled, bot_active)
VALUES (1, true, true, true, true, true, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Telegram Notifications Queue Table (Outbox Pattern)
CREATE TABLE IF NOT EXISTS public.telegram_notifications_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'bosses', 'cards', 'box_cards', 'boxes', 'events', 'shop', 'announcements'
  entity_id TEXT UNIQUE,     -- Idempotency key (e.g. 'boss:<uuid>', 'card:<uuid>')
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  photo_url TEXT,
  button_text TEXT,
  button_url TEXT,
  target_category TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  scheduled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  processed_at TIMESTAMPTZ,
  total_recipients INT DEFAULT 0 NOT NULL,
  success_count INT DEFAULT 0 NOT NULL,
  failure_count INT DEFAULT 0 NOT NULL,
  created_by_admin UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tg_queue_status_sched ON public.telegram_notifications_queue (status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tg_queue_created_at ON public.telegram_notifications_queue (created_at DESC);

-- 4. Telegram Delivery Logs Table (Tracks per-user send status)
CREATE TABLE IF NOT EXISTS public.telegram_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.telegram_notifications_queue(id) ON DELETE CASCADE NOT NULL,
  subscriber_id UUID REFERENCES public.telegram_subscribers(id) ON DELETE CASCADE NOT NULL,
  chat_id BIGINT NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'failed'
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_tg_delivery_recipient UNIQUE (notification_id, subscriber_id)
);

CREATE INDEX IF NOT EXISTS idx_tg_delivery_notif_status ON public.telegram_delivery_logs (notification_id, status);

-- Enable RLS on newly created tables
ALTER TABLE public.telegram_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_notifications_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to notification settings (for frontend inspection)
DROP POLICY IF EXISTS "Public read notification settings" ON public.telegram_notification_settings;
CREATE POLICY "Public read notification settings" ON public.telegram_notification_settings
  FOR SELECT USING (true);

-- Allow public read on queue for stats / display
DROP POLICY IF EXISTS "Public read queue" ON public.telegram_notifications_queue;
CREATE POLICY "Public read queue" ON public.telegram_notifications_queue
  FOR SELECT USING (true);

-- Allow public read on delivery logs for stats
DROP POLICY IF EXISTS "Public read delivery logs" ON public.telegram_delivery_logs;
CREATE POLICY "Public read delivery logs" ON public.telegram_delivery_logs
  FOR SELECT USING (true);

-- RPC 1: Upsert Subscriber (Called on /start)
CREATE OR REPLACE FUNCTION public.telegram_upsert_subscriber(
  p_chat_id BIGINT,
  p_username TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub RECORD;
BEGIN
  INSERT INTO public.telegram_subscribers (
    chat_id, username, first_name, is_active, updated_at
  ) VALUES (
    p_chat_id, p_username, p_first_name, true, now()
  )
  ON CONFLICT (chat_id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, public.telegram_subscribers.username),
    first_name = COALESCE(EXCLUDED.first_name, public.telegram_subscribers.first_name),
    is_active = true,
    blocked_at = NULL,
    updated_at = now()
  RETURNING * INTO v_sub;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_sub.id,
    'chat_id', v_sub.chat_id,
    'is_active', v_sub.is_active,
    'preferences', v_sub.preferences
  );
END;
$$;

-- RPC 2: Update Preferences
CREATE OR REPLACE FUNCTION public.telegram_update_preferences(
  p_chat_id BIGINT,
  p_preferences JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub RECORD;
BEGIN
  UPDATE public.telegram_subscribers
  SET preferences = p_preferences, updated_at = now()
  WHERE chat_id = p_chat_id
  RETURNING * INTO v_sub;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'المشترك غير موجود');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'preferences', v_sub.preferences
  );
END;
$$;

-- RPC 3: Toggle Subscription Status (Stop / Resume all)
CREATE OR REPLACE FUNCTION public.telegram_toggle_subscription(
  p_chat_id BIGINT,
  p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.telegram_subscribers
  SET is_active = p_is_active,
      blocked_at = CASE WHEN p_is_active THEN NULL ELSE blocked_at END,
      updated_at = now()
  WHERE chat_id = p_chat_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'المشترك غير موجود');
  END IF;

  RETURN jsonb_build_object('success', true, 'is_active', p_is_active);
END;
$$;

-- RPC 4: Mark Subscriber as Blocked (Called on 403 / Bot Blocked)
CREATE OR REPLACE FUNCTION public.telegram_mark_blocked(
  p_chat_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.telegram_subscribers
  SET is_active = false, blocked_at = now(), updated_at = now()
  WHERE chat_id = p_chat_id;
END;
$$;

-- RPC 5: Get Pending Notifications (For Bot Worker)
CREATE OR REPLACE FUNCTION public.telegram_get_pending_notifications(
  p_limit INT DEFAULT 5
)
RETURNS SETOF public.telegram_notifications_queue
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.telegram_notifications_queue
  WHERE status = 'pending' AND scheduled_at <= now()
  ORDER BY scheduled_at ASC
  LIMIT p_limit;
$$;

-- RPC 6: Claim Notification for Processing
CREATE OR REPLACE FUNCTION public.telegram_claim_notification(
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claimed BOOLEAN := false;
BEGIN
  UPDATE public.telegram_notifications_queue
  SET status = 'processing', processed_at = now()
  WHERE id = p_notification_id AND status = 'pending';

  IF FOUND THEN
    v_claimed := true;
  END IF;

  RETURN v_claimed;
END;
$$;

-- RPC 7: Get Eligible Subscribers for a Notification
CREATE OR REPLACE FUNCTION public.telegram_get_eligible_subscribers(
  p_notification_id UUID,
  p_target_category TEXT
)
RETURNS TABLE (
  subscriber_id UUID,
  chat_id BIGINT,
  first_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT s.id, s.chat_id, s.first_name
  FROM public.telegram_subscribers s
  WHERE s.is_active = true
    AND (
      p_target_category = 'all'
      OR (s.preferences->>p_target_category)::boolean = true
      OR s.preferences->>p_target_category IS NULL
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.telegram_delivery_logs l
      WHERE l.notification_id = p_notification_id
        AND l.subscriber_id = s.id
        AND l.status = 'sent'
    );
$$;

-- RPC 8: Log Single Delivery Result
CREATE OR REPLACE FUNCTION public.telegram_log_delivery(
  p_notification_id UUID,
  p_subscriber_id UUID,
  p_chat_id BIGINT,
  p_status TEXT,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.telegram_delivery_logs (
    notification_id, subscriber_id, chat_id, status, error_message, sent_at
  ) VALUES (
    p_notification_id, p_subscriber_id, p_chat_id, p_status, p_error, now()
  )
  ON CONFLICT (notification_id, subscriber_id) DO UPDATE SET
    status = EXCLUDED.status,
    error_message = EXCLUDED.error_message,
    sent_at = now();

  IF p_status = 'sent' THEN
    UPDATE public.telegram_notifications_queue
    SET success_count = success_count + 1
    WHERE id = p_notification_id;
  ELSE
    UPDATE public.telegram_notifications_queue
    SET failure_count = failure_count + 1
    WHERE id = p_notification_id;
  END IF;
END;
$$;

-- RPC 9: Complete Notification Task
CREATE OR REPLACE FUNCTION public.telegram_complete_notification(
  p_notification_id UUID,
  p_status TEXT,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.telegram_notifications_queue
  SET status = p_status,
      error_message = p_error,
      processed_at = now()
  WHERE id = p_notification_id;
END;
$$;

-- RPC 10: Get Telegram Statistics (For Admin Panel)
CREATE OR REPLACE FUNCTION public.get_telegram_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_subs INT := 0;
  v_active_subs INT := 0;
  v_unsubscribed INT := 0;
  v_sent_count BIGINT := 0;
  v_fail_count BIGINT := 0;
  v_pending_count INT := 0;
  v_settings RECORD;
BEGIN
  SELECT count(*) INTO v_total_subs FROM public.telegram_subscribers;
  SELECT count(*) INTO v_active_subs FROM public.telegram_subscribers WHERE is_active = true;
  SELECT count(*) INTO v_unsubscribed FROM public.telegram_subscribers WHERE is_active = false;
  
  SELECT COALESCE(sum(success_count), 0), COALESCE(sum(failure_count), 0)
  INTO v_sent_count, v_fail_count
  FROM public.telegram_notifications_queue;

  SELECT count(*) INTO v_pending_count
  FROM public.telegram_notifications_queue
  WHERE status IN ('pending', 'processing');

  SELECT * INTO v_settings FROM public.telegram_notification_settings WHERE id = 1;

  RETURN jsonb_build_object(
    'total_subscribers', v_total_subs,
    'active_subscribers', v_active_subs,
    'unsubscribed', v_unsubscribed,
    'total_sent', v_sent_count,
    'total_failed', v_fail_count,
    'pending_notifications', v_pending_count,
    'settings', to_jsonb(v_settings)
  );
END;
$$;

-- RPC 11: Admin Send Telegram Announcement
CREATE OR REPLACE FUNCTION public.admin_send_telegram_broadcast(
  p_admin_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_photo_url TEXT DEFAULT NULL,
  p_button_text TEXT DEFAULT NULL,
  p_button_url TEXT DEFAULT NULL,
  p_target_category TEXT DEFAULT 'announcements',
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
  v_notif_id UUID;
  v_sched TIMESTAMPTZ;
  v_total_eligible INT := 0;
BEGIN
  -- Verify Admin
  SELECT * INTO v_admin FROM public.admins WHERE id = p_admin_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'صلاحيات الإدارة غير متوفرة');
  END IF;

  IF p_title IS NULL OR TRIM(p_title) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'عنوان الإعلان مطلوب');
  END IF;

  IF p_message IS NULL OR TRIM(p_message) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'نص الرسالة مطلوب');
  END IF;

  v_sched := COALESCE(p_scheduled_at, now());

  -- Estimate eligible recipients
  SELECT count(*) INTO v_total_eligible
  FROM public.telegram_subscribers
  WHERE is_active = true
    AND (
      p_target_category = 'all'
      OR (preferences->>p_target_category)::boolean = true
      OR preferences->>p_target_category IS NULL
    );

  INSERT INTO public.telegram_notifications_queue (
    event_type,
    entity_id,
    title,
    message,
    photo_url,
    button_text,
    button_url,
    target_category,
    status,
    scheduled_at,
    total_recipients,
    created_by_admin
  ) VALUES (
    'manual_announcement',
    'announcement:' || gen_random_uuid(),
    TRIM(p_title),
    TRIM(p_message),
    p_photo_url,
    COALESCE(p_button_text, '🌐 زيارة الموقع'),
    COALESCE(p_button_url, 'https://wuwa-betting.netlify.app'),
    p_target_category,
    'pending',
    v_sched,
    v_total_eligible,
    p_admin_id
  ) RETURNING id INTO v_notif_id;

  RETURN jsonb_build_object(
    'success', true,
    'notification_id', v_notif_id,
    'total_recipients', v_total_eligible,
    'message', 'تمت جدولة/إضافة الإعلان لقائمة إرسال التلجرام بنجاح! 🚀'
  );
END;
$$;

-- RPC 12: Admin Retry Failed Deliveries for a Notification
CREATE OR REPLACE FUNCTION public.admin_retry_telegram_notification(
  p_admin_id UUID,
  p_notification_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
  v_notif RECORD;
BEGIN
  SELECT * INTO v_admin FROM public.admins WHERE id = p_admin_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'صلاحيات الإدارة غير متوفرة');
  END IF;

  SELECT * INTO v_notif FROM public.telegram_notifications_queue WHERE id = p_notification_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'الإشعار غير موجود');
  END IF;

  -- Delete failed delivery logs so they become eligible again
  DELETE FROM public.telegram_delivery_logs
  WHERE notification_id = p_notification_id AND status = 'failed';

  -- Reset failure count and set status back to pending
  UPDATE public.telegram_notifications_queue
  SET status = 'pending',
      failure_count = 0,
      error_message = NULL,
      scheduled_at = now()
  WHERE id = p_notification_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تمت إعادة محاولة إرسال الرسائل الفاشلة بنجاح! 🔄'
  );
END;
$$;

-- RPC 13: Admin Update System Notification Settings
CREATE OR REPLACE FUNCTION public.admin_update_telegram_settings(
  p_admin_id UUID,
  p_settings JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT * INTO v_admin FROM public.admins WHERE id = p_admin_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'صلاحيات الإدارة غير متوفرة');
  END IF;

  UPDATE public.telegram_notification_settings
  SET
    bosses_enabled = COALESCE((p_settings->>'bosses_enabled')::boolean, bosses_enabled),
    cards_enabled = COALESCE((p_settings->>'cards_enabled')::boolean, cards_enabled),
    box_cards_enabled = COALESCE((p_settings->>'box_cards_enabled')::boolean, box_cards_enabled),
    boxes_enabled = COALESCE((p_settings->>'boxes_enabled')::boolean, boxes_enabled),
    events_enabled = COALESCE((p_settings->>'events_enabled')::boolean, events_enabled),
    shop_enabled = COALESCE((p_settings->>'shop_enabled')::boolean, shop_enabled),
    announcements_enabled = COALESCE((p_settings->>'announcements_enabled')::boolean, announcements_enabled),
    bot_active = COALESCE((p_settings->>'bot_active')::boolean, bot_active),
    updated_at = now()
  WHERE id = 1;

  RETURN jsonb_build_object('success', true, 'message', 'تم تحديث إعدادات إشعارات التلجرام بنجاح! ⚙️');
END;
$$;

-- ==============================================================================
-- AUTOMATIC EVENT TRIGGERS
-- ==============================================================================

-- Trigger Function A: New Boss Created
CREATE OR REPLACE FUNCTION public.trg_notify_telegram_new_boss()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enabled BOOLEAN;
  v_photo TEXT;
  v_msg TEXT;
  v_title TEXT;
BEGIN
  -- Only trigger on brand new insert or when activated from inactive
  SELECT bosses_enabled INTO v_enabled FROM public.telegram_notification_settings WHERE id = 1;
  IF v_enabled IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  v_photo := COALESCE(NEW.cover_image_url, NEW.avatar_url, NEW.banner_url);
  IF v_photo IS NOT NULL AND v_photo NOT LIKE 'http%' THEN
    v_photo := 'https://wuwa-betting.netlify.app' || v_photo;
  END IF;

  v_title := '🐉 تهديد جديد في Solaris!';
  v_msg := '⚔️ **ظهور زعيم أسطوري جديد!**' || E'\n\n' ||
           '👑 **الاسم:** ' || COALESCE(NEW.name_ar, NEW.name) || E'\n' ||
           '🔥 **اللقب:** ' || COALESCE(NEW.title, 'زعيم كوني') || E'\n' ||
           '⚡ **الصعوبة:** ' || COALESCE(NEW.difficulty, 'Nightmare') || E'\n' ||
           '🛡️ **نقاط الحياة (HP):** ' || COALESCE(NEW.hp, 10000)::text || E'\n' ||
           '💰 **مكافأة النصر:** ' || COALESCE(NEW.win_points, 500)::text || ' نقطة' || E'\n\n' ||
           COALESCE(NEW.description, 'جهّز بطاقاتك وادخل حلبة التحدي لمواجهة الزعيم وإثبات جدارتك!') || E'\n\n' ||
           '✨ ادخل الآن وكن أول من يحقق الانتصار!';

  INSERT INTO public.telegram_notifications_queue (
    event_type, entity_id, title, message, photo_url, button_text, button_url, target_category
  ) VALUES (
    'new_boss',
    'boss:' || NEW.id,
    v_title,
    v_msg,
    v_photo,
    '🔥 تحدَّ الزعيم في الموقع',
    'https://wuwa-betting.netlify.app/bosses',
    'bosses'
  )
  ON CONFLICT (entity_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_telegram_boss_insert ON public.bosses;
CREATE TRIGGER trg_telegram_boss_insert
  AFTER INSERT ON public.bosses
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_telegram_new_boss();

-- Trigger Function B: New Card Created
CREATE OR REPLACE FUNCTION public.trg_notify_telegram_new_card()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enabled BOOLEAN;
  v_photo TEXT;
  v_msg TEXT;
  v_title TEXT;
  v_rarity_ar TEXT;
BEGIN
  IF NEW.is_published IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT cards_enabled INTO v_enabled FROM public.telegram_notification_settings WHERE id = 1;
  IF v_enabled IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  v_photo := NEW.image_path;
  IF v_photo IS NOT NULL AND v_photo NOT LIKE 'http%' THEN
    v_photo := 'https://wuwa-betting.netlify.app' || v_photo;
  END IF;

  CASE NEW.rarity::text
    WHEN 'mythic' THEN v_rarity_ar := 'خرافية 5★ (Mythic)';
    WHEN 'legendary' THEN v_rarity_ar := 'أسطورية 4★ (Legendary)';
    WHEN 'epic' THEN v_rarity_ar := 'ملحمية 3★ (Epic)';
    WHEN 'rare' THEN v_rarity_ar := 'نادرة 2★ (Rare)';
    ELSE v_rarity_ar := 'عادية 1★ (Common)';
  END CASE;

  v_title := '🃏 بطاقة جديدة وصلت إلى Solaris!';
  v_msg := '✨ **تمت إضافة بطاقة جديدة إلى المجموعة!**' || E'\n\n' ||
           '🎴 **الاسم:** ' || NEW.name || E'\n' ||
           '⭐ **الندرة:** ' || v_rarity_ar || E'\n' ||
           '🌀 **العنصر:** ' || COALESCE(NEW.element, 'Spectro') || E'\n' ||
           CASE WHEN NEW.title IS NOT NULL THEN '📜 **الوصف الشرفي:** ' || NEW.title || E'\n' ELSE '' END ||
           E'\n' || COALESCE(NEW.description, 'اكتشف قدرات البطاقة وإحصائياتها الكاملة داخل الموقع!') || E'\n\n' ||
           '🎯 متوفرة الآن في المنصة وصناديق السحب!';

  INSERT INTO public.telegram_notifications_queue (
    event_type, entity_id, title, message, photo_url, button_text, button_url, target_category
  ) VALUES (
    'new_card',
    'card:' || NEW.id,
    v_title,
    v_msg,
    v_photo,
    '🎴 استعرض البطاقة في الخزينة',
    'https://wuwa-betting.netlify.app/collection',
    'cards'
  )
  ON CONFLICT (entity_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_telegram_card_insert ON public.cards;
CREATE TRIGGER trg_telegram_card_insert
  AFTER INSERT ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_telegram_new_card();

-- Trigger Function C: New Box Created
CREATE OR REPLACE FUNCTION public.trg_notify_telegram_new_box()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enabled BOOLEAN;
  v_photo TEXT;
  v_msg TEXT;
  v_title TEXT;
BEGIN
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT boxes_enabled INTO v_enabled FROM public.telegram_notification_settings WHERE id = 1;
  IF v_enabled IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  v_photo := NEW.image_url;
  IF v_photo IS NOT NULL AND v_photo NOT LIKE 'http%' THEN
    v_photo := 'https://wuwa-betting.netlify.app' || v_photo;
  END IF;

  v_title := '🎁 صندوق سحب جديد في الساحة!';
  v_msg := '🎉 **تم إطلاق صندوق سحب جديد!**' || E'\n\n' ||
           '📦 **اسم الصندوق:** ' || COALESCE(NEW.name_ar, NEW.name) || E'\n' ||
           '💰 **سعر السحبة الفردية:** ' || NEW.price::text || ' نقطة' || E'\n' ||
           CASE WHEN NEW.multi_price IS NOT NULL THEN '💎 **سعر سحب 10x:** ' || NEW.multi_price::text || ' نقطة' || E'\n' ELSE '' END ||
           '🛡️ **نظام الضمان (Pity):** ضمان ' || COALESCE(NEW.guaranteed_rarity, 'epic') || ' كل ' || COALESCE(NEW.pity_threshold, 10)::text || ' سحبات' || E'\n\n' ||
           COALESCE(NEW.description_ar, 'جرّب حظك الآن واحصل على أندر البطاقات لتعزيز مجموعتك القتالية!') || E'\n\n' ||
           '🚀 متاح الآن في متجر الصناديق!';

  INSERT INTO public.telegram_notifications_queue (
    event_type, entity_id, title, message, photo_url, button_text, button_url, target_category
  ) VALUES (
    'new_box',
    'box:' || NEW.id,
    v_title,
    v_msg,
    v_photo,
    '🎁 افتح الصندوق في الموقع',
    'https://wuwa-betting.netlify.app/boxes',
    'boxes'
  )
  ON CONFLICT (entity_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_telegram_box_insert ON public.boxes;
CREATE TRIGGER trg_telegram_box_insert
  AFTER INSERT ON public.boxes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_telegram_new_box();

-- Trigger Function D: New Event Created
CREATE OR REPLACE FUNCTION public.trg_notify_telegram_new_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enabled BOOLEAN;
  v_photo TEXT;
  v_msg TEXT;
  v_title TEXT;
  v_char_a TEXT;
  v_char_b TEXT;
BEGIN
  SELECT events_enabled INTO v_enabled FROM public.telegram_notification_settings WHERE id = 1;
  IF v_enabled IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_char_a FROM public.characters WHERE id = NEW.character_a_id;
  SELECT name INTO v_char_b FROM public.characters WHERE id = NEW.character_b_id;

  v_photo := NEW.cover_image_path;
  IF v_photo IS NOT NULL AND v_photo NOT LIKE 'http%' THEN
    v_photo := 'https://wuwa-betting.netlify.app' || v_photo;
  END IF;

  v_title := '⚔️ نزال جديد في ساحة التحدي!';
  v_msg := '🔥 **مباراة وتحدٍ جديد متاح للتوقع والمراهنة!**' || E'\n\n' ||
           '🏆 **العنوان:** ' || NEW.title || E'\n' ||
           '⚔️ **المواجهة:** ' || COALESCE(v_char_a, 'المقاتل الأول') || ' 🆚 ' || COALESCE(v_char_b, 'المقاتل الثاني') || E'\n' ||
           '📈 **المضاعف:** ' || NEW.multiplier::text || 'x' || E'\n\n' ||
           COALESCE(NEW.description, 'ضع توقعك الآن وتنافس على صدارة لوحة المتصدرين!') || E'\n\n' ||
           '⚡ لا تفوت النزال، ادخل وشارك توقعك الآن!';

  INSERT INTO public.telegram_notifications_queue (
    event_type, entity_id, title, message, photo_url, button_text, button_url, target_category
  ) VALUES (
    'new_event',
    'event:' || NEW.id,
    v_title,
    v_msg,
    v_photo,
    '⚔️ شارك توقعك في النزال',
    'https://wuwa-betting.netlify.app/events/' || NEW.id,
    'events'
  )
  ON CONFLICT (entity_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_telegram_event_insert ON public.events;
CREATE TRIGGER trg_telegram_event_insert
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_telegram_new_event();

-- Update admin_save_box to detect newly added cards and trigger box_cards notification
CREATE OR REPLACE FUNCTION public.admin_save_box(
  p_admin_id uuid,
  p_box_id uuid DEFAULT NULL::uuid,
  p_name text DEFAULT NULL::text,
  p_name_ar text DEFAULT NULL::text,
  p_description_ar text DEFAULT NULL::text,
  p_image_url text DEFAULT NULL::text,
  p_price integer DEFAULT 500,
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
  v_new_card_names TEXT[];
  v_box_cards_enabled BOOLEAN;
  v_box_photo TEXT;
  v_notif_title TEXT;
  v_notif_msg TEXT;
BEGIN
  IF p_admin_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM admins WHERE id = p_admin_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'message', 'غير مصرح');
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
    -- If updating an existing box, check for genuinely newly added cards
    IF p_box_id IS NOT NULL THEN
      SELECT array_agg(DISTINCT c.name)
      INTO v_new_card_names
      FROM jsonb_to_recordset(p_cards) AS x(card_id uuid, drop_rate_pct numeric, weight integer)
      JOIN public.cards c ON c.id = x.card_id
      WHERE x.card_id NOT IN (SELECT card_id FROM public.box_cards WHERE box_id = v_box_id);

      IF v_new_card_names IS NOT NULL AND cardinality(v_new_card_names) > 0 THEN
        SELECT box_cards_enabled INTO v_box_cards_enabled FROM public.telegram_notification_settings WHERE id = 1;
        IF v_box_cards_enabled IS TRUE THEN
          v_box_photo := p_image_url;
          IF v_box_photo IS NOT NULL AND v_box_photo NOT LIKE 'http%' THEN
            v_box_photo := 'https://wuwa-betting.netlify.app' || v_box_photo;
          END IF;

          v_notif_title := '🎁 تحديث جديد في الصناديق!';
          v_notif_msg := '🎉 **تمت إضافة بطاقات جديدة إلى صندوق ' || COALESCE(p_name_ar, 'صندوق السحب') || '!**' || E'\n\n' ||
                         '🃏 **عدد البطاقات المضافة:** ' || cardinality(v_new_card_names)::text || E'\n' ||
                         '✨ **أبرز البطاقات:** ' || array_to_string(v_new_card_names[1:5], '، ') || 
                         CASE WHEN cardinality(v_new_card_names) > 5 THEN ' وغيرها الكثير...' ELSE '' END || E'\n\n' ||
                         '🚀 جرّب سحباتك الآن واكتشف المحتويات الجديدة داخل الصندوق!';

          INSERT INTO public.telegram_notifications_queue (
            event_type, entity_id, title, message, photo_url, button_text, button_url, target_category
          ) VALUES (
            'box_cards_added',
            'box_cards:' || v_box_id || ':' || now()::text,
            v_notif_title,
            v_notif_msg,
            v_box_photo,
            '🎁 استكشف الصندوق في الموقع',
            'https://wuwa-betting.netlify.app/boxes',
            'box_cards'
          );
        END IF;
      END IF;
    END IF;

    DELETE FROM public.box_cards WHERE box_id = v_box_id;
    
    FOR v_card IN SELECT * FROM jsonb_to_recordset(p_cards) AS x(card_id uuid, drop_rate_pct numeric, weight integer)
    LOOP
      INSERT INTO public.box_cards (box_id, card_id, drop_rate_pct, weight)
      VALUES (
        v_box_id, 
        v_card.card_id, 
        COALESCE(v_card.drop_rate_pct, 1.0), 
        COALESCE(v_card.weight, 100)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'box_id', v_box_id, 'message', 'تم حفظ الصندوق بنجاح');
END;
$function$;

