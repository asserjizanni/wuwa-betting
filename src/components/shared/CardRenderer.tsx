import React, { useRef, useState, useMemo } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Sparkles, Flame, Zap, Wind, Snowflake, Sun, Moon, Heart, Swords, ShieldCheck } from 'lucide-react'
import type { Card, CardTemplate, CardRarity } from '../../types/database'
import { getImageUrl } from '../../lib/utils'
import { ELEMENT_MAP, RARITY_LABELS, getElementIconUrl } from '../../lib/cardData'

export interface CardRendererProps {
  card: Partial<Card>
  template?: CardTemplate | null
  serialNumber?: number | null
  interactive?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto'
  className?: string
  onClick?: () => void
}

const ELEMENT_FALLBACK_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Spectro: Sun,
  Havoc:   Moon,
  Aero:    Wind,
  Electro: Zap,
  Fusion:  Flame,
  Glacio:  Snowflake,
}

// Reusable ElementIcon component — renders official WebP icon with SVG fallback on error
export function ElementIcon({
  element = 'Spectro',
  size = 16,
  className = '',
  style,
}: {
  element?: string
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  const [hasError, setHasError] = useState(false)
  const raw = (element || 'Spectro').trim()
  const cap = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
  const FallbackIcon = ELEMENT_FALLBACK_ICONS[cap] || Sun
  const color = ELEMENT_MAP[cap]?.color || '#fbbf24'

  if (hasError) {
    return (
      <FallbackIcon
        size={size}
        className={`inline-block shrink-0 drop-shadow ${className}`}
        style={{ color, ...style }}
      />
    )
  }

  return (
    <img
      src={getElementIconUrl(cap)}
      alt={cap}
      onError={() => setHasError(true)}
      className={`object-contain inline-block shrink-0 select-none pointer-events-none drop-shadow ${className}`}
      style={{ width: size, height: size, ...style }}
      loading="eager"
    />
  )
}

export function CardRenderer({
  card,
  template,
  serialNumber,
  interactive = true,
  size = 'md',
  className = '',
  onClick,
}: CardRendererProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Reset error state if image path changes
  React.useEffect(() => {
    setImgError(false)
  }, [card.image_path])

  // Merge template and overrides
  const effectiveRarity: CardRarity = card.rarity || template?.rarity || 'common'
  const effectiveBorder = card.card_design_override?.border_color || template?.border_color || '#818cf8'
  const effectiveGradient = card.card_design_override?.bg_gradient || template?.bg_gradient || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
  const frameStyle = { ...template?.frame_style, ...card.card_design_override?.frame_style }
  const textStyle = { ...template?.text_style, ...card.card_design_override?.text_style }
  const layoutConfig = { ...template?.layout_config, ...card.card_design_override?.layout_config }

  // 3D Motion values
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 250, damping: 20 })
  const mouseYSpring = useSpring(y, { stiffness: 250, damping: 20 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['14deg', '-14deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-14deg', '14deg'])
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  // Size mapping with mobile-friendly constraints
  const sizeClasses = {
    sm: 'w-[155px] sm:w-44 h-[230px] sm:h-64 text-xs',
    md: 'w-56 sm:w-64 h-80 sm:h-96 text-sm',
    lg: 'w-72 sm:w-80 h-[430px] sm:h-[480px] text-base',
    xl: 'w-80 sm:w-96 h-[500px] sm:h-[560px] text-lg',
    auto: 'w-full h-full text-sm',
  }

  const elementInfo = ELEMENT_MAP[card.element || 'Spectro'] || ELEMENT_MAP.Spectro
  const rarityInfo = RARITY_LABELS[effectiveRarity]

  // Holo shine background
  const holoClass = useMemo(() => {
    switch (frameStyle.holo_effect) {
      case 'rainbow_hologram':
        return 'holo-mythic'
      case 'golden_rays':
        return 'holo-legendary'
      case 'purple_pulse':
        return 'holo-epic'
      case 'subtle_blue':
        return 'holo-rare'
      default:
        return ''
    }
  }, [frameStyle.holo_effect])

  const borderWidth = frameStyle.border_width ?? 2.5
  const borderRadius = frameStyle.border_radius ?? 20
  const glowColor = frameStyle.glow_color ?? 'rgba(99, 102, 241, 0.5)'
  const glowSpread = frameStyle.glow_spread ?? 15

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: interactive ? rotateX : 0,
        rotateY: interactive ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className={`relative select-none transition-shadow duration-300 ${sizeClasses[size]} ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Outer Card Body */}
      <div
        className="w-full h-full relative overflow-hidden flex flex-col justify-between"
        style={{
          borderRadius: `${borderRadius}px`,
          border: `${borderWidth}px solid ${effectiveBorder}`,
          boxShadow: isHovered
            ? `0 20px 40px rgba(0,0,0,0.8), 0 0 ${glowSpread * 1.5}px ${glowColor}`
            : `0 10px 25px rgba(0,0,0,0.6), 0 0 ${glowSpread}px ${glowColor}`,
          background: effectiveGradient,
        }}
      >
        {/* Layer 0: Optional Background Image Texture */}
        {card.background_image_path && (
          <img
            src={getImageUrl(card.background_image_path, 'card-images')}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay pointer-events-none"
          />
        )}

        {/* Layer 1: Character Artwork */}
        {card.image_path && !imgError ? (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <img
              src={getImageUrl(card.image_path, 'card-images')}
              alt={card.name || 'Character'}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-top scale-105 transition-transform duration-500 pointer-events-none"
              style={{
                filter: isHovered ? 'contrast(1.08) saturate(1.15)' : 'none',
              }}
              loading="eager"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2 p-4 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-md transition-transform group-hover:scale-110"
              style={{ background: elementInfo.bg }}
            >
              <ElementIcon element={card.element} size={32} />
            </div>
            <span className="text-xs font-black text-white/90 drop-shadow line-clamp-1 max-w-[90%]" dir="auto">
              {card.name ? card.name.split('-')[0].trim() : 'Resonator'}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold" dir="auto">
              {card.title || 'بطاقة صدى'}
            </span>
          </div>
        )}

        {/* Layer 2: Holographic Flare Overlay */}
        {interactive && (
          <motion.div
            className={`absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 ${
              isHovered ? 'opacity-70' : 'opacity-0'
            } ${holoClass}`}
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.35) 0%, transparent 60%)`,
            }}
          />
        )}

        {/* Top Floating Badge Bar */}
        <div className="relative z-10 p-3 flex items-start justify-between gap-2">
          {/* Element & Resonator Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-md"
            style={{ background: elementInfo.bg }}
          >
            <ElementIcon element={card.element} size={16} />
            <span className="text-[11px] font-black tracking-wide" style={{ color: elementInfo.color }}>
              {card.element || 'Spectro'}
            </span>
          </div>

          {/* Rarity & Serial badge */}
          <div className="flex flex-col items-end gap-1">
            {/* Stars */}
            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              {Array.from({ length: rarityInfo.stars }).map((_, i) => (
                <Sparkles key={i} size={11} className="fill-current" style={{ color: rarityInfo.color }} />
              ))}
            </div>

            {/* Limited Edition Serial Badge */}
            {card.is_limited && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-300 text-black shadow-md tracking-wider">
                {serialNumber ? `#${String(serialNumber).padStart(3, '0')}` : 'LIMITED'}
                {card.max_supply ? ` / ${card.max_supply}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Card Footer Plate */}
        <div className="relative z-10 p-3 pt-6 mt-auto">
          {/* Frosted Glass Footer Panel */}
          <div className="relative rounded-xl p-3 bg-gradient-to-t from-black/90 via-black/75 to-transparent backdrop-blur-md border border-white/10 shadow-2xl">
            {/* Decorative Ribbon / Subtitle */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span
                className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded"
                style={{
                  color: effectiveBorder,
                  background: textStyle.badge_bg || 'rgba(99, 102, 241, 0.25)',
                }}
              >
                {card.decorative_text || 'RESONATOR'}
              </span>
              {card.subtitle && (
                <span className="text-[11px] font-medium text-slate-300 truncate" dir="auto" title={card.subtitle}>
                  {card.subtitle}
                </span>
              )}
            </div>

            {/* Card Name */}
            <h3
              className={`${size === 'sm' ? 'text-xs sm:text-sm' : 'text-base'} font-black truncate drop-shadow-md`}
              dir="auto"
              title={card.name || 'اسم البطاقة'}
              style={{ color: textStyle.title_color || '#ffffff' }}
            >
              {card.name || 'اسم البطاقة'}
            </h3>

            {/* Title / Epithet */}
            {card.title && (
              <p
                className={`${size === 'sm' ? 'text-[11px]' : 'text-xs'} font-semibold truncate drop-shadow`}
                dir="auto"
                title={card.title}
                style={{ color: textStyle.subtitle_color || '#94a3b8' }}
              >
                {card.title}
              </p>
            )}

            {/* Real Combat Stats Bar */}
            {(card as any).stats && (
              <div className="mt-2 pt-1.5 border-t border-white/10 grid grid-cols-3 gap-1 text-[10px]">
                <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 rounded text-red-300 font-bold">
                  <Swords size={10} className="text-red-400 flex-shrink-0" />
                  <span className="truncate">{(card as any).stats.atk || 0}</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-300 font-bold">
                  <Heart size={10} className="text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{(card as any).stats.hp || 0}</span>
                </div>
                <div className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.5 rounded text-blue-300 font-bold">
                  <ShieldCheck size={10} className="text-blue-400 flex-shrink-0" />
                  <span className="truncate">{(card as any).stats.def || 0}</span>
                </div>
              </div>
            )}

            {/* Skill tags */}
            {(card as any).skills && (card as any).skills.length > 0 && (
              <div className="mt-1 flex items-center gap-1 overflow-hidden">
                {(card as any).skills.slice(0, 2).map((sk: any, idx: number) => (
                  <span
                    key={idx}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-primary-500/25 text-primary-200 border border-primary-500/30 truncate font-semibold"
                    title={sk.description || sk.name}
                  >
                    ⚡ {sk.name}
                  </span>
                ))}
              </div>
            )}

            {/* Set Name Footer if provided */}
            {card.set?.name && (
              <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate">{card.set.name}</span>
                <span className="font-mono text-slate-500">{card.set.season || 'S1'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Corner Ornaments */}
        <div
          className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 pointer-events-none"
          style={{ borderColor: effectiveBorder }}
        />
        <div
          className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 pointer-events-none"
          style={{ borderColor: effectiveBorder }}
        />
        <div
          className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 pointer-events-none"
          style={{ borderColor: effectiveBorder }}
        />
        <div
          className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 pointer-events-none"
          style={{ borderColor: effectiveBorder }}
        />
      </div>
    </motion.div>
  )
}
