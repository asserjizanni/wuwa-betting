import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Star, Users, Target, Swords, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { EmptyState, LoadingSpinner } from '../components/shared/UI'
import type { LeaderboardEntry } from '../types/database'
import { useAuth } from '../hooks/useAuth'

export function LeaderboardPage() {
  const navigate = useNavigate()
  const { player } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [playerRank, setPlayerRank] = useState<number | null>(null)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  useEffect(() => {
    if (player && leaderboard.length) {
      const rank = leaderboard.findIndex(p => p.username === player.username) + 1
      setPlayerRank(rank > 0 ? rank : null)
    }
  }, [player, leaderboard])

  const loadLeaderboard = async () => {
    setLoading(true)
    const { data } = await supabase.rpc('get_public_leaderboard', { p_limit: 100 })
    if (data) setLeaderboard(data as LeaderboardEntry[])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="جارٍ تحميل لوحة المتصدرين..." />
      </div>
    )
  }

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="min-h-screen pt-20 pb-16 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-glow-gold"
        >
          <Trophy size={40} className="text-white" />
        </motion.div>
        <h1 className="text-4xl font-black text-white mb-2">لوحة المتصدرين</h1>
        <p className="text-slate-400">أفضل اللاعبين في ساحة التحدي</p>
        {playerRank && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <Star size={14} className="text-amber-400" />
            <span className="text-sm text-slate-300">مرتبتك: <span className="text-white font-bold">#{playerRank}</span></span>
          </div>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <EmptyState
          icon={<Trophy size={48} />}
          title="لا يوجد لاعبون بعد"
          description="كن أول من يشارك في الإيفنتات!"
        />
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[top3[1], top3[0], top3[2]].map((p, visIdx) => {
                if (!p) return <div key={visIdx} />
                const rank = p.rank as number
                const heights = ['h-32', 'h-44', 'h-28']
                const medals = ['🥈', '🥇', '🥉']
                const sizes = ['text-2xl', 'text-3xl', 'text-xl']
                
                return (
                  <motion.div
                    key={rank}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: visIdx * 0.1 }}
                    onClick={() => navigate(`/profile/${encodeURIComponent(p.username)}`)}
                    className={`flex flex-col items-center justify-end ${heights[visIdx]} cursor-pointer group`}
                  >
                    <div className="w-full glass-card rounded-t-2xl p-4 text-center flex flex-col items-center gap-1 transition-all group-hover:scale-105"
                      style={{
                        border: rank === 1 ? '1px solid rgba(245,158,11,0.5)' :
                                rank === 2 ? '1px solid rgba(148,163,184,0.4)' :
                                '1px solid rgba(205,124,47,0.4)',
                        background: rank === 1 ? 'linear-gradient(to bottom, rgba(245,158,11,0.1), rgba(14,14,28,0.8))' : undefined,
                      }}
                    >
                      <span className={medals[visIdx] + ' ' + sizes[visIdx]}>{medals[visIdx]}</span>
                      <p className="font-bold text-white text-sm truncate max-w-full group-hover:text-amber-400 transition-colors">{p.username}</p>
                      <p className={`text-xs font-bold ${
                        rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : 'text-amber-600'
                      }`}>
                        {p.balance.toLocaleString('ar-EG')}
                      </p>
                      <p className="text-xs text-slate-600">{p.win_rate}% نجاح</p>
                      <span className="text-[10px] text-amber-400/80 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
                        <Swords size={10} /> عرض التشكيلة
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Full table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>المركز</th>
                    <th>اللاعب</th>
                    <th>الرصيد</th>
                    <th className="hidden sm:table-cell">إجمالي الأرباح</th>
                    <th className="hidden md:table-cell">الرهانات</th>
                    <th className="hidden md:table-cell">الفوز/الخسارة</th>
                    <th>نسبة النجاح</th>
                    <th>الملف والتشكيلة</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((p, idx) => {
                    const isMe = player?.username === p.username
                    return (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => navigate(`/profile/${encodeURIComponent(p.username)}`)}
                        className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                        style={isMe ? { background: 'rgba(99,102,241,0.1)' } : {}}
                      >
                        <td>
                          <span className={`font-bold text-lg ${
                            Number(p.rank) === 1 ? 'text-amber-400' : Number(p.rank) === 2 ? 'text-slate-300' : Number(p.rank) === 3 ? 'text-amber-600' : 'text-slate-500'
                          }`}>
                            {Number(p.rank) <= 3 ? ['🥇','🥈','🥉'][Number(p.rank)-1] : `#${p.rank}`}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {p.username[0].toUpperCase()}
                            </div>
                            <span className={`font-semibold ${isMe ? 'text-primary-300' : 'text-white'}`}>
                              {p.username}
                              {isMe && <span className="mr-1 text-xs text-primary-500">(أنت)</span>}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`font-bold number-ltr ${p.balance < 0 ? 'text-red-400' : 'text-white'}`}>
                            {p.balance.toLocaleString('ar-EG')}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell">
                          <span className="text-green-400 font-semibold number-ltr">+{p.total_winnings.toLocaleString('ar-EG')}</span>
                        </td>
                        <td className="hidden md:table-cell">
                          <span className="text-slate-400 number-ltr">{p.total_bets}</span>
                        </td>
                        <td className="hidden md:table-cell">
                          <span className="text-green-400 number-ltr">{p.winning_bets}</span>
                          <span className="text-slate-600 mx-1">/</span>
                          <span className="text-red-400 number-ltr">{p.losing_bets}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-700 max-w-16 hidden sm:block">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                                style={{ width: `${p.win_rate}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-white">{p.win_rate}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs px-2.5 py-1 rounded-xl bg-primary-500/10 text-primary-300 border border-primary-500/30 flex items-center gap-1 font-bold w-fit hover:bg-primary-500/20 transition-all">
                            <Swords size={12} />
                            عرض ⚔️
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
