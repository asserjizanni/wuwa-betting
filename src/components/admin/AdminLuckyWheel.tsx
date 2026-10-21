import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCw, Plus, Edit2, Trash2, Save, Shield, Check,
  AlertCircle, Sparkles, Coins, Gift, Trophy, User, Users,
  Search, RefreshCw, Eye, Sliders, BarChart2, Layers, Copy, CheckCheck
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store'
import {
  getAdminPrizes,
  saveAdminPrize,
  deleteAdminPrize,
  getAdminSettings,
  saveAdminSettings,
  grantPlayerSpins,
  resetPlayerSpins,
  getSpinLogs
} from '../../lib/luckyWheelService'
import type {
  LuckyWheelPrize,
  LuckyWheelSettings,
  LuckyWheelSpinLog,
  LuckyWheelPrizeType
} from '../../types/luckyWheel'
import { LuckyWheelCanvas } from '../wheel/LuckyWheelCanvas'
import toast from 'react-hot-toast'

type AdminWheelTab = 'prizes' | 'settings' | 'players' | 'logs' | 'sql'

const COLOR_PRESETS = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
  '#ec4899', '#8b5cf6', '#3b82f6', '#f97316',
  '#ef4444', '#14b8a6', '#d946ef', '#eab308'
]

export function AdminLuckyWheel() {
  const admin = useAuthStore(state => state.admin)
  const [activeTab, setActiveTab] = useState<AdminWheelTab>('prizes')

  // Data states
  const [prizes, setPrizes] = useState<LuckyWheelPrize[]>([])
  const [settings, setSettings] = useState<LuckyWheelSettings>({
    id: 'default',
    is_enabled: true,
    spins_per_period: 1,
    period_type: 'daily',
    period_hours: 24,
    rollover_unused: false,
    max_accumulated_spins: 10
  })
  const [availableCards, setAvailableCards] = useState<Array<{ id: string; name: string; rarity: string; image_path: string }>>([])
  const [availableTitles, setAvailableTitles] = useState<Array<{ id: string; name_ar: string; rarity: string; icon: string; color: string }>>([])
  const [loading, setLoading] = useState(true)

  // Edit / Create Prize Modal
  const [prizeModalOpen, setPrizeModalOpen] = useState(false)
  const [editingPrize, setEditingPrize] = useState<Partial<LuckyWheelPrize> | null>(null)
  const [savingPrize, setSavingPrize] = useState(false)

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false)

  // Player Management
  const [playerSearch, setPlayerSearch] = useState('')
  const [searchingPlayers, setSearchingPlayers] = useState(false)
  const [playerResults, setPlayerResults] = useState<any[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null)
  const [bonusCount, setBonusCount] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)

  // Spin Logs
  const [logs, setLogs] = useState<LuckyWheelSpinLog[]>([])
  const [logsCount, setLogsCount] = useState(0)
  const [logsSearch, setLogsSearch] = useState('')
  const [loadingLogs, setLoadingLogs] = useState(false)

  // SQL Copy State
  const [copiedSql, setCopiedSql] = useState(false)

  // Load All Core Data
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [prizesData, settingsData, cardsRes, titlesRes] = await Promise.all([
        getAdminPrizes(),
        getAdminSettings(),
        supabase.from('cards').select('id, name, rarity, image_path').order('name', { ascending: true }),
        supabase.from('titles').select('id, name_ar, rarity, icon, color').eq('is_active', true).order('name_ar', { ascending: true })
      ])

      setPrizes(prizesData)
      setSettings(settingsData)
      if (cardsRes.data) setAvailableCards(cardsRes.data as any)
      if (titlesRes.data) setAvailableTitles(titlesRes.data as any)
    } catch (err: any) {
      toast.error('حدث خطأ أثناء تحميل بيانات الإدارة')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Total weight & probability calculation
  const totalWeight = useMemo(() => {
    return prizes.reduce((acc, p) => acc + (p.is_active ? Number(p.weight || 0) : 0), 0)
  }, [prizes])

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveAdminSettings(settings)
      toast.success('تم حفظ إعدادات عجلة الحظ بنجاح! ⚙️')
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ الإعدادات')
    }
  }

  // Open Create Prize Modal
  const handleOpenCreatePrize = () => {
    setEditingPrize({
      name: '',
      prize_type: 'dollars',
      prize_value: 100,
      card_copies: 1,
      title_duplicate_reward_dollars: 250,
      color: COLOR_PRESETS[prizes.length % COLOR_PRESETS.length],
      weight: 10,
      is_active: true,
      is_rare: false,
      is_legendary: false,
      display_order: prizes.length + 1
    })
    setPrizeModalOpen(true)
  }

  // Open Edit Prize Modal
  const handleOpenEditPrize = (prize: LuckyWheelPrize) => {
    setEditingPrize({ ...prize })
    setPrizeModalOpen(true)
  }

  // Save Prize Handler
  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPrize?.name?.trim()) return toast.error('يرجى إدخال اسم الجائزة')
    if (Number(editingPrize.weight || 0) <= 0) return toast.error('يجب أن يكون وزن الاحتمال أكبر من صفر')

    setSavingPrize(true)
    try {
      await saveAdminPrize(editingPrize)
      toast.success('تم حفظ الجائزة بنجاح! 🎯')
      setPrizeModalOpen(false)
      const updated = await getAdminPrizes()
      setPrizes(updated)
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ الجائزة')
    } finally {
      setSavingPrize(false)
    }
  }

  // Delete Prize Handler
  const handleDeletePrize = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الجائزة: "${name}"؟`)) return
    try {
      await deleteAdminPrize(id)
      toast.success('تم حذف الجائزة بنجاح')
      setPrizes(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      toast.error(err.message || 'فشل حذف الجائزة')
    }
  }

  // Search Players
  const handleSearchPlayers = async () => {
    if (!playerSearch.trim()) return
    setSearchingPlayers(true)
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, username, balance, account_status')
        .ilike('username', `%${playerSearch.trim()}%`)
        .limit(10)

      if (error) throw error
      setPlayerResults(data || [])
    } catch (err: any) {
      toast.error('فشل البحث عن اللاعبين')
    } finally {
      setSearchingPlayers(false)
    }
  }

  // Grant Extra Spins
  const handleGrantBonus = async (playerId: string) => {
    if (!admin?.id) return toast.error('يرجى تسجيل الدخول كمسؤول أولاً')
    setActionLoading(true)
    try {
      const msg = await grantPlayerSpins(admin.id, playerId, bonusCount)
      toast.success(msg)
      setSelectedPlayer(null)
    } catch (err: any) {
      toast.error(err.message || 'فشل منح المحاولات')
    } finally {
      setActionLoading(false)
    }
  }

  // Reset Player Spins
  const handleResetSpins = async (playerId: string) => {
    if (!admin?.id) return toast.error('يرجى تسجيل الدخول كمسؤول أولاً')
    if (!window.confirm('هل تريد إعادة تعيين محاولات اللاعب فوراً؟')) return
    setActionLoading(true)
    try {
      const msg = await resetPlayerSpins(admin.id, playerId)
      toast.success(msg)
      setSelectedPlayer(null)
    } catch (err: any) {
      toast.error(err.message || 'فشل إعادة التعيين')
    } finally {
      setActionLoading(false)
    }
  }

  // Load Logs
  const loadLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await getSpinLogs(50, logsSearch)
      setLogs(res.logs)
      setLogsCount(res.totalCount)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs()
    }
  }, [activeTab, logsSearch])

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <RotateCw size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>إدارة عجلة الحظ (Lucky Wheel)</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                settings.is_enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {settings.is_enabled ? 'مفعلة' : 'معطلة'}
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              تحكم بالجوائز، نسب واحتمالات الفوز، فترات تجدد المحاولات، وسجلات السحب.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPreviewOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Eye size={15} />
            <span>معاينة العجلة</span>
          </button>
          <button
            onClick={handleOpenCreatePrize}
            className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>إضافة جائزة جديدة</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('prizes')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'prizes'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gift size={16} />
          <span>الجوائز والاحتمالات ({prizes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'settings'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders size={16} />
          <span>إعدادات النظام والمحاولات</span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'players'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users size={16} />
          <span>محاولات اللاعبين والمكافآت</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'logs'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart2 size={16} />
          <span>سجل السحوبات والإحصائيات</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'sql'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers size={16} />
          <span>ملف تفعيل قاعدة البيانات (SQL)</span>
        </button>
      </div>

      {/* TAB 1: PRIZES */}
      {activeTab === 'prizes' && (
        <div className="space-y-4">
          {/* Probability Summary Notice */}
          <div className="p-4 rounded-2xl glass-card border border-primary-500/20 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="text-amber-400" size={17} />
              <span>إجمالي أوزان الجوائز النشطة:</span>
              <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-lg">
                {totalWeight} نقطة وزن
              </span>
            </div>
            <span className="text-slate-400 text-xs">
              النسب المئوية المحسوبة تلقائياً تمثل الفرصة الدقيقة لكل جائزة أثناء الدوران.
            </span>
          </div>

          {/* Prizes Table/Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map((p, idx) => {
              const probPct = totalWeight > 0 && p.is_active ? Math.round((Number(p.weight) / totalWeight) * 1000) / 10 : 0
              return (
                <div
                  key={p.id || idx}
                  className="glass-card rounded-2xl p-4 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col justify-between relative group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: p.color || '#6366f1' }}
                      >
                        {p.prize_type === 'dollars' ? (
                          <Coins size={20} />
                        ) : p.prize_type === 'card' ? (
                          <Sparkles size={20} />
                        ) : p.prize_type === 'title' ? (
                          <Trophy size={20} />
                        ) : (
                          <Gift size={20} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm line-clamp-1">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {p.prize_type === 'dollars' ? `$${p.prize_value}` : p.prize_type}
                          </span>
                          {p.is_legendary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              أسطوري
                            </span>
                          )}
                          {p.is_rare && !p.is_legendary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              نادر
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-amber-400">
                        {probPct}%
                      </div>
                      <div className="text-[10px] text-slate-400">وزن: {p.weight}</div>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {p.description}
                    </p>
                  )}

                  <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      p.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {p.is_active ? 'نشط' : 'معطل'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditPrize(p)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="تعديل"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeletePrize(p.id, p.name)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/60 max-w-2xl space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <Sliders size={20} className="text-primary-400" />
            <span>إعدادات تشغيل العجلة وفترة المحاولات</span>
          </h3>

          {/* Master Enable */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <div>
              <div className="font-bold text-white text-sm">حالة العجلة العامة</div>
              <div className="text-xs text-slate-400">تفعيل أو تعطيل عجلة الحظ بالكامل لجميع اللاعبين</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_enabled}
                onChange={e => setSettings(prev => ({ ...prev, is_enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          {/* Spins Per Period */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              عدد المحاولات المسموحة لكل لاعب خلال الفترة:
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={settings.spins_per_period}
              onChange={e => setSettings(prev => ({ ...prev, spins_per_period: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-sm focus:border-primary-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">مثال: 1 تعني محاولة واحدة مجانية كل فترة، 3 تعني 3 محاولات.</p>
          </div>

          {/* Period Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                نوع الفترة الزمنية:
              </label>
              <select
                value={settings.period_type}
                onChange={e => {
                  const val = e.target.value as any
                  let hrs = 24
                  if (val === 'hours_12') hrs = 12
                  if (val === 'weekly') hrs = 168
                  setSettings(prev => ({ ...prev, period_type: val, period_hours: hrs }))
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-primary-500 outline-none"
              >
                <option value="daily">يومياً (كل 24 ساعة)</option>
                <option value="hours_12">نصف يومي (كل 12 ساعة)</option>
                <option value="weekly">أسبوعياً (كل 7 أيام)</option>
                <option value="custom_hours">فترة مخصصة بالساعات</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                عدد الساعات الفعلي للفترة:
              </label>
              <input
                type="number"
                min="1"
                max="720"
                value={settings.period_hours}
                onChange={e => setSettings(prev => ({ ...prev, period_hours: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-sm focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Rollover Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <div>
              <div className="font-bold text-white text-sm">ترحيل المحاولات غير المستخدمة</div>
              <div className="text-xs text-slate-400">إذا لم يستخدم اللاعب محاولته، هل تنتقل للفترة التالية أم تنتهي؟</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.rollover_unused}
                onChange={e => setSettings(prev => ({ ...prev, rollover_unused: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>حفظ إعدادات عجلة الحظ</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: PLAYERS ATTEMPTS */}
      {activeTab === 'players' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/60 max-w-3xl space-y-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Users size={20} className="text-primary-400" />
              <span>إدارة محاولات اللاعبين والمكافآت الإضافية</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              ابحث عن أي لاعب لمنحه محاولات إضافية فورية أو إعادة تعيين محاولاته الحالية.
            </p>
          </div>

          {/* Player Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث باسم المستخدم..."
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchPlayers()}
                className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-primary-500 outline-none"
              />
            </div>
            <button
              onClick={handleSearchPlayers}
              disabled={searchingPlayers}
              className="btn-primary text-xs font-bold px-5 py-2.5 flex items-center gap-1.5"
            >
              {searchingPlayers ? <RotateCw size={14} className="animate-spin" /> : <Search size={14} />}
              <span>بحث</span>
            </button>
          </div>

          {/* Player Search Results */}
          {playerResults.length > 0 && (
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <span className="text-xs text-slate-400 font-bold">اللاعبون المطابقون:</span>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {playerResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlayer(p)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedPlayer?.id === p.id
                        ? 'bg-primary-500/20 border-primary-500/50 text-white'
                        : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{p.username}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        رصيد: ${Number(p.balance || 0).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 font-bold text-primary-400">
                      اختيار
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions for Selected Player */}
          {selectedPlayer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-slate-800/80 border border-primary-500/30 space-y-4"
            >
              <div className="font-bold text-white text-sm flex items-center justify-between">
                <span>اللاعب المختار: <span className="text-amber-400">{selectedPlayer.username}</span></span>
                <span className="text-xs text-slate-400 font-mono">ID: {selectedPlayer.id.substring(0, 8)}...</span>
              </div>

              {/* Grant Bonus Spins */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white text-xs">منح محاولات إضافية مجانية</div>
                  <div className="text-[11px] text-slate-400">تضاف فوراً إلى رصيد محاولات اللاعب دون انتظار الفترة</div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={bonusCount}
                    onChange={e => setBonusCount(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-600 text-white font-mono text-center text-xs"
                  />
                  <button
                    onClick={() => handleGrantBonus(selectedPlayer.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    + منح المحاولات
                  </button>
                </div>
              </div>

              {/* Reset Spins */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">إعادة تعيين محاولات الفترة</div>
                  <div className="text-[11px] text-slate-400">إلغاء المحاولات المستهلكة وإتاحة الدوران فوراً</div>
                </div>

                <button
                  onClick={() => handleResetSpins(selectedPlayer.id)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors"
                >
                  إعادة التعيين 🔄
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* TAB 4: LOGS & ANALYTICS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-72">
              <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
              <input
                type="text"
                placeholder="تصفية باسم الجائزة..."
                value={logsSearch}
                onChange={e => setLogsSearch(e.target.value)}
                className="w-full pr-8 pl-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:border-primary-500 outline-none"
              />
            </div>

            <button
              onClick={loadLogs}
              disabled={loadingLogs}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={13} className={loadingLogs ? 'animate-spin' : ''} />
              <span>تحديث السجل</span>
            </button>
          </div>

          {/* Logs Table */}
          <div className="glass-card rounded-2xl border border-slate-700/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700 font-bold">
                  <tr>
                    <th className="p-3">اللاعب</th>
                    <th className="p-3">الجائزة المستلمة</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">القيمة / التفاصيل</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {loadingLogs ? 'جارٍ تحميل السجل...' : 'لا توجد سحوبات مسجلة حتى الآن.'}
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-white">
                          {log.player?.username || log.player_id.substring(0, 8)}
                        </td>
                        <td className="p-3 text-amber-300 font-bold">{log.prize_name}</td>
                        <td className="p-3 text-slate-400">{log.prize_type}</td>
                        <td className="p-3 font-mono text-slate-300">
                          {log.prize_type === 'dollars' ? `$${log.prize_value}` : 'مكافأة خاصة'}
                        </td>
                        <td className="p-3 text-slate-400">
                          {new Date(log.created_at).toLocaleString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            ناجحة ✓
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SQL MIGRATION FILE */}
      {activeTab === 'sql' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Layers size={20} className="text-amber-400" />
                <span>ملف تهيئة قاعدة بيانات عجلة الحظ (Migration V8)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                انسخ هذا الاستعلام وشغّله في <b>Supabase SQL Editor</b> لتفعيل الجداول ودوائر الأمان الذرية فوراً.
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`-- ملف migration_v8_lucky_wheel_system.sql متاح في مشروعك داخل مجلد supabase/`)
                setCopiedSql(true)
                setTimeout(() => setCopiedSql(false), 2000)
                toast.success('تم نسخ مسار الملف وملاحظات التنفيذ!')
              }}
              className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5"
            >
              {copiedSql ? <CheckCheck size={15} /> : <Copy size={15} />}
              <span>{copiedSql ? 'تم النسخ!' : 'نسخ الاستعلام'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto max-h-96">
            <pre>
{`-- مسار الملف في مشروعك:
-- supabase/migration_v8_lucky_wheel_system.sql

1. افتح لوحة تحكم Supabase الخاصة بك:
https://supabase.com/dashboard/project/axaoxpeqlobiljrromun

2. توجه إلى تبويبة "SQL Editor"
3. الصق محتوى الملف: supabase/migration_v8_lucky_wheel_system.sql
4. اضغط على زر "Run"`}
            </pre>
          </div>
        </div>
      )}

      {/* PRIZE CREATE/EDIT MODAL */}
      <AnimatePresence>
        {prizeModalOpen && editingPrize && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-xl w-full rounded-3xl p-6 border border-slate-700 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-5">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Gift size={20} className="text-primary-400" />
                  <span>{editingPrize.id ? 'تعديل الجائزة' : 'إضافة جائزة جديدة'}</span>
                </h3>
                <button
                  onClick={() => setPrizeModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePrize} className="space-y-4 text-xs sm:text-sm">
                {/* Prize Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم الجائزة:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 500 Dollars أو بطاقة تشانغلي الأسطورية"
                    value={editingPrize.name || ''}
                    onChange={e => setEditingPrize(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-primary-500"
                  />
                </div>

                {/* Prize Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">نوع الجائزة:</label>
                    <select
                      value={editingPrize.prize_type || 'dollars'}
                      onChange={e => {
                        const val = e.target.value as LuckyWheelPrizeType
                        setEditingPrize(prev => ({ ...prev, prize_type: val }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-primary-500"
                    >
                      <option value="dollars">دولارات نقدية (Dollars $)</option>
                      <option value="card">بطاقة ريزوناتور (Card)</option>
                      <option value="title">لقب شرفي (Title)</option>
                      <option value="custom">مكافأة خاصة (Custom)</option>
                    </select>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      وزن الاحتمال (Weight):
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      required
                      value={editingPrize.weight || 10}
                      onChange={e => setEditingPrize(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Specific Type Details */}
                {editingPrize.prize_type === 'dollars' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">مبلغ الدولارات:</label>
                    <input
                      type="number"
                      min="1"
                      value={editingPrize.prize_value || 100}
                      onChange={e => setEditingPrize(prev => ({ ...prev, prize_value: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono outline-none focus:border-primary-500"
                    />
                  </div>
                )}

                {editingPrize.prize_type === 'card' && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">اختر البطاقة من قاعدة البيانات:</label>
                      <select
                        value={editingPrize.card_id || ''}
                        onChange={e => {
                          const cid = e.target.value
                          const found = availableCards.find(c => c.id === cid)
                          setEditingPrize(prev => ({
                            ...prev,
                            card_id: cid,
                            image_url: found?.image_path || prev?.image_url,
                            name: prev?.name || found?.name || ''
                          }))
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-primary-500"
                      >
                        <option value="">-- اختر بطاقة --</option>
                        {availableCards.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.rarity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">عدد النسخ الممنوحة:</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editingPrize.card_copies || 1}
                        onChange={e => setEditingPrize(prev => ({ ...prev, card_copies: Number(e.target.value) }))}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono outline-none"
                      />
                    </div>
                  </div>
                )}

                {editingPrize.prize_type === 'title' && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">اختر اللقب من النظام الحالي:</label>
                      <select
                        value={editingPrize.title_id || ''}
                        onChange={e => {
                          const tid = e.target.value
                          const found = availableTitles.find(t => t.id === tid)
                          setEditingPrize(prev => ({
                            ...prev,
                            title_id: tid,
                            name: prev?.name || found?.name_ar || '',
                            color: found?.color || prev?.color
                          }))
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-primary-500"
                      >
                        <option value="">-- اختر لقباً --</option>
                        {availableTitles.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.icon} {t.name_ar} ({t.rarity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        تعويض الدولارات إذا كان اللاعب يمتلك اللقب مسبقاً ($):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editingPrize.title_duplicate_reward_dollars || 250}
                        onChange={e => setEditingPrize(prev => ({ ...prev, title_duplicate_reward_dollars: Number(e.target.value) }))}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">لون القطاع في العجلة:</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setEditingPrize(prev => ({ ...prev, color: c }))}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          editingPrize.color === c ? 'scale-125 border-white shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={editingPrize.color || '#6366f1'}
                      onChange={e => setEditingPrize(prev => ({ ...prev, color: e.target.value }))}
                      className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الوصف المختصر:</label>
                  <input
                    type="text"
                    placeholder="وصف تشويقي يظهر للاعب عند الفوز"
                    value={editingPrize.description || ''}
                    onChange={e => setEditingPrize(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-primary-500"
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPrize.is_active ?? true}
                      onChange={e => setEditingPrize(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-xs font-bold text-white">نشطة</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPrize.is_rare ?? false}
                      onChange={e => setEditingPrize(prev => ({ ...prev, is_rare: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-xs font-bold text-indigo-300">نادرة</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPrize.is_legendary ?? false}
                      onChange={e => setEditingPrize(prev => ({ ...prev, is_legendary: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-xs font-bold text-amber-300">أسطورية</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={savingPrize}
                    className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Save size={15} />
                    <span>{savingPrize ? 'جارٍ الحفظ...' : 'حفظ الجائزة'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrizeModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WHEEL PREVIEW MODAL */}
      <AnimatePresence>
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-lg w-full rounded-3xl p-6 border border-slate-700 flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Eye size={17} className="text-primary-400" />
                  <span>معاينة العجلة المباشرة</span>
                </h3>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <LuckyWheelCanvas
                prizes={prizes.filter(p => p.is_active)}
                isSpinning={false}
                targetIndex={null}
                onSpinEnd={() => {}}
                size={380}
              />

              <p className="text-xs text-slate-400 mt-4 text-center">
                هذا هو المظهر الحقيقي للعجلة الذي يراه اللاعبون الآن.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
