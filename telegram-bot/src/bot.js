import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// 1. Configuration & Validation
// ==============================================================================
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://axaoxpeqlobiljrromun.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SITE_URL = process.env.SITE_URL || 'https://wuwa-betting.netlify.app';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
  console.warn('\n⚠️ [WuWa Bot Warning] TELEGRAM_BOT_TOKEN is not set in .env!');
  console.warn('👉 Please set TELEGRAM_BOT_TOKEN in telegram-bot/.env to start polling.\n');
}

if (!SUPABASE_KEY) {
  console.error('\n❌ [WuWa Bot Error] SUPABASE_KEY is required in .env!\n');
}

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || '', {
  auth: { persistSession: false }
});

// Category metadata definitions
const CATEGORIES = {
  bosses: { label: '🐉 الزعماء الجدد', desc: 'تنبيهات فورية عند ظهور زعماء أسطوريين وتحدياتهم' },
  cards: { label: '🃏 البطاقات الجديدة', desc: 'إشعارات بإصدار بطاقات وشخصيات جديدة في الخزينة' },
  box_cards: { label: '🎁 محتويات الصناديق', desc: 'تنبيهات عند إضافة بطاقات جديدة إلى صناديق السحب' },
  boxes: { label: '📦 الصناديق الجديدة', desc: 'إطلاق صناديق سحب جديدة ومواسم محدودة' },
  events: { label: '⚔️ النزالات والفعاليات', desc: 'مباريات وتحديات قتالية للتوقع والمراهنة' },
  shop: { label: '🛒 المتجر والمكافآت', desc: 'عروض حصرية ومقتنيات وألقاب قابلة للاقتناء' },
  announcements: { label: '📢 الإعلانات العامة', desc: 'بيانات الإدارة وأخبار المنصة الرسمية' }
};

// ==============================================================================
// 2. Telegram Bot Instance Initialization
// ==============================================================================
let bot = null;

if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
  try {
    bot = new TelegramBot(BOT_TOKEN, {
      polling: {
        autoStart: true,
        interval: 300,
        params: { timeout: 30 }
      }
    });
    console.log('✨ [WuWa Bot] Telegram polling daemon started successfully!');
  } catch (err) {
    console.error('❌ [WuWa Bot] Failed to initialize Telegram Bot:', err.message);
  }
}

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ==============================================================================
// 3. User Commands & Interactions
// ==============================================================================
if (bot) {
  // Handle /start Command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || null;
    const firstName = msg.from.first_name || 'Rover';

    try {
      // 1. Register or reactivate subscriber in Supabase
      const { data, error } = await supabase.rpc('telegram_upsert_subscriber', {
        p_chat_id: chatId,
        p_username: username,
        p_first_name: firstName
      });

      if (error) {
        console.error('Error upserting subscriber:', error.message);
      }

      // 2. Format Welcome Message
      const welcomeText = 
`🌌 **أهلاً بك في عالم Solaris!**

مرحباً بك يا **${firstName}** في بوت الإشعارات الرسمي لمنصة **WuWa Betting** ⚡

تابع آخر المستجدات وكن أول من يعرف عن:
🐉 الزعماء الأسطوريين ومكافآتهم الكبرى
🃏 البطاقات الجديدة والشخصيات الخرافية (Mythic)
🎁 تحديثات صناديق السحب والبطاقات المضافة
⚔️ نزالات ساحة التحدي والتوقعات الحماسية

اختر ما تريد استكشافه من القائمة أدناه:`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🌐 فتح موقع WuWa Betting', url: SITE_URL }
          ],
          [
            { text: '🔔 إعدادات الإشعارات', callback_data: 'settings_menu' },
            { text: '📢 آخر الأخبار', callback_data: 'latest_news' }
          ]
        ]
      };

      await bot.sendMessage(chatId, welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (err) {
      console.error('Failed to handle /start:', err.message);
    }
  });

  // Handle Callback Queries (Buttons)
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const action = query.data;

    try {
      if (action === 'settings_menu') {
        await renderSettingsMenu(chatId, messageId);
      } else if (action === 'latest_news') {
        await renderLatestNews(chatId, messageId);
      } else if (action === 'main_menu') {
        await renderMainMenu(chatId, messageId);
      } else if (action.startsWith('toggle_')) {
        const catKey = action.replace('toggle_', '');
        await toggleCategoryPreference(chatId, messageId, catKey);
      } else if (action === 'enable_all') {
        await toggleAllPreferences(chatId, messageId, true);
      } else if (action === 'disable_all') {
        await toggleAllPreferences(chatId, messageId, false);
      }

      await bot.answerCallbackQuery(query.id);
    } catch (err) {
      console.error('Error handling callback_query:', err.message);
      try {
        await bot.answerCallbackQuery(query.id, { text: 'حدث خطأ بسيط، يرجى المحاولة ثانية' });
      } catch (_) {}
    }
  });

  // Handle Polling & Network Errors
  bot.on('polling_error', (error) => {
    if (error.code === 'EFATAL' || error.message.includes('401')) {
      console.error('❌ [WuWa Bot] Fatal Telegram Auth Error: Check your BOT_TOKEN!');
    } else {
      // Non-fatal network hiccup, normal in long-polling
      console.warn('⚠️ [WuWa Bot] Telegram polling warning:', error.message);
    }
  });
}

// ==============================================================================
// 4. Interactive Menus Implementation
// ==============================================================================
async function renderSettingsMenu(chatId, messageId) {
  // Fetch current user preferences
  const { data: sub } = await supabase
    .from('telegram_subscribers')
    .select('is_active, preferences')
    .eq('chat_id', chatId)
    .single();

  const prefs = sub?.preferences || {};
  const isOverallActive = sub?.is_active ?? true;

  let text = `⚙️ **إعدادات الإشعارات والتفضيلات**\n\n`;
  text += `الحالة العامة: ${isOverallActive ? '🟢 **مفعّلة**' : '🔴 **متوقفة مؤقتاً**'}\n\n`;
  text += `اضغط على أي فئة للتبديل بين التفعيل والإيقاف:\n`;

  const buttons = [];

  for (const [key, meta] of Object.entries(CATEGORIES)) {
    const isEnabled = isOverallActive && (prefs[key] !== false);
    const statusIcon = isEnabled ? '✅' : '❌';
    buttons.push([
      {
        text: `${meta.label} [${statusIcon}]`,
        callback_data: `toggle_${key}`
      }
    ]);
  }

  // Bulk action row
  buttons.push([
    { text: '🟢 تفعيل الكل', callback_data: 'enable_all' },
    { text: '🔴 إيقاف الكل', callback_data: 'disable_all' }
  ]);

  // Back to Main Menu
  buttons.push([
    { text: '🔙 العودة للقائمة الرئيسية', callback_data: 'main_menu' }
  ]);

  await bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons }
  });
}

async function toggleCategoryPreference(chatId, messageId, categoryKey) {
  const { data: sub } = await supabase
    .from('telegram_subscribers')
    .select('preferences, is_active')
    .eq('chat_id', chatId)
    .single();

  const currentPrefs = sub?.preferences || {};
  const currentVal = currentPrefs[categoryKey] !== false;
  const newVal = !currentVal;

  const updatedPrefs = { ...currentPrefs, [categoryKey]: newVal };

  await supabase.rpc('telegram_update_preferences', {
    p_chat_id: chatId,
    p_preferences: updatedPrefs
  });

  // Re-render settings menu with updated state
  await renderSettingsMenu(chatId, messageId);
}

async function toggleAllPreferences(chatId, messageId, enable) {
  const allPrefs = {};
  for (const k of Object.keys(CATEGORIES)) {
    allPrefs[k] = enable;
  }

  await Promise.all([
    supabase.rpc('telegram_update_preferences', {
      p_chat_id: chatId,
      p_preferences: allPrefs
    }),
    supabase.rpc('telegram_toggle_subscription', {
      p_chat_id: chatId,
      p_is_active: enable
    })
  ]);

  await renderSettingsMenu(chatId, messageId);
}

async function renderMainMenu(chatId, messageId) {
  const text = 
`🌌 **مرحباً بك في WuWa Betting!**

منصتك الأولى لمتابعة بطاقات Resonators، صناديق السحب، والنزالات الكبرى في عالم Wuthering Waves.

اختر الإجراء المطلوب أدناه:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🌐 فتح موقع WuWa Betting', url: SITE_URL }
      ],
      [
        { text: '🔔 إعدادات الإشعارات', callback_data: 'settings_menu' },
        { text: '📢 آخر الأخبار', callback_data: 'latest_news' }
      ]
    ]
  };

  await bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

async function renderLatestNews(chatId, messageId) {
  // Fetch latest active boss and latest 3 cards
  const [bossRes, cardRes] = await Promise.all([
    supabase.from('bosses').select('name_ar, title, difficulty, win_points').eq('is_active', true).order('created_at', { ascending: false }).limit(1),
    supabase.from('cards').select('name, rarity, element').eq('is_published', true).order('created_at', { ascending: false }).limit(3)
  ]);

  let text = `📢 **آخر المستجدات في ساحة Solaris:**\n\n`;

  if (bossRes.data && bossRes.data.length > 0) {
    const b = bossRes.data[0];
    text += `🐉 **الزعيم الحالي:** ${b.name_ar || b.title} (صعوبة: ${b.difficulty}) | جائزة الفوز: ${b.win_points} نقطة\n\n`;
  }

  if (cardRes.data && cardRes.data.length > 0) {
    text += `🎴 **أحدث البطاقات المنشورة:**\n`;
    cardRes.data.forEach(c => {
      text += `• ${c.name} (${c.rarity.toUpperCase()} - ${c.element})\n`;
    });
    text += `\n`;
  }

  text += `✨ زر الموقع الآن لخوض المبارزات وفتح الصناديق!`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🌐 تصفح كامل المحتوى في الموقع', url: SITE_URL }
      ],
      [
        { text: '🔙 العودة للرئيسية', callback_data: 'main_menu' }
      ]
    ]
  };

  await bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

// ==============================================================================
// 5. Automated Notification Queue Worker
// ==============================================================================
let isProcessingQueue = false;

async function processNotificationQueue() {
  if (!bot) return;
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    // 1. Fetch pending notifications scheduled for now or in the past
    const { data: pendingNotifications, error } = await supabase.rpc('telegram_get_pending_notifications', {
      p_limit: 3
    });

    if (error) {
      console.error('Queue poll error:', error.message);
      return;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return;
    }

    for (const notif of pendingNotifications) {
      await sendSingleNotificationTask(notif);
    }
  } catch (err) {
    console.error('Fatal queue worker error:', err.message);
  } finally {
    isProcessingQueue = false;
  }
}

async function sendSingleNotificationTask(notif) {
  console.log(`\n📨 [Queue Worker] Processing notification: "${notif.title}" [ID: ${notif.id}]`);

  // Atomically claim the task
  const { data: claimed } = await supabase.rpc('telegram_claim_notification', {
    p_notification_id: notif.id
  });

  if (!claimed) {
    console.log(`⏩ [Queue Worker] Task already claimed by another worker, skipping.`);
    return;
  }

  // Fetch eligible subscribers who have not yet received this notification
  const { data: subscribers, error: subError } = await supabase.rpc('telegram_get_eligible_subscribers', {
    p_notification_id: notif.id,
    p_target_category: notif.target_category || 'all'
  });

  if (subError) {
    console.error(`Failed to fetch subscribers for notif ${notif.id}:`, subError.message);
    await supabase.rpc('telegram_complete_notification', {
      p_notification_id: notif.id,
      p_status: 'failed',
      p_error: subError.message
    });
    return;
  }

  const recipients = subscribers || [];
  console.log(`🎯 [Queue Worker] Target recipient count: ${recipients.length}`);

  if (recipients.length === 0) {
    // Mark as completed even if 0 recipients match
    await supabase.rpc('telegram_complete_notification', {
      p_notification_id: notif.id,
      p_status: 'completed'
    });
    return;
  }

  let successCount = 0;
  let failCount = 0;

  // Build message and keyboard
  const messageText = `**${notif.title}**\n\n${notif.message}`;
  const keyboard = notif.button_text && notif.button_url ? {
    inline_keyboard: [
      [{ text: notif.button_text, url: notif.button_url }]
    ]
  } : undefined;

  // Send in safe rate-limited loop
  // Telegram allows up to 30 messages/sec. We use 25/sec (40ms pause) for complete safety.
  for (const recipient of recipients) {
    const chatId = recipient.chat_id;
    const subId = recipient.subscriber_id;

    let sent = false;
    let errorMessage = null;

    try {
      if (notif.photo_url && isValidUrl(notif.photo_url)) {
        try {
          await bot.sendPhoto(chatId, notif.photo_url, {
            caption: messageText,
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
          sent = true;
        } catch (photoErr) {
          console.warn(`[Photo send failed, falling back to text for ${chatId}]:`, photoErr.message);
          // Fallback to text message
          await bot.sendMessage(chatId, messageText, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
          sent = true;
        }
      } else {
        await bot.sendMessage(chatId, messageText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        sent = true;
      }
    } catch (sendErr) {
      errorMessage = sendErr.message || 'Unknown error';
      console.error(`❌ Failed to send to chat ${chatId}:`, errorMessage);

      // Detect if user blocked the bot or chat was deleted
      if (
        errorMessage.includes('403 Forbidden') ||
        errorMessage.includes('bot was blocked') ||
        errorMessage.includes('chat not found') ||
        errorMessage.includes('user is deactivated')
      ) {
        console.warn(`🚫 User ${chatId} blocked the bot or is invalid. Marking as inactive.`);
        await supabase.rpc('telegram_mark_blocked', { p_chat_id: chatId });
      }
    }

    if (sent) {
      successCount++;
    } else {
      failCount++;
    }

    // Log delivery result
    await supabase.rpc('telegram_log_delivery', {
      p_notification_id: notif.id,
      p_subscriber_id: subId,
      p_chat_id: chatId,
      p_status: sent ? 'sent' : 'failed',
      p_error: errorMessage
    });

    // Rate-limiting delay (40ms = max 25 msgs/sec)
    await sleep(40);
  }

  // Mark task as completed
  const finalStatus = failCount > 0 && successCount === 0 ? 'failed' : 'completed';
  await supabase.rpc('telegram_complete_notification', {
    p_notification_id: notif.id,
    p_status: finalStatus,
    p_error: failCount > 0 ? `${failCount} message(s) failed delivery` : null
  });

  console.log(`✅ [Queue Worker] Completed notif ${notif.id}: ${successCount} sent, ${failCount} failed.`);
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Start Background Queue Worker Loop
console.log(`🔄 [WuWa Bot] Starting queue worker with interval: ${POLL_INTERVAL}ms`);
setInterval(processNotificationQueue, POLL_INTERVAL);

// Run initial queue check immediately
processNotificationQueue();
