// ============================================================
// WuWa Betting - TypeScript Database Types
// ============================================================

export type AccountStatus = 'active' | 'banned' | 'suspended'
export type EventStatus = 
  | 'draft'
  | 'scheduled'
  | 'open'
  | 'closed'
  | 'pending_result'
  | 'settling'
  | 'completed'
  | 'cancelled'

export type BetStatus = 'pending' | 'confirmed' | 'won' | 'lost' | 'refunded' | 'cancelled'
export type TransactionType = 
  | 'initial_balance'
  | 'bet_deduction'
  | 'win_reward'
  | 'event_settlement'
  | 'admin_adjustment'
  | 'bet_refund'
  | 'cancellation_refund'
  | 'box_purchase'
  | 'market_purchase'
  | 'market_sale'
  | 'quest_reward'
  | 'daily_login_reward'
  | 'achievement_reward'

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface FrameStyle {
  border_width?: number
  border_radius?: number
  glow_color?: string
  glow_spread?: number
  holo_effect?: 'none' | 'subtle_blue' | 'purple_pulse' | 'golden_rays' | 'rainbow_hologram'
}

export interface TextStyle {
  title_color?: string
  title_font?: string
  subtitle_color?: string
  badge_bg?: string
}

export interface LayoutConfig {
  aspect_ratio?: string
  badge_position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  text_align?: 'center' | 'right' | 'left'
  show_resonator_badge?: boolean
}

export interface CardTemplate {
  id: string
  name: string
  rarity: CardRarity
  description: string | null
  border_color: string
  bg_gradient: string
  frame_style: FrameStyle
  text_style: TextStyle
  layout_config: LayoutConfig
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CardSet {
  id: string
  name: string
  code: string
  season: string | null
  description: string | null
  cover_image_path: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  template_id: string | null
  character_id: string | null
  set_id: string | null
  name: string
  title: string | null
  subtitle: string | null
  decorative_text: string
  element: string
  rarity: CardRarity
  description: string | null
  image_path: string
  background_image_path: string | null
  frame_image_path: string | null
  card_design_override: Partial<CardTemplate>
  is_limited: boolean
  max_supply: number | null
  current_supply: number
  is_published: boolean
  stats?: Record<string, any> | null
  skills?: Array<Record<string, any>> | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  template?: CardTemplate | null
  character?: Character | null
  set?: CardSet | null
}

export interface PlayerCard {
  id: string
  card_id: string
  player_id: string
  serial_number: number
  status: 'owned' | 'listed_for_sale' | 'in_trade_escrow' | 'consumed_fusion'
  obtained_via: string
  obtained_at: string
  is_favorite: boolean
  evolution_level?: number
  fusion_level?: number
  // Joined
  card?: Card
}

export interface CardFusionLog {
  id: string
  player_id: string
  base_player_card_id: string
  card_id: string
  copies_consumed: number
  consumed_card_ids: string[]
  consumed_serials: number[]
  previous_fusion_level: number
  new_fusion_level: number
  stats_before: Record<string, number>
  stats_after: Record<string, number>
  created_at: string
  card?: Card
  player?: Pick<Player, 'id' | 'username'>
}

export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export interface Player {
  id: string
  auth_id: string | null
  username: string
  username_normalized: string
  balance: number
  total_winnings: number
  total_bets: number
  winning_bets: number
  losing_bets: number
  created_at: string
  updated_at: string
  last_active_at: string
  account_status: AccountStatus
  recovery_code?: string
}

export interface Admin {
  id: string
  auth_id: string
  username: string
  role: AdminRole
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export interface Character {
  id: string
  name: string
  alternate_name: string | null
  image_path: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Event {
  id: string
  title: string
  description: string | null
  cover_image_path: string | null
  character_a_id: string
  character_b_id: string
  multiplier: number
  max_bet_amount: number | null
  status: EventStatus
  opens_at: string | null
  closes_at: string | null
  winner_character_id: string | null
  created_at: string
  updated_at: string
  settled_at: string | null
  created_by: string | null
  settling_started_at: string | null
}

export interface EventWithCharacters extends Event {
  character_a: Character
  character_b: Character
  winner_character: Character | null
}

export interface Bet {
  id: string
  player_id: string
  event_id: string
  selected_character_id: string
  stake: number
  multiplier_snapshot: number
  potential_payout: number
  status: BetStatus
  created_at: string
  settled_at: string | null
}

export interface BetWithDetails extends Bet {
  player: Pick<Player, 'id' | 'username'>
  event: Pick<Event, 'id' | 'title' | 'status'>
  selected_character: Pick<Character, 'id' | 'name' | 'image_path'>
}

export interface Transaction {
  id: string
  player_id: string
  event_id: string | null
  bet_id: string | null
  transaction_type: TransactionType
  amount: number
  balance_before: number
  balance_after: number
  description: string
  created_at: string
  idempotency_key: string | null
  admin_id: string | null
}

export interface AuditLog {
  id: string
  admin_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface EventStats {
  event_id: string
  character_a_id: string
  character_b_id: string
  char_a_total_stake: number
  char_b_total_stake: number
  total_stake: number
  total_participants: number
  char_a_participants: number
  char_b_participants: number
}

export interface LeaderboardEntry {
  rank: number
  username: string
  balance: number
  total_winnings: number
  total_bets: number
  winning_bets: number
  losing_bets: number
  win_rate: number
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      players: {
        Row: Player
        Insert: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'last_active_at'>
        Update: Partial<Omit<Player, 'id' | 'created_at'>>
      }
      admins: {
        Row: Admin
        Insert: Omit<Admin, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Admin, 'id' | 'created_at'>>
      }
      characters: {
        Row: Character
        Insert: Omit<Character, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Character, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      bets: {
        Row: Bet
        Insert: Omit<Bet, 'id' | 'created_at' | 'potential_payout'>
        Update: Partial<Omit<Bet, 'id' | 'created_at'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: never
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
      }
    }
    Views: {
      event_stats: {
        Row: EventStats
      }
      leaderboard: {
        Row: LeaderboardEntry & { id: string }
      }
    }
    Functions: {
      place_bet: {
        Args: {
          p_player_id: string
          p_event_id: string
          p_character_id: string
          p_stake: number
        }
        Returns: {
          success: boolean
          bet_id?: string
          stake?: number
          multiplier?: number
          potential_payout?: number
          new_balance?: number
          error?: string
          message?: string
        }
      }
      settle_event: {
        Args: {
          p_event_id: string
          p_winner_character_id: string
          p_admin_id: string
        }
        Returns: {
          success: boolean
          winners?: number
          losers?: number
          total_paid?: number
          error?: string
          message?: string
        }
      }
      cancel_event: {
        Args: {
          p_event_id: string
          p_admin_id: string
          p_reason?: string
        }
        Returns: {
          success: boolean
          refunded_bets?: number
          total_refunded?: number
          error?: string
        }
      }
      admin_adjust_balance: {
        Args: {
          p_admin_id: string
          p_player_id: string
          p_amount: number
          p_reason: string
        }
        Returns: {
          success: boolean
          new_balance?: number
          error?: string
        }
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_admin_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_player_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_public_leaderboard: {
        Args: { p_limit?: number }
        Returns: LeaderboardEntry[]
      }
    }
  }
}
