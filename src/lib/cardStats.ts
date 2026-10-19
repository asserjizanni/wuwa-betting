// ============================================================
// WuWa Betting - Unified Card Stats & Fusion Calculation Engine
// ============================================================

export interface CardRawStats {
  hp?: number
  atk?: number
  def?: number
  speed?: number
  crit_rate?: number
  crit_dmg?: number
  shield?: number
  heal?: number
  lifesteal?: number
  energy?: number
  damage_reduction?: number
  [key: string]: any
}

export interface CalculatedCardStats {
  hp: number
  atk: number
  def: number
  speed: number
  crit_rate: number
  crit_dmg: number
  shield: number
  heal: number
  lifesteal: number
  energy: number
}

export interface FusionConfig {
  enabled: boolean
  maxLevel: number
  copiesPerLevel: Record<number, number>
  bonusHpPercent: number
  bonusAtkPercent: number
  bonusDefPercent: number
  bonusSpeed: number
  bonusCritRate: number
  bonusShieldHealPercent: number
  allowedRarities: string[]
}

export const DEFAULT_FUSION_CONFIG: FusionConfig = {
  enabled: true,
  maxLevel: 5,
  copiesPerLevel: {
    1: 1,
    2: 1,
    3: 2,
    4: 2,
    5: 3,
  },
  bonusHpPercent: 8,
  bonusAtkPercent: 7,
  bonusDefPercent: 6,
  bonusSpeed: 2,
  bonusCritRate: 1,
  bonusShieldHealPercent: 5,
  allowedRarities: ['common', 'rare', 'epic', 'legendary', 'mythic'],
}

/**
 * Calculates unified card stats combining Base Stats + Evolution Level + Fusion Level
 */
export function calculateCardStats(
  rawStats: CardRawStats | null | undefined,
  evolutionLevel: number = 1,
  fusionLevel: number = 0,
  config: Partial<FusionConfig> = {}
): CalculatedCardStats {
  const mergedConfig = { ...DEFAULT_FUSION_CONFIG, ...config }
  const evo = Math.max(1, evolutionLevel || 1)
  const fusion = Math.max(0, fusionLevel || 0)

  const baseHp = Number(rawStats?.hp || 1200)
  const baseAtk = Number(rawStats?.atk || 180)
  const baseDef = Number(rawStats?.def || 90)
  const baseSpeed = Number(rawStats?.speed || 100)
  const baseCritRate = Number(rawStats?.crit_rate || 15)
  const baseCritDmg = Number(rawStats?.crit_dmg || 150)
  const baseShield = Number(rawStats?.shield || 0)
  const baseHeal = Number(rawStats?.heal || 0)
  const baseLifesteal = Number(rawStats?.lifesteal || 0)
  const baseEnergy = Number(rawStats?.energy || 100)

  // Evolution scaling:
  // HP: +15% per evo level (from level 1)
  // ATK: +12% per evo level (from level 1)
  // DEF: +10% per evo level (from level 1)
  const evoHpScale = 1.0 + ((evo - 1) * 0.15)
  const evoAtkScale = 1.0 + ((evo - 1) * 0.12)
  const evoDefScale = 1.0 + ((evo - 1) * 0.10)

  // Fusion scaling:
  const fusionHpScale = 1.0 + (fusion * (mergedConfig.bonusHpPercent / 100))
  const fusionAtkScale = 1.0 + (fusion * (mergedConfig.bonusAtkPercent / 100))
  const fusionDefScale = 1.0 + (fusion * (mergedConfig.bonusDefPercent / 100))
  const fusionShieldHealScale = 1.0 + (fusion * (mergedConfig.bonusShieldHealPercent / 100))

  return {
    hp: Math.round(baseHp * evoHpScale * fusionHpScale),
    atk: Math.round(baseAtk * evoAtkScale * fusionAtkScale),
    def: Math.round(baseDef * evoDefScale * fusionDefScale),
    speed: Math.round(baseSpeed + ((evo - 1) * 2) + (fusion * mergedConfig.bonusSpeed)),
    crit_rate: Math.min(50, Math.round(baseCritRate + Math.floor((evo - 1) / 2) + (fusion * mergedConfig.bonusCritRate))),
    crit_dmg: Math.round(baseCritDmg + ((evo - 1) * 5) + (fusion * 5)),
    shield: Math.round(baseShield * fusionShieldHealScale),
    heal: Math.round(baseHeal * fusionShieldHealScale),
    lifesteal: baseLifesteal,
    energy: baseEnergy,
  }
}

/**
 * Returns required copies to go from currentLevel to targetLevel
 */
export function getRequiredCopiesForTargetLevel(
  currentLevel: number,
  targetLevel: number,
  config: Partial<FusionConfig> = {}
): number {
  const cfg = { ...DEFAULT_FUSION_CONFIG, ...config }
  if (targetLevel <= currentLevel) return 0

  let total = 0
  for (let lvl = currentLevel + 1; lvl <= targetLevel; lvl++) {
    total += cfg.copiesPerLevel[lvl] || 1
  }
  return total
}

/**
 * Calculates max reachable level and consumed copies based on available copies
 */
export function calculateReachableFusionLevel(
  availableCopies: number,
  currentLevel: number,
  config: Partial<FusionConfig> = {}
): { maxTargetLevel: number; copiesNeeded: number } {
  const cfg = { ...DEFAULT_FUSION_CONFIG, ...config }
  let target = currentLevel
  let copiesUsed = 0

  for (let lvl = currentLevel + 1; lvl <= cfg.maxLevel; lvl++) {
    const needed = cfg.copiesPerLevel[lvl] || 1
    if (copiesUsed + needed <= availableCopies) {
      copiesUsed += needed
      target = lvl
    } else {
      break
    }
  }

  return { maxTargetLevel: target, copiesNeeded: copiesUsed }
}

/**
 * Returns formatting string for fusion badge (e.g. ✦ Lv.2 or ✦✦✦)
 */
export function getFusionBadge(fusionLevel: number = 0): {
  label: string
  stars: string
  color: string
  glowClass: string
} {
  const lvl = Math.max(0, fusionLevel || 0)
  if (lvl === 0) {
    return {
      label: 'Base Resonance',
      stars: '',
      color: '#94a3b8',
      glowClass: '',
    }
  }

  const starIcons = '✦'.repeat(lvl)
  const colors: Record<number, { color: string; glow: string }> = {
    1: { color: '#38bdf8', glow: 'shadow-glow-blue' },
    2: { color: '#818cf8', glow: 'shadow-glow-purple' },
    3: { color: '#c084fc', glow: 'shadow-glow-purple' },
    4: { color: '#f43f5e', glow: 'shadow-glow-rose' },
    5: { color: '#fbbf24', glow: 'shadow-glow-amber' },
  }

  const currentTheme = colors[lvl] || { color: '#fbbf24', glow: 'shadow-glow-amber' }

  return {
    label: `دمج Lv.${lvl}`,
    stars: starIcons,
    color: currentTheme.color,
    glowClass: currentTheme.glow,
  }
}
