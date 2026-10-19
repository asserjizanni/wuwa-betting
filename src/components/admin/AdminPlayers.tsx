import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Ban, Wallet, Eye, ChevronDown, ChevronUp, Loader2,
  X, Check, Lock, Key, Copy, Shield, ShieldAlert, Sparkles, Trophy, UserX, UserCheck, Layers
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDate, getBetStatusClass, getBetStatusLabel, getTransactionTypeLabel } from '../../lib/utils'
import { Modal, ConfirmDialog, LoadingSpinner, EmptyState } from '../shared/UI'
import { PlayerTitleBadge } from '../shared/PlayerTitleBadge'
import type { Player, Bet, Transaction } from '../../types/database'
import toast from 'react-hot-toast'

interface ExtendedPlayer extends Player {
  recovery_code?: string
  password_hash?: string | null
  is_excluded_from_leaderboard?: boolean
}

export function AdminPlayers() {
  const { admin } = useAuth()
  const [players, setPlayers] = useState<ExtendedPlayer[]>([])
  const [filtered, setFiltered] = useState<ExtendedPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<ExtendedPlayer | null>(null)
  const [playerBets, setPlayerBets] = useState<Bet[]>([])
  const [playerTransactions, setPlayerTransactions] = useState<Transaction[]>([])
  const [playerTitlesList, setPlayerTitlesList] = useState<any[]>([])
  const [revokingTitleId, setRevokingTitleId] = useState<string | null>(null)
  const [playerDetailOpen, setPlayerDetailOpen] = useState(false)
  const [adjustModal, setAdjustModal] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [isBanning, setIsBanning] = useState(false)
  const [banConfirm, setBanConfirm] = useState<ExtendedPlayer | null>(null)

  // Password reset modal state
  const [passwordModal, setPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isSettingPassword, setIsSettingPassword] = useState(false)

  // Grant Card modal state
  const [grantCardModal, setGrantCardModal] = useState(false)
  const [targetPlayerForCard, setTargetPlayerForCard] = useState<ExtendedPlayer | null>(null)
  const [targetPlayerId, setTargetPlayerId] = useState<string>('')
  const [allCards, setAllCards] = useState<any[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [cardQuantity, setCardQuantity] = useState<number>(1)
  const [cardSearchQuery, setCardSearchQuery] = useState('')
  const [cardRarityFilter, setCardRarityFilter] = useState('all')
  const [isGrantingCard, setIsGrantingCard] = useState(false)

  useEffect(() => { loadPlayers() }, [])

  useEffect(() => {
    setFiltered(
      search
        ? players.filter(p => p.username.toLowerCase().includes(search.toLowerCase()))
        : players
    )
  }, [players, search])

  const loadPlayers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('balance', { ascending: false })
    if (data) setPlayers(data as ExtendedPlayer[])
    setLoading(false)
  }

  const openPlayerDetail = async (player: ExtendedPlayer) => {
    setSelectedPlayer(player)
    setPlayerDetailOpen(true)
    setPlayerTitlesList([])

    const [betsRes, txRes, titlesRes] = await Promise.all([
      supabase.from('bets').select('*').eq('player_id', player.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('transactions').select('*').eq('player_id', player.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('player_titles').select('id, title_id, unlocked_at, is_equipped, title:titles(*)').eq('player_id', player.id),
    ])

    if (betsRes.data) setPlayerBets(betsRes.data)
    if (txRes.data) setPlayerTransactions(txRes.data)
    if (titlesRes.data) setPlayerTitlesList(titlesRes.data)
  }

  const handleRevokeTitleFromPlayerDetail = async (titleId: string) => {
    if (!selectedPlayer) return
    if (!window.confirm('هل أنت متأكد من سحب هذا اللقب من اللاعب؟')) return

    setRevokingTitleId(titleId)
    try {
      const { error: delErr } = await supabase
        .from('player_titles')
        .delete()
        .eq('player_id', selectedPlayer.id)
        .eq('title_id', titleId)

      if (delErr) throw delErr

      if (selectedPlayer.equipped_title_id === titleId) {
        await supabase
          .from('players')
          .update({ equipped_title_id: null })
          .eq('id', selectedPlayer.id)

        setSelectedPlayer({ ...selectedPlayer, equipped_title_id: null })
      }

      setPlayerTitlesList(prev => prev.filter(t => t.title_id !== titleId))
      toast.success('تم سحب اللقب من اللاعب بنجاح! ✅')
      await loadPlayers()
    } catch (err: any) {
      console.error('Revoke error:', err)
      toast.error('فشل سحب اللقب: ' + (err.message || 'حدث خطأ'))
    } finally {
      setRevokingTitleId(null)
    }
  }

  const handleAdjust = async () => {
    if (!selectedPlayer || !admin?.id) return
    const amount = parseFloat(adjustAmount)
    if (isNaN(amount) || amount === 0) return toast.error('أدخل مبلغاً صحيحاً')
    if (!adjustReason.trim()) return toast.error('سبب التعديل مطلوب')

    setIsAdjusting(true)
    try {
      const { data, error } = await supabase.rpc('admin_adjust_balance', {
        p_admin_id: admin.id,
        p_player_id: selectedPlayer.id,
        p_amount: amount,
        p_reason: adjustReason.trim(),
      })

      if (error) throw error
      if (!data?.success) throw new Error('فشل التعديل')

      toast.success(`تم تعديل الرصيد. الرصيد الجديد: ${data.new_balance?.toLocaleString('ar-EG')} نقطة`)
      setAdjustModal(false)
      setAdjustAmount('')
      setAdjustReason('')
      await loadPlayers()
      await openPlayerDetail({ ...selectedPlayer, balance: data.new_balance })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setIsAdjusting(false)
    }
  }

  const handleBan = async (player: ExtendedPlayer) => {
    if (!admin?.id) return
    setIsBanning(true)
    try {
      const { data, error } = await supabase.rpc('admin_toggle_player_ban', {
        p_admin_id: admin.id,
        p_player_id: player.id,
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'حدث خطأ')

      const isBanned = data.new_status === 'banned'
      toast.success(isBanned ? `تم حظر ${player.username}` : `تم رفع الحظر عن ${player.username}`)
      setBanConfirm(null)
      await loadPlayers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setIsBanning(false)
    }
  }

  const handleSetPlayerPassword = async () => {
    if (!selectedPlayer || !admin?.id) return
    if (newPassword.length < 6) return toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')

    setIsSettingPassword(true)
    try {
      const { data, error } = await supabase.rpc('admin_set_player_password', {
        p_admin_id: admin.id,
        p_player_id: selectedPlayer.id,
        p_new_password: newPassword
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل تحديث كلمة المرور')

      toast.success(`تم تعيين كلمة المرور للاعب ${selectedPlayer.username} بنجاح!`)
      setPasswordModal(false)
      setNewPassword('')
      await loadPlayers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setIsSettingPassword(false)
    }
  }

  const handleToggleLeaderboardExclusion = async (player: ExtendedPlayer) => {
    if (!admin?.id) return
    const newStatus = !player.is_excluded_from_leaderboard
    try {
      const { data, error } = await supabase.rpc('admin_toggle_leaderboard_exclusion', {
        p_admin_id: admin.id,
        p_player_id: player.id,
        p_exclude: newStatus
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل التعديل')

      toast.success(data.message || (newStatus ? 'تم استبعاد اللاعب من لوحة المتصدرين' : 'تمت إعادة اللاعب للوحة المتصدرين'))
      await loadPlayers()
      if (selectedPlayer?.id === player.id) {
        setSelectedPlayer(prev => prev ? { ...prev, is_excluded_from_leaderboard: newStatus } : null)
      }
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء تعديل الاستبعاد')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`تم نسخ ${label}`)
  }

  const openGrantCardModal = async (player?: ExtendedPlayer) => {
    if (player) {
      setTargetPlayerForCard(player)
      setTargetPlayerId(player.id)
    } else {
      setTargetPlayerForCard(null)
      setTargetPlayerId(players[0]?.id || '')
    }
    setCardQuantity(1)
    setCardSearchQuery('')
    setCardRarityFilter('all')
    setGrantCardModal(true)

    if (allCards.length === 0) {
      const { data } = await supabase
        .from('cards')
        .select('id, name, title, element, rarity, image_path, stats')
        .order('rarity')
      if (data && data.length > 0) {
        setAllCards(data)
        setSelectedCardId(data[0].id)
      }
    } else if (!selectedCardId && allCards.length > 0) {
      setSelectedCardId(allCards[0].id)
    }
  }

  const handleGrantCard = async () => {
    if (!admin?.id) return toast.error('يرجى تسجيل الدخول كمسؤول')
    const finalPlayerId = targetPlayerForCard?.id || targetPlayerId
    if (!finalPlayerId) return toast.error('يرجى اختيار اللاعب')
    if (!selectedCardId) return toast.error('يرجى اختيار البطاقة')

    setIsGrantingCard(true)
    try {
      const { data, error } = await supabase.rpc('admin_grant_card_to_player', {
        p_admin_id: admin.id,
        p_player_id: finalPlayerId,
        p_card_id: selectedCardId,
        p_quantity: cardQuantity,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشلت عملية منح البطاقة')

      toast.success(data.message || 'تم منح البطاقة للاعب بنجاح! 🎴')
      setGrantCardModal(false)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء منح البطاقة')
    } finally {
      setIsGrantingCard(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">إدارة اللاعبين والحسابات</h1>
          <p className="text-slate-400 text-sm mt-1">{players.length} لاعب مسجل في المنصة</p>
        </div>
        <button
          onClick={() => openGrantCardModal()}
          className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-glow-amber bg-amber-500 hover:bg-amber-400 text-black border-none"
        >
          <Sparkles size={16} />
          منح بطاقة نادرة للاعب
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="البحث بالاسم..."
          className="input-field pr-10 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner text="جارٍ التحميل..." /></div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>اللاعب</th>
                  <th>الرصيد</th>
                  <th>أمان الحساب</th>
                  <th className="hidden sm:table-cell">الرهانات</th>
                  <th className="hidden md:table-cell">الفوز/الخسارة</th>
                  <th className="hidden lg:table-cell">الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(player => {
                  const hasPassword = !!player.password_hash
                  return (
                    <tr key={player.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                            player.account_status === 'banned'
                              ? 'bg-red-500'
                              : 'bg-gradient-to-br from-primary-500 to-purple-600'
                          }`}>
                            {player.username[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{player.username}</span>
                            {player.recovery_code && (
                              <span className="font-mono text-[10px] text-slate-500">
                                {player.recovery_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`font-bold number-ltr ${player.balance < 0 ? 'text-red-400' : 'text-white'}`}>
                          {player.balance.toLocaleString('ar-EG')}
                        </span>
                      </td>
                      <td>
                        {hasPassword ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Lock size={11} /> محمي بكلمة مرور
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <ShieldAlert size={11} /> بدون كلمة مرور
                          </span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell text-slate-400 number-ltr">{player.total_bets}</td>
                      <td className="hidden md:table-cell">
                        <span className="text-green-400 number-ltr">{player.winning_bets}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-red-400 number-ltr">{player.losing_bets}</span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className={`badge text-xs ${
                          player.account_status === 'active' ? 'badge-open' :
                          player.account_status === 'banned' ? 'badge-closed' : 'badge-draft'
                        }`}>
                          {player.account_status === 'active' ? 'نشط' : player.account_status === 'banned' ? 'محظور' : 'موقوف'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openPlayerDetail(player)}
                            className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                            title="عرض التفاصيل والأمان"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleLeaderboardExclusion(player)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              player.is_excluded_from_leaderboard
                                ? 'bg-purple-500/30 text-purple-300 hover:bg-purple-500/40'
                                : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                            title={player.is_excluded_from_leaderboard ? 'إعادة للوحة المتصدرين' : 'استبعاد من لوحة المتصدرين'}
                          >
                            {player.is_excluded_from_leaderboard ? <UserX size={14} /> : <Trophy size={14} />}
                          </button>
                          <button
                            onClick={() => openGrantCardModal(player)}
                            className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 flex items-center justify-center text-amber-300 transition-colors"
                            title="منح بطاقة للاعب"
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPlayer(player)
                              setPasswordModal(true)
                            }}
                            className="w-8 h-8 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 flex items-center justify-center text-primary-300 transition-colors"
                            title="تعيين كلمة مرور للاعب"
                          >
                            <Key size={14} />
                          </button>
                          <button
                            onClick={() => setBanConfirm(player)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              player.account_status === 'banned'
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                            title={player.account_status === 'banned' ? 'رفع الحظر' : 'حظر'}
                          >
                            <Ban size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      <Modal isOpen={playerDetailOpen} onClose={() => setPlayerDetailOpen(false)} title={`تفاصيل اللاعب: ${selectedPlayer?.username}`} size="lg">
        {selectedPlayer && (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto" dir="rtl">
            {/* Leaderboard Exclusion Control */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy size={20} className="text-purple-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white text-sm block">الظهور في لوحة المتصدرين العامة</span>
                    <span className="text-xs text-slate-400">
                      {selectedPlayer.is_excluded_from_leaderboard
                        ? 'الحساب مستبعد حالياً من التصنيفات العامة (الحساب نشط ويلعب طبيعياً ولكن لا يظهر في الترتيب)'
                        : 'الحساب يظهر بشكل طبيعي في قائمة أفضل اللاعبين'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleLeaderboardExclusion(selectedPlayer)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    selectedPlayer.is_excluded_from_leaderboard
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {selectedPlayer.is_excluded_from_leaderboard ? (
                    <>
                      <UserCheck size={14} /> إعادة للمتصدرين
                    </>
                  ) : (
                    <>
                      <UserX size={14} /> استبعاد من المتصدرين
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Account Security Box */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-primary-400" />
                  <span className="font-bold text-white text-sm">بيانات أمان الحساب</span>
                </div>
                {selectedPlayer.password_hash ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                    محمي بكلمة مرور
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    يحتاج تعيين كلمة مرور
                  </span>
                )}
              </div>

              {selectedPlayer.recovery_code && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-slate-700">
                  <div>
                    <p className="text-[11px] text-slate-400">رمز استرداد اللاعب (Recovery Code):</p>
                    <code className="text-amber-300 font-mono font-bold text-sm tracking-wider">
                      {selectedPlayer.recovery_code}
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedPlayer.recovery_code || '', 'رمز الاسترداد')}
                    className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="نسخ الرمز"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setPasswordModal(true)}
                  className="btn-primary flex-1 py-2 text-xs font-bold gap-1.5"
                >
                  <Key size={14} />
                  {selectedPlayer.password_hash ? 'إعادة تعيين كلمة المرور' : 'تعيين كلمة مرور للاعب'}
                </button>
                <button
                  onClick={() => setAdjustModal(true)}
                  className="btn-secondary flex-1 py-2 text-xs font-bold gap-1.5"
                >
                  <Wallet size={14} />
                  تعديل الرصيد يدوياً
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'الرصيد الحالي', value: `${selectedPlayer.balance.toLocaleString('ar-EG')} نقطة`, color: selectedPlayer.balance < 0 ? 'text-red-400' : 'text-white' },
                { label: 'إجمالي الأرباح', value: `+${selectedPlayer.total_winnings.toLocaleString('ar-EG')}`, color: 'text-green-400' },
                { label: 'رهانات فائزة', value: String(selectedPlayer.winning_bets), color: 'text-green-400' },
                { label: 'رهانات خاسرة', value: String(selectedPlayer.losing_bets), color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="glass-card rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                  <p className={`font-bold number-ltr ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Player Owned Titles */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-400" />
                  <span className="font-bold text-white text-sm">الألقاب الشرفية المملوكة ({playerTitlesList.length})</span>
                </div>
                {selectedPlayer.equipped_title_id && (
                  <button
                    onClick={async () => {
                      await supabase.from('players').update({ equipped_title_id: null }).eq('id', selectedPlayer.id)
                      setSelectedPlayer({ ...selectedPlayer, equipped_title_id: null })
                      toast.success('تم إلغاء تجهيز اللقب لهذا اللاعب')
                      await loadPlayers()
                    }}
                    className="text-xs text-amber-400 hover:underline font-bold"
                  >
                    إلغاء تجهيز اللقب الحالي
                  </button>
                )}
              </div>

              {playerTitlesList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">لا يمتلك اللاعب أي ألقاب شرفية حالياً</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {playerTitlesList.map((pt) => {
                    const title = pt.title
                    const isEquipped = selectedPlayer.equipped_title_id === pt.title_id
                    const isRevoking = revokingTitleId === pt.title_id

                    return (
                      <div key={pt.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {title && <PlayerTitleBadge title={title} />}
                          {isEquipped && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              مجهّز ⭐
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isRevoking}
                          onClick={() => handleRevokeTitleFromPlayerDetail(pt.title_id)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                          title="سحب هذا اللقب من اللاعب"
                        >
                          {isRevoking ? <Loader2 className="animate-spin" size={12} /> : <X size={12} />}
                          سحب اللقب
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bets */}
            <div>
              <h4 className="text-sm font-bold text-slate-300 mb-3">آخر الرهانات</h4>
              {playerBets.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">لا توجد رهانات بعد</p>
              ) : (
                <div className="space-y-2">
                  {playerBets.map(bet => (
                    <div key={bet.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 text-xs">
                      <div>
                        <span className="text-slate-400">الرهان: </span>
                        <span className="text-white font-semibold number-ltr">{bet.stake.toLocaleString('ar-EG')}</span>
                        <span className="text-slate-500 mr-2">×{bet.multiplier_snapshot}</span>
                      </div>
                      <span className={`badge ${getBetStatusClass(bet.status)}`}>
                        {getBetStatusLabel(bet.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transactions */}
            <div>
              <h4 className="text-sm font-bold text-slate-300 mb-3">سجل المعاملات</h4>
              {playerTransactions.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">لا توجد معاملات</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {playerTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 text-xs">
                      <div>
                        <p className="text-slate-300 font-medium">{getTransactionTypeLabel(tx.transaction_type)}</p>
                        <p className="text-slate-500 text-[11px]">{tx.description}</p>
                      </div>
                      <div className="text-left">
                        <p className={`font-bold number-ltr ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('ar-EG')}
                        </p>
                        <p className="text-slate-500 text-[10px]">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Set Player Password Modal */}
      <Modal isOpen={passwordModal} onClose={() => !isSettingPassword && setPasswordModal(false)} title={`تعيين كلمة مرور: ${selectedPlayer?.username}`} size="sm">
        <div className="p-6 space-y-4" dir="rtl">
          <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs text-primary-300 leading-relaxed">
            🔑 يمكنك كمشرف تعيين كلمة مرور جديدة مباشرة لحساب اللاعب لمساعدته في تأمين حسابه أو استعادته.
          </div>

          <div>
            <label className="field-label text-xs font-bold text-slate-300 mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="6 أحرف أو أرقام على الأقل..."
              className="input-field"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSetPlayerPassword}
              disabled={isSettingPassword || newPassword.length < 6}
              className="btn-primary flex-1 py-2.5 text-xs font-bold gap-1.5"
            >
              {isSettingPassword ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isSettingPassword ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
            </button>
            <button
              onClick={() => { setPasswordModal(false); setNewPassword(''); }}
              className="btn-secondary flex-1 py-2.5 text-xs"
            >
              <X size={14} /> إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Adjust Balance Modal */}
      <Modal isOpen={adjustModal} onClose={() => !isAdjusting && setAdjustModal(false)} title="تعديل الرصيد يدوياً" size="sm">
        <div className="p-6 space-y-4" dir="rtl">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            ⚠️ هذه العملية ستُسجَّل في سجل المعاملات ولوج المراجعة.
          </div>
          <div>
            <label className="field-label">المبلغ (موجب للإضافة، سالب للخصم)</label>
            <input
              type="number"
              value={adjustAmount}
              onChange={e => setAdjustAmount(e.target.value)}
              placeholder="مثال: 100 أو -50"
              className="input-field"
            />
          </div>
          <div>
            <label className="field-label">سبب التعديل *</label>
            <input
              type="text"
              value={adjustReason}
              onChange={e => setAdjustReason(e.target.value)}
              placeholder="أدخل سبباً واضحاً..."
              className="input-field"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdjust} disabled={isAdjusting} className="btn-primary flex-1">
              {isAdjusting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isAdjusting ? 'جارٍ التعديل...' : 'تأكيد التعديل'}
            </button>
            <button onClick={() => setAdjustModal(false)} className="btn-secondary flex-1">
              <X size={14} /> إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Ban Confirm */}
      <ConfirmDialog
        isOpen={!!banConfirm}
        onClose={() => setBanConfirm(null)}
        onConfirm={() => banConfirm && handleBan(banConfirm)}
        title={banConfirm?.account_status === 'banned' ? 'رفع الحظر' : 'حظر اللاعب'}
        message={`هل أنت متأكد من ${banConfirm?.account_status === 'banned' ? 'رفع الحظر عن' : 'حظر'} اللاعب "${banConfirm?.username}"؟`}
        confirmLabel={banConfirm?.account_status === 'banned' ? 'رفع الحظر' : 'حظر'}
        variant={banConfirm?.account_status === 'banned' ? 'success' : 'danger'}
        isLoading={isBanning}
      />

      {/* Grant Card Modal */}
      <Modal 
        isOpen={grantCardModal} 
        onClose={() => !isGrantingCard && setGrantCardModal(false)} 
        title="منح بطاقة للاعب من لوحة الإدارة" 
        size="lg"
      >
        <div className="p-6 space-y-5" dir="rtl">
          {/* Target Player */}
          {targetPlayerForCard ? (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">اللاعب المستلم:</span>
                <span className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {targetPlayerForCard.username}
                </span>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-400 block">الرصيد:</span>
                <span className="text-xs font-mono font-bold text-amber-400">{targetPlayerForCard.balance.toLocaleString()} نقطة</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="field-label">اختر اللاعب المستلم *</label>
              <select
                value={targetPlayerId}
                onChange={e => setTargetPlayerId(e.target.value)}
                className="select-field text-sm font-bold"
              >
                {players.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.username} ({p.balance.toLocaleString()} نقطة)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Card Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="field-label mb-0">اختر البطاقة المراد منحها *</label>
              <span className="text-xs text-slate-500">
                {(allCards || []).filter(c => {
                  if (!c || !c.id) return false
                  const q = cardSearchQuery.trim().toLowerCase()
                  const matchesSearch = !q || (c.name && c.name.toLowerCase().includes(q))
                  const matchesRarity = cardRarityFilter === 'all' || (c.rarity && c.rarity.toLowerCase() === cardRarityFilter.toLowerCase())
                  return matchesSearch && matchesRarity
                }).length} بطاقة متاحة
              </span>
            </div>

            {/* Filter and search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={cardSearchQuery}
                  onChange={e => setCardSearchQuery(e.target.value)}
                  placeholder="ابحث باسم البطاقة..."
                  className="input-field pr-9 py-2 text-xs w-full"
                />
              </div>
              <select
                value={cardRarityFilter}
                onChange={e => setCardRarityFilter(e.target.value)}
                className="select-field text-xs py-2 px-3"
              >
                <option value="all">جميع الدرجات</option>
                <option value="mythic">Mythic (ميثيكي)</option>
                <option value="legendary">Legendary (أسطوري)</option>
                <option value="epic">Epic (ملحمي)</option>
                <option value="rare">Rare (نادر)</option>
                <option value="common">Common (شائع)</option>
              </select>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {(allCards || []).filter(c => {
                if (!c || !c.id) return false
                const q = cardSearchQuery.trim().toLowerCase()
                const matchesSearch = !q || (c.name && c.name.toLowerCase().includes(q))
                const matchesRarity = cardRarityFilter === 'all' || (c.rarity && c.rarity.toLowerCase() === cardRarityFilter.toLowerCase())
                return matchesSearch && matchesRarity
              }).map(c => {
                const isSelected = selectedCardId === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCardId(c.id)}
                    className={`p-2 rounded-2xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-12 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-slate-700/60">
                      <img src={c.image_path || '/characters/changli.webp'} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-white block truncate">{c.name}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-bold uppercase text-amber-400">{c.rarity}</span>
                        <span className="text-[10px] text-slate-500">• {c.element}</span>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-amber-400 shrink-0" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">عدد النسخ الممنوحة (Quantity)</span>
              <span className="text-[11px] text-slate-400">كم نسخة سيحصل عليها اللاعب في مخزونه</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10"
                value={cardQuantity}
                onChange={e => setCardQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                className="w-16 bg-slate-950 border border-slate-700 rounded-xl p-2 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-400">نسخة</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGrantCard}
              disabled={isGrantingCard || !selectedCardId}
              className="btn-primary flex-1 py-3 text-xs font-bold shadow-glow-amber bg-amber-500 hover:bg-amber-400 text-black border-none"
            >
              {isGrantingCard ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isGrantingCard ? 'جارٍ منح البطاقة...' : 'تأكيد ومنح البطاقة للاعب'}
            </button>
            <button
              onClick={() => setGrantCardModal(false)}
              disabled={isGrantingCard}
              className="btn-secondary py-3 px-5 text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
