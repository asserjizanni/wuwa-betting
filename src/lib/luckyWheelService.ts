// ============================================================
// WuWa Betting - Lucky Wheel Service
// Communicates with Supabase DB & Server-side RPCs
// ============================================================

import { supabase } from './supabase'
import type {
  LuckyWheelPrize,
  LuckyWheelSettings,
  PlayerLuckyWheelStatus,
  LuckyWheelSpinResult,
  LuckyWheelSpinLog
} from '../types/luckyWheel'

// Default fallback prizes if DB tables have not been seeded yet
export const DEFAULT_LUCKY_PRIZES: LuckyWheelPrize[] = [
  {
    id: 'p-100-dollars',
    name: '100 Dollars',
    prize_type: 'dollars',
    prize_value: 100,
    color: '#10b981',
    weight: 35,
    is_active: true,
    is_rare: false,
    is_legendary: false,
    display_order: 1,
    description: 'مكافأة نقدية فورية لرصيدك'
  },
  {
    id: 'p-250-dollars',
    name: '250 Dollars',
    prize_type: 'dollars',
    prize_value: 250,
    color: '#06b6d4',
    weight: 25,
    is_active: true,
    is_rare: false,
    is_legendary: false,
    display_order: 2,
    description: 'مبلغ ممتاز لدخول رهانات جديدة'
  },
  {
    id: 'p-500-dollars',
    name: '500 Dollars',
    prize_type: 'dollars',
    prize_value: 500,
    color: '#8b5cf6',
    weight: 15,
    is_active: true,
    is_rare: true,
    is_legendary: false,
    display_order: 3,
    description: 'جائزة نقدية قيمة للمحظوظين'
  },
  {
    id: 'p-1000-dollars',
    name: '1,000 Dollars',
    prize_type: 'dollars',
    prize_value: 1000,
    color: '#f59e0b',
    weight: 8,
    is_active: true,
    is_rare: true,
    is_legendary: false,
    display_order: 4,
    description: 'جائزة كبرى مضاعفة!'
  },
  {
    id: 'p-2500-dollars',
    name: '2,500 Dollars',
    prize_type: 'dollars',
    prize_value: 2500,
    color: '#ec4899',
    weight: 3,
    is_active: true,
    is_rare: true,
    is_legendary: true,
    display_order: 5,
    description: 'ثروة حقيقية للمراهن الخارق!'
  },
  {
    id: 'p-card-legendary',
    name: 'بطاقة ريزوناتور أسطورية',
    prize_type: 'card',
    prize_value: 1,
    color: '#f97316',
    weight: 5,
    is_active: true,
    is_rare: true,
    is_legendary: true,
    display_order: 6,
    description: 'بطاقة أسطورية نادرة تضاف لمخزونك'
  },
  {
    id: 'p-card-epic',
    name: 'بطاقة ريزوناتور مميزة',
    prize_type: 'card',
    prize_value: 1,
    color: '#3b82f6',
    weight: 6,
    is_active: true,
    is_rare: true,
    is_legendary: false,
    display_order: 7,
    description: 'بطاقة قوية تدعم مجموعتك القتالية'
  },
  {
    id: 'p-rare-title',
    name: 'لقب شرفي نادر',
    prize_type: 'title',
    prize_value: 1,
    color: '#a855f7',
    weight: 3,
    is_active: true,
    is_rare: true,
    is_legendary: true,
    display_order: 8,
    description: 'لقب حصري يُزين ملفك الشخصي'
  }
]

export const DEFAULT_SETTINGS: LuckyWheelSettings = {
  id: 'default',
  is_enabled: true,
  spins_per_period: 1,
  period_type: 'daily',
  period_hours: 24,
  rollover_unused: false,
  max_accumulated_spins: 10
}

/**
 * Fetch player wheel status (attempts, cooldown, active prizes, last win)
 */
export async function getPlayerLuckyWheelStatus(playerId?: string): Promise<PlayerLuckyWheelStatus> {
  if (!playerId) {
    // Guest or unauthenticated preview
    return {
      is_enabled: true,
      spins_per_period: 1,
      period_type: 'daily',
      period_hours: 24,
      spins_used: 0,
      extra_spins: 0,
      spins_left: 1,
      period_start_at: new Date().toISOString(),
      next_reset_at: new Date(Date.now() + 86400000).toISOString(),
      total_spins_all_time: 0,
      prizes: DEFAULT_LUCKY_PRIZES,
      last_prize: null
    }
  }

  try {
    // 1. Try server RPC function
    const { data, error } = await supabase.rpc('get_player_lucky_wheel_status', {
      p_player_id: playerId
    })

    if (!error && data && data.success) {
      // Resolve any card/title relations if active
      let resolvedPrizes = data.prizes || []
      if (resolvedPrizes.length === 0) {
        resolvedPrizes = DEFAULT_LUCKY_PRIZES
      }
      return {
        ...data,
        prizes: resolvedPrizes
      }
    }

    // 2. Fallback to direct table queries
    const [settingsRes, attemptRes, prizesRes, lastPrizeRes] = await Promise.all([
      supabase.from('lucky_wheel_settings').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('player_lucky_wheel_attempts').select('*').eq('player_id', playerId).maybeSingle(),
      supabase.from('lucky_wheel_prizes').select('*, card:cards(id, name, rarity, image_path), title:titles(id, name_ar, rarity, icon, color)').eq('is_active', true).order('display_order', { ascending: true }),
      supabase.from('lucky_wheel_spins').select('*').eq('player_id', playerId).eq('status', 'success').order('created_at', { ascending: false }).limit(1).maybeSingle()
    ])

    const settings: LuckyWheelSettings = settingsRes.data || DEFAULT_SETTINGS
    const attempt = attemptRes.data
    const now = Date.now()

    let periodStart = attempt?.period_start_at ? new Date(attempt.period_start_at).getTime() : now
    const periodMs = (settings.period_hours || 24) * 3600 * 1000
    let nextReset = periodStart + periodMs

    let spinsUsed = attempt?.spins_used_in_period || 0
    if (now >= nextReset) {
      spinsUsed = 0
      periodStart = now
      nextReset = now + periodMs
    }

    const extraSpins = attempt?.extra_spins || 0
    const spinsLeft = Math.max(0, settings.spins_per_period - spinsUsed) + extraSpins
    const prizes = prizesRes.data && prizesRes.data.length > 0 ? (prizesRes.data as any) : DEFAULT_LUCKY_PRIZES

    return {
      is_enabled: settings.is_enabled,
      spins_per_period: settings.spins_per_period,
      period_type: settings.period_type,
      period_hours: settings.period_hours,
      spins_used: spinsUsed,
      extra_spins: extraSpins,
      spins_left: spinsLeft,
      period_start_at: new Date(periodStart).toISOString(),
      next_reset_at: new Date(nextReset).toISOString(),
      last_spin_at: attempt?.last_spin_at || null,
      total_spins_all_time: attempt?.total_spins_all_time || 0,
      prizes,
      last_prize: lastPrizeRes.data ? {
        id: lastPrizeRes.data.id,
        prize_name: lastPrizeRes.data.prize_name,
        prize_type: lastPrizeRes.data.prize_type,
        prize_value: lastPrizeRes.data.prize_value,
        created_at: lastPrizeRes.data.created_at
      } : null
    }
  } catch (err) {
    console.warn('Using client fallback for lucky wheel status:', err)
    return {
      is_enabled: true,
      spins_per_period: 1,
      period_type: 'daily',
      period_hours: 24,
      spins_used: 0,
      extra_spins: 0,
      spins_left: 1,
      period_start_at: new Date().toISOString(),
      next_reset_at: new Date(Date.now() + 86400000).toISOString(),
      total_spins_all_time: 0,
      prizes: DEFAULT_LUCKY_PRIZES,
      last_prize: null
    }
  }
}

/**
 * Execute lucky wheel spin atomically on the server
 */
export async function spinLuckyWheel(playerId: string): Promise<LuckyWheelSpinResult> {
  const idempotencyKey = `spin_${playerId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // 1. Try server RPC
  try {
    const { data, error } = await supabase.rpc('spin_lucky_wheel', {
      p_player_id: playerId,
      p_idempotency_key: idempotencyKey
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data?.success) {
      throw new Error(data?.message || 'فشل تنفيذ الدوران')
    }

    return data as LuckyWheelSpinResult
  } catch (err: any) {
    // If RPC doesn't exist, provide a detailed helpful error
    if (err?.message?.includes('function') && err?.message?.includes('spin_lucky_wheel')) {
      throw new Error('قاعدة البيانات تتطلب تشغيل ملف Migration V8 في Supabase SQL Editor لتفعيل الدوران الآمن.')
    }
    throw err
  }
}

/**
 * Fetch all prizes for Admin with full relationship data
 */
export async function getAdminPrizes(): Promise<LuckyWheelPrize[]> {
  try {
    const { data, error } = await supabase
      .from('lucky_wheel_prizes')
      .select('*, card:cards(id, name, rarity, image_path), title:titles(id, name_ar, rarity, icon, color)')
      .order('display_order', { ascending: true })

    if (error) throw error
    if (!data || data.length === 0) {
      return DEFAULT_LUCKY_PRIZES
    }

    // Calculate probability percentages based on weights
    const totalWeight = data.reduce((acc, p) => acc + (p.is_active ? Number(p.weight || 0) : 0), 0)
    return data.map(p => ({
      ...p,
      probability_pct: totalWeight > 0 && p.is_active ? Math.round((Number(p.weight) / totalWeight) * 1000) / 10 : 0
    }))
  } catch (err) {
    console.warn('Error fetching admin prizes, falling back to defaults:', err)
    const totalWeight = DEFAULT_LUCKY_PRIZES.reduce((acc, p) => acc + (p.is_active ? p.weight : 0), 0)
    return DEFAULT_LUCKY_PRIZES.map(p => ({
      ...p,
      probability_pct: Math.round((p.weight / totalWeight) * 1000) / 10
    }))
  }
}

/**
 * Save or update prize in Admin
 */
export async function saveAdminPrize(prize: Partial<LuckyWheelPrize>): Promise<void> {
  const payload = {
    name: prize.name?.trim(),
    prize_type: prize.prize_type || 'dollars',
    prize_value: Number(prize.prize_value || 0),
    card_id: prize.prize_type === 'card' ? prize.card_id || null : null,
    card_copies: prize.prize_type === 'card' ? Math.max(1, Number(prize.card_copies || 1)) : 1,
    title_id: prize.prize_type === 'title' ? prize.title_id || null : null,
    title_duplicate_reward_dollars: Number(prize.title_duplicate_reward_dollars || 250),
    image_url: prize.image_url?.trim() || null,
    icon_name: prize.icon_name || null,
    description: prize.description?.trim() || null,
    color: prize.color || '#6366f1',
    weight: Math.max(0.1, Number(prize.weight || 10)),
    is_active: prize.is_active ?? true,
    is_rare: prize.is_rare ?? false,
    is_legendary: prize.is_legendary ?? false,
    max_wins_per_player: prize.max_wins_per_player ? Number(prize.max_wins_per_player) : null,
    guaranteed_pity_spins: prize.guaranteed_pity_spins ? Number(prize.guaranteed_pity_spins) : null,
    display_order: Number(prize.display_order || 0),
    updated_at: new Date().toISOString()
  }

  if (prize.id && !prize.id.startsWith('p-')) {
    const { error } = await supabase
      .from('lucky_wheel_prizes')
      .update(payload)
      .eq('id', prize.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('lucky_wheel_prizes')
      .insert([payload])
    if (error) throw error
  }
}

/**
 * Delete a prize
 */
export async function deleteAdminPrize(prizeId: string): Promise<void> {
  const { error } = await supabase
    .from('lucky_wheel_prizes')
    .delete()
    .eq('id', prizeId)
  if (error) throw error
}

/**
 * Fetch Lucky Wheel settings in Admin
 */
export async function getAdminSettings(): Promise<LuckyWheelSettings> {
  try {
    const { data, error } = await supabase
      .from('lucky_wheel_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()

    if (error) throw error
    return data || DEFAULT_SETTINGS
  } catch (err) {
    return DEFAULT_SETTINGS
  }
}

/**
 * Save settings in Admin
 */
export async function saveAdminSettings(settings: Partial<LuckyWheelSettings>): Promise<void> {
  const payload = {
    id: 'default',
    is_enabled: settings.is_enabled ?? true,
    spins_per_period: Math.max(0, Number(settings.spins_per_period ?? 1)),
    period_type: settings.period_type || 'daily',
    period_hours: Math.max(1, Number(settings.period_hours || 24)),
    rollover_unused: settings.rollover_unused ?? false,
    max_accumulated_spins: Math.max(1, Number(settings.max_accumulated_spins || 10)),
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('lucky_wheel_settings')
    .upsert(payload)

  if (error) throw error
}

/**
 * Grant extra bonus attempts to a specific player
 */
export async function grantPlayerSpins(adminId: string, targetPlayerId: string, count: number): Promise<string> {
  // Try RPC
  try {
    const { data, error } = await supabase.rpc('admin_grant_player_spins', {
      p_admin_id: adminId,
      p_target_player_id: targetPlayerId,
      p_count: count
    })
    if (!error && data?.success) {
      return data.message
    }
  } catch {}

  // Direct table update fallback
  const { data: attempt } = await supabase
    .from('player_lucky_wheel_attempts')
    .select('extra_spins')
    .eq('player_id', targetPlayerId)
    .maybeSingle()

  const currentExtra = attempt?.extra_spins || 0
  const { error } = await supabase
    .from('player_lucky_wheel_attempts')
    .upsert({
      player_id: targetPlayerId,
      extra_spins: currentExtra + count,
      updated_at: new Date().toISOString()
    })

  if (error) throw error
  return `تم منح ${count} محاولات إضافية للاعب بنجاح!`
}

/**
 * Reset player attempts for current period
 */
export async function resetPlayerSpins(adminId: string, targetPlayerId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('admin_reset_player_spins', {
      p_admin_id: adminId,
      p_target_player_id: targetPlayerId
    })
    if (!error && data?.success) {
      return data.message
    }
  } catch {}

  const { error } = await supabase
    .from('player_lucky_wheel_attempts')
    .update({
      spins_used_in_period: 0,
      period_start_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('player_id', targetPlayerId)

  if (error) throw error
  return 'تمت إعادة تعيين محاولات اللاعب بنجاح!'
}

/**
 * Fetch spin logs with pagination and search
 */
export async function getSpinLogs(limit = 50, search = ''): Promise<{ logs: LuckyWheelSpinLog[]; totalCount: number }> {
  try {
    let query = supabase
      .from('lucky_wheel_spins')
      .select('*, player:players(id, username, balance)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (search.trim()) {
      query = query.ilike('prize_name', `%${search.trim()}%`)
    }

    const { data, count, error } = await query
    if (error) throw error

    return {
      logs: (data as any) || [],
      totalCount: count || 0
    }
  } catch (err) {
    return { logs: [], totalCount: 0 }
  }
}

/**
 * Fetch player's personal spin history
 */
export async function getPlayerSpinHistory(playerId: string, limit = 20): Promise<LuckyWheelSpinLog[]> {
  try {
    const { data, error } = await supabase
      .from('lucky_wheel_spins')
      .select('*')
      .eq('player_id', playerId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data as any) || []
  } catch (err) {
    return []
  }
}
