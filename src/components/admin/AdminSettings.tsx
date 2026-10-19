import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sliders, Shield, DollarSign, Swords, Users, Sparkles,
  Gift, Save, Loader2, Check, RefreshCw, Key, Lock, Layers,
  Calculator, AlertCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../shared/UI'
import toast from 'react-hot-toast'

interface GameSetting {
  category: string
  key: string
  value: any
  description: string
}

type SettingsCategory = 'all' | 'auth' | 'economy' | 'challenges' | 'guilds' | 'evolution' | 'fusion' | 'quests'

export function AdminSettings() {
  const { admin } = useAuth()
  const [settings, setSettings] = useState<GameSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<SettingsCategory>('all')
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})

  // Admin password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPwd, setIsChangingPwd] = useState(false)

  // Fusion Simulator State
  const [simHp, setSimHp] = useState(1200)
  const [simAtk, setSimAtk] = useState(380)
  const [simDef, setSimDef] = useState(240)
  const [simSpeed, setSimSpeed] = useState(105)
  const [simCrit, setSimCrit] = useState(8)
  const [simTargetLevel, setSimTargetLevel] = useState(3)

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin?.id) return toast.error('يرجى تسجيل الدخول أولاً')
    if (!currentPassword) return toast.error('أدخل كلمة المرور الحالية')
    if (newPassword.length < 6) return toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    if (newPassword !== confirmPassword) return toast.error('كلمتا المرور غير متطابقتين')

    setIsChangingPwd(true)
    try {
      const { data, error } = await supabase.rpc('admin_change_password', {
        p_admin_id: admin.id,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل التحديث')

      toast.success(data.message || 'تم تحديث كلمة مرور المشرف بنجاح! 🔐')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تغيير كلمة المرور')
    } finally {
      setIsChangingPwd(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true })

      if (error) throw error
      if (data) {
        setSettings(data)
        const initialEdits: Record<string, any> = {}
        data.forEach(s => {
          initialEdits[`${s.category}.${s.key}`] = s.value
        })
        setEditValues(initialEdits)
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تحميل الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSetting = async (category: string, key: string) => {
    if (!admin?.id) return
    const compositeKey = `${category}.${key}`
    const rawVal = editValues[compositeKey]

    setSavingKey(compositeKey)
    try {
      const { data, error } = await supabase.rpc('admin_update_setting', {
        p_admin_id: admin.id,
        p_category: category,
        p_key: key,
        p_value: rawVal
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل حفظ الإعداد')

      toast.success(`تم حفظ: ${key}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setSavingKey(null)
    }
  }

  const updateEditValue = (category: string, key: string, val: any) => {
    setEditValues(prev => ({
      ...prev,
      [`${category}.${key}`]: val
    }))
  }

  const filteredSettings = activeTab === 'all'
    ? settings
    : settings.filter(s => s.category === activeTab)

  const categories = [
    { id: 'all', label: 'جميع الإعدادات', icon: Sliders },
    { id: 'fusion', label: 'دمج البطاقات ✦', icon: Layers },
    { id: 'auth', label: 'التسجيل والأمان', icon: Shield },
    { id: 'economy', label: 'الاقتصاد والمتجر', icon: DollarSign },
    { id: 'challenges', label: 'التحديات والمبارزات', icon: Swords },
    { id: 'guilds', label: 'الكلانات والنقابات', icon: Users },
    { id: 'evolution', label: 'تطوير البطاقات', icon: Sparkles },
    { id: 'quests', label: 'المكافآت والمهام', icon: Gift },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sliders className="text-primary-400" />
            إعدادات النظام والألعاب الشاملة
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            تحكم كامل في جميع ميكانيكيات المنصة: الاقتصاد، الصناديق، التحديات، الترقية، والمكافآت.
          </p>
        </div>
        <button
          onClick={loadSettings}
          className="btn-secondary text-xs self-start sm:self-auto gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          إعادة تحميل
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-700/60">
        {categories.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as SettingsCategory)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === id
                ? 'bg-primary-500 text-white shadow-glow-blue'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Admin Password Change Card */}
      {(activeTab === 'all' || activeTab === 'auth') && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-amber-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Key className="text-amber-400" size={20} />
              <div>
                <h3 className="text-sm font-black text-white">تغيير كلمة مرور المشرف ({admin?.username})</h3>
                <p className="text-xs text-slate-400">تحديث كلمة مرور لوحة التحكم الإدارية فورياً</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              أمان المسؤول
            </span>
          </div>

          <form onSubmit={handleUpdateAdminPassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور الحالية *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="كلمة المرور الحالية"
                required
                className="input-field py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور الجديدة *</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                required
                className="input-field py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">تأكيد كلمة المرور الجديدة *</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="تأكيد الجديدة"
                  required
                  className="input-field py-2 text-xs flex-1"
                />
                <button
                  type="submit"
                  disabled={isChangingPwd || !currentPassword || !newPassword || !confirmPassword}
                  className="btn-primary py-2 px-4 rounded-xl text-xs font-bold shadow-glow-amber bg-amber-500 hover:bg-amber-400 text-black border-none flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isChangingPwd ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  حفظ
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Fusion Simulator Banner when fusion tab is active */}
      {activeTab === 'fusion' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30 shadow-2xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Calculator size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  محاكي ومعاينة إعدادات الدمج التفاعلي
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Live Simulator
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  اختبر نسب الزيادة وعدد النسخ قبل حفظها للتأكد من توازن القوى والقتال
                </p>
              </div>
            </div>

            {/* Level target picker */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-xs text-slate-400 ml-1">مستوى المعاينة:</span>
              {[1, 2, 3, 4, 5].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSimTargetLevel(lvl)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                    simTargetLevel === lvl
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan scale-105'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  ✦ {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Test Base Inputs & Results */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">HP أساسي</label>
              <input
                type="number"
                value={simHp}
                onChange={e => setSimHp(Number(e.target.value))}
                className="input-field text-xs py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">ATK أساسي</label>
              <input
                type="number"
                value={simAtk}
                onChange={e => setSimAtk(Number(e.target.value))}
                className="input-field text-xs py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">DEF أساسي</label>
              <input
                type="number"
                value={simDef}
                onChange={e => setSimDef(Number(e.target.value))}
                className="input-field text-xs py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Speed أساسي</label>
              <input
                type="number"
                value={simSpeed}
                onChange={e => setSimSpeed(Number(e.target.value))}
                className="input-field text-xs py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Crit% أساسي</label>
              <input
                type="number"
                value={simCrit}
                onChange={e => setSimCrit(Number(e.target.value))}
                className="input-field text-xs py-1.5 font-mono"
              />
            </div>
          </div>

          {/* Simulation Output Card */}
          {(() => {
            const hpPct = Number(editValues['fusion.bonus_hp_percent'] ?? 8) * simTargetLevel
            const atkPct = Number(editValues['fusion.bonus_atk_percent'] ?? 7) * simTargetLevel
            const defPct = Number(editValues['fusion.bonus_def_percent'] ?? 6) * simTargetLevel
            const spdBonus = Number(editValues['fusion.bonus_speed'] ?? 2) * simTargetLevel
            const critBonus = Number(editValues['fusion.bonus_crit_rate'] ?? 1) * simTargetLevel
            const reqCopies = editValues[`fusion.copies_level_${simTargetLevel}`] ?? (simTargetLevel + 1)

            const finalHp = Math.round(simHp * (1 + hpPct / 100))
            const finalAtk = Math.round(simAtk * (1 + atkPct / 100))
            const finalDef = Math.round(simDef * (1 + defPct / 100))
            const finalSpd = simSpeed + spdBonus
            const finalCrit = simCrit + critBonus

            return (
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/60 grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
                <div className="p-2 rounded-xl bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">النسخ المطلوبة</span>
                  <span className="text-base font-black text-amber-400">{reqCopies} نسخ</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">HP النهائي (+{hpPct}%)</span>
                  <span className="text-base font-black text-emerald-400">{finalHp}</span>
                  <span className="text-[10px] text-slate-500 block">+{finalHp - simHp}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">ATK النهائي (+{atkPct}%)</span>
                  <span className="text-base font-black text-red-400">{finalAtk}</span>
                  <span className="text-[10px] text-slate-500 block">+{finalAtk - simAtk}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">DEF النهائي (+{defPct}%)</span>
                  <span className="text-base font-black text-blue-400">{finalDef}</span>
                  <span className="text-[10px] text-slate-500 block">+{finalDef - simDef}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">SPEED النهائي</span>
                  <span className="text-base font-black text-cyan-400">{finalSpd}</span>
                  <span className="text-[10px] text-slate-500 block">+{spdBonus}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">CRIT RATE النهائي</span>
                  <span className="text-base font-black text-amber-300">{finalCrit}%</span>
                  <span className="text-[10px] text-slate-500 block">+{critBonus}%</span>
                </div>
              </div>
            )
          })()}
        </motion.div>
      )}

      {/* Settings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner text="جارٍ جلب إعدادات النظام..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSettings.map(s => {
            const compositeKey = `${s.category}.${s.key}`
            const currentVal = editValues[compositeKey] ?? s.value
            const isSaving = savingKey === compositeKey
            const isBoolean = typeof s.value === 'boolean' || s.value === 'true' || s.value === 'false'
            const boolVal = typeof currentVal === 'boolean' ? currentVal : currentVal === 'true'
            const isRarities = s.key === 'allowed_rarities'
            const isNumber = !isBoolean && !isRarities && !isNaN(Number(s.value))

            const allRaritiesList = [
              { id: 'common', label: 'شائعة', color: 'border-slate-500 text-slate-300' },
              { id: 'uncommon', label: 'غير شائعة', color: 'border-emerald-500 text-emerald-300' },
              { id: 'rare', label: 'نادرة', color: 'border-blue-500 text-blue-300' },
              { id: 'epic', label: 'ملحمية', color: 'border-purple-500 text-purple-300' },
              { id: 'legendary', label: 'أسطورية', color: 'border-amber-500 text-amber-300' },
            ]

            const currentRarities: string[] = Array.isArray(currentVal)
              ? currentVal
              : typeof currentVal === 'string'
              ? currentVal.replace(/[[\]"]/g, '').split(',').map(x => x.trim()).filter(Boolean)
              : []

            return (
              <motion.div
                key={compositeKey}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-4 border border-slate-700/60 flex flex-col justify-between space-y-4 hover:border-primary-500/30 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-primary-300 font-semibold">
                      {s.category} / {s.key}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isBoolean ? 'تفعيل/تعطيل' : isRarities ? 'قائمة ندرات' : isNumber ? 'قيمة رقمية' : 'نص'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    {s.description || s.key}
                  </h3>
                </div>

                <div className="space-y-3">
                  {isBoolean ? (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-xs text-slate-300">
                        الحالة: {boolVal ? 'مفعّل ✅' : 'معطّل ❌'}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateEditValue(s.category, s.key, !boolVal)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                          boolVal ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            boolVal ? '-translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ) : isRarities ? (
                    <div className="space-y-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700">
                      <div className="flex flex-wrap gap-1.5">
                        {allRaritiesList.map(r => {
                          const isSelected = currentRarities.includes(r.id)
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                const next = isSelected
                                  ? currentRarities.filter(x => x !== r.id)
                                  : [...currentRarities, r.id]
                                updateEditValue(s.category, s.key, next)
                              }}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                isSelected
                                  ? `bg-slate-700 ${r.color} shadow-sm`
                                  : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60'
                              }`}
                            >
                              {r.label} {isSelected ? '✓' : ''}
                            </button>
                          )
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400 block text-right">
                        انقر للتبديل بين الندرات المسموح بدمجها
                      </span>
                    </div>
                  ) : isNumber ? (
                    <input
                      type="number"
                      value={currentVal}
                      onChange={e => updateEditValue(s.category, s.key, Number(e.target.value))}
                      className="input-field text-left font-mono font-bold text-sm py-2"
                    />
                  ) : (
                    <input
                      type="text"
                      value={currentVal}
                      onChange={e => updateEditValue(s.category, s.key, e.target.value)}
                      className="input-field text-sm py-2"
                    />
                  )}

                  <button
                    onClick={() => handleSaveSetting(s.category, s.key)}
                    disabled={isSaving}
                    className="btn-primary w-full py-2 text-xs font-bold gap-1.5 justify-center shadow-md"
                  >
                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {isSaving ? 'جارٍ الحفظ...' : 'حفظ الإعداد'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
