import React from 'react'
import { motion } from 'framer-motion'
import { Crown, Sparkles, Flame, Shield, Eye, Zap } from 'lucide-react'

export type TitleAnimationStyle = 
  | 'legendary_glow' 
  | 'mythic_flame' 
  | 'abyssal_void' 
  | 'solaris_radiance' 
  | 'phantom'
  | 'none'

export interface TitleData {
  id?: string
  name_ar: string
  name_en?: string | null
  color?: string
  icon?: string
  rarity?: string
  animation_style?: TitleAnimationStyle
}

interface PlayerTitleBadgeProps {
  title?: TitleData | null
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export function PlayerTitleBadge({
  title,
  size = 'md',
  showIcon = true,
  className = ''
}: PlayerTitleBadgeProps) {
  if (!title || !title.name_ar) return null

  const anim = title.animation_style || 'legendary_glow'
  const baseColor = title.color || '#f59e0b'

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-black',
  }[size]

  // Dynamic animation classes based on style
  const getAnimationClass = () => {
    switch (anim) {
      case 'mythic_flame':
        return 'animate-pulse shadow-glow-red border-red-500/50 text-red-200'
      case 'solaris_radiance':
        return 'shadow-glow-amber border-amber-400/60 text-amber-100 relative overflow-hidden'
      case 'abyssal_void':
        return 'shadow-glow-purple border-purple-500/50 text-purple-200'
      case 'phantom':
        return 'border-slate-500/40 text-slate-200 opacity-90 hover:opacity-100'
      case 'legendary_glow':
      default:
        return 'shadow-glow-blue border-amber-500/40 text-amber-200'
    }
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold select-none border backdrop-blur-md transition-all ${sizeClasses} ${getAnimationClass()} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${baseColor}25, rgba(15, 23, 42, 0.85))`,
        borderColor: `${baseColor}60`,
        color: baseColor,
      }}
      title={`${title.name_ar} ${title.name_en ? `(${title.name_en})` : ''}`}
    >
      {/* Light sheen animation for solaris / legendary */}
      {(anim === 'solaris_radiance' || anim === 'legendary_glow') && (
        <span 
          className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" 
        />
      )}

      {showIcon && (
        <span className="text-xs">
          {title.icon || (anim === 'mythic_flame' ? '🔥' : anim === 'solaris_radiance' ? '☀️' : '👑')}
        </span>
      )}

      <span className="tracking-wide">{title.name_ar}</span>

      {title.name_en && size === 'lg' && (
        <span className="text-[10px] opacity-75 font-mono">[{title.name_en}]</span>
      )}
    </span>
  )
}

/**
 * Unified Component to display Player Name with equipped Title
 */
export function PlayerNameWithTitle({
  username,
  title,
  avatarFrame,
  isLeader = false,
  roleBadge,
  size = 'md',
  className = ''
}: {
  username: string
  title?: TitleData | null
  avatarFrame?: string | null
  isLeader?: boolean
  roleBadge?: { text: string; color: string; icon?: string } | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      <span className="font-black text-white hover:text-primary-300 transition-colors">
        {username}
      </span>

      {roleBadge && (
        <span
          className="px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-1 shadow-sm"
          style={{
            background: `${roleBadge.color}15`,
            color: roleBadge.color,
            borderColor: `${roleBadge.color}40`,
          }}
        >
          {roleBadge.icon && <span>{roleBadge.icon}</span>}
          {roleBadge.text}
        </span>
      )}

      {title && (
        <PlayerTitleBadge title={title} size={size === 'lg' ? 'md' : 'sm'} />
      )}
    </div>
  )
}
