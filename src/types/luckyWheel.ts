// ============================================================
// WuWa Betting - Lucky Wheel (عجلة الحظ) Types
// ============================================================

export type LuckyWheelPrizeType = 'dollars' | 'card' | 'title' | 'custom'

export interface LuckyWheelPrize {
  id: string
  name: string
  prize_type: LuckyWheelPrizeType
  prize_value: number
  card_id?: string | null
  card_copies?: number
  title_id?: string | null
  title_duplicate_reward_dollars?: number
  image_url?: string | null
  icon_name?: string | null
  description?: string | null
  color: string
  weight: number
  probability_pct?: number
  is_active: boolean
  is_rare: boolean
  is_legendary: boolean
  max_wins_per_player?: number | null
  guaranteed_pity_spins?: number | null
  display_order: number
  created_at?: string
  updated_at?: string
  // Joined or resolved data
  card?: {
    id: string
    name: string
    rarity: string
    image_path: string
  } | null
  title?: {
    id: string
    name_ar: string
    rarity: string
    icon: string
    color: string
  } | null
}

export type PeriodType = 'daily' | 'hours_12' | 'weekly' | 'custom_hours'

export interface LuckyWheelSettings {
  id: string
  is_enabled: boolean
  spins_per_period: number
  period_type: PeriodType
  period_hours: number
  rollover_unused: boolean
  max_accumulated_spins: number
  created_at?: string
  updated_at?: string
}

export interface PlayerLuckyWheelStatus {
  is_enabled: boolean
  spins_per_period: number
  period_type: PeriodType
  period_hours: number
  spins_used: number
  extra_spins: number
  spins_left: number
  period_start_at: string
  next_reset_at: string
  last_spin_at?: string | null
  total_spins_all_time: number
  prizes: LuckyWheelPrize[]
  last_prize?: {
    id: string
    prize_name: string
    prize_type: LuckyWheelPrizeType
    prize_value: number
    created_at: string
  } | null
}

export interface LuckyWheelSpinResult {
  success: boolean
  message?: string
  idempotent?: boolean
  prize?: {
    id: string
    name: string
    prize_type: LuckyWheelPrizeType
    prize_value: number
    card_id?: string | null
    card_copies?: number
    title_id?: string | null
    image_url?: string | null
    icon_name?: string | null
    description?: string | null
    color?: string
    is_rare?: boolean
    is_legendary?: boolean
    segment_index: number
  }
  reward_details?: Record<string, any>
  spins_left: number
  next_reset_at?: string
  player_new_balance?: number
}

export interface LuckyWheelSpinLog {
  id: string
  player_id: string
  prize_id: string | null
  prize_name: string
  prize_type: LuckyWheelPrizeType
  prize_value: number
  card_id?: string | null
  title_id?: string | null
  reward_details: Record<string, any>
  status: 'success' | 'failed'
  error_reason?: string | null
  idempotency_key?: string | null
  created_at: string
  player?: {
    id: string
    username: string
    balance?: number
  }
}
