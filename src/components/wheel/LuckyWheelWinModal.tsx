import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Trophy, Award, Gift, Check, ArrowRight, Zap, Coins } from 'lucide-react'
import type { LuckyWheelPrize } from '../../types/luckyWheel'

interface LuckyWheelWinModalProps {
  isOpen: boolean
  onClose: () => void
  prize: LuckyWheelPrize | null
  rewardDetails?: Record<string, any>
  newBalance?: number
}

export function LuckyWheelWinModal({
  isOpen,
  onClose,
  prize,
  rewardDetails,
  newBalance
}: LuckyWheelWinModalProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>>([])

  useEffect(() => {
    if (isOpen && prize) {
      // Generate celebratory particles
      const colors = prize.is_legendary
        ? ['#facc15', '#f59e0b', '#fbbf24', '#f43f5e', '#a855f7']
        : prize.is_rare
        ? ['#38bdf8', '#818cf8', '#c084fc', '#34d399']
        : ['#10b981', '#06b6d4', '#6366f1', '#e2e8f0']

      const newParticles = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        delay: Math.random() * 0.4
      }))
      setParticles(newParticles)
    }
  }, [isOpen, prize])

  if (!isOpen || !prize) return null

  const isLegendary = prize.is_legendary
  const isRare = prize.is_rare

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Particle Confetti Burst */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.2, 0.8, 0],
                x: p.x,
                y: p.y,
                opacity: [1, 1, 0.8, 0]
              }}
              transition={{ duration: 1.8, delay: p.delay, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                boxShadow: `0 0 10px ${p.color}`
              }}
            />
          ))}
        </div>

        {/* Modal Content Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="relative max-w-md w-full glass-card rounded-3xl p-6 sm:p-8 text-center border overflow-hidden shadow-2xl z-10"
          style={{
            borderColor: isLegendary ? 'rgba(245, 158, 11, 0.6)' : isRare ? 'rgba(99, 102, 241, 0.5)' : 'rgba(16, 185, 129, 0.4)',
            boxShadow: isLegendary
              ? '0 0 50px rgba(245, 158, 11, 0.35)'
              : '0 0 40px rgba(99, 102, 241, 0.25)'
          }}
        >
          {/* Top Banner & Light Burst */}
          <div 
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl -z-10 opacity-40 pointer-events-none"
            style={{ backgroundColor: prize.color || '#f59e0b' }}
          />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border"
            style={{
              backgroundColor: isLegendary ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              borderColor: isLegendary ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.3)',
              color: isLegendary ? '#fbbf24' : '#a5b4fc'
            }}
          >
            <Sparkles size={13} />
            <span>{isLegendary ? 'جائزة أسطورية خارقة! ✦' : isRare ? 'جائزة نادرة مميزة!' : 'مبروك الفوز!'}</span>
          </div>

          {/* Prize Visual Display */}
          <div className="my-5 flex flex-col items-center justify-center">
            {prize.prize_type === 'dollars' ? (
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-yellow-400/30 border-2 border-amber-400/50 flex items-center justify-center shadow-lg relative"
              >
                <Coins size={46} className="text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
              </motion.div>
            ) : prize.prize_type === 'card' ? (
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="w-28 h-36 rounded-2xl overflow-hidden border-2 border-primary-500/60 shadow-2xl bg-slate-900 relative group flex items-center justify-center"
              >
                {prize.image_url || prize.card?.image_path ? (
                  <img
                    src={prize.image_url || prize.card?.image_path}
                    alt={prize.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles size={36} className="text-primary-400" />
                )}
                <div className="absolute top-1 right-1 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold text-amber-300">
                  {prize.card?.rarity?.toUpperCase() || 'CARD'}
                </div>
              </motion.div>
            ) : prize.prize_type === 'title' ? (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/50 to-purple-900/40 border border-purple-500/40 shadow-xl"
              >
                <div className="text-3xl mb-1">{prize.title?.icon || '👑'}</div>
                <div className="text-lg font-black text-amber-300 tracking-wide font-arabic">
                  {prize.name}
                </div>
              </motion.div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Gift size={40} className="text-primary-400" />
              </div>
            )}

            <h3 className="text-2xl font-black text-white mt-4 tracking-tight">
              {prize.name}
            </h3>

            {prize.description && (
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xs">
                {prize.description}
              </p>
            )}

            {/* Compensation Notice if duplicate title */}
            {rewardDetails?.already_owned && (
              <div className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                ⚠️ تمتلك هذا اللقب مسبقاً! تم تعويضك بـ{' '}
                <span className="font-bold text-white font-mono">${rewardDetails.compensation_dollars}</span> في رصيدك.
              </div>
            )}

            {/* New Balance pill */}
            {newBalance !== undefined && (
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <span>رصيدك الجديد:</span>
                <span className="font-mono font-bold text-amber-400 number-ltr">
                  ${Number(newBalance).toLocaleString('en-US')}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-2">
            <button
              onClick={onClose}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <Check size={16} />
              <span>استلام الجائزة والعودة للساحة</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
