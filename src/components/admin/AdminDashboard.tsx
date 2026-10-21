import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Swords, Trophy, TrendingUp, Activity, Clock, Zap,
  Trash2, AlertTriangle, AlertOctagon, Loader2, Check, X, ShieldAlert
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { StatCard, LoadingSpinner, Modal } from '../shared/UI'
import { formatDate, getBetStatusLabel, getBetStatusClass, getEventStatusLabel, getEventStatusClass } from '../../lib/utils'
import type { Player, Bet, AuditLog, EventWithCharacters } from '../../types/database'
import toast from 'react-hot-toast'

export function AdminDashboard() {
  const { admin } = useAuth()
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalEvents: 0,
    openEvents: 0,
    completedEvents: 0,
    totalBetsValue: 0,
    totalBets: 0,
  })
  const [recentBets, setRecentBets] = useState<(Bet & { player: Pick<Player, 'username'> })[]>([])
  const [recentPlayers, setRecentPlayers] = useState<Player[]>([])
  const [recentAudit, setRecentAudit] = useState<AuditLog[]>([])
  const [openEvents, setOpenEvents] = useState<EventWithCharacters[]>([])
  const [loading, setLoading] = useState(true)

  // Empty DB / Wipe state
  const [wipeModalOpen, setWipeModalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [wipeCharacters, setWipeCharacters] = useState(false)
  const [isWiping, setIsWiping] = useState(false)

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    setLoading(true)
    const [
      playersRes, eventsRes, openEventsRes,
      completedEventsRes, betsRes, recentBetsRes,
      recentPlayersRes, auditRes,
    ] = await Promise.all([
      supabase.from('players').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('bets').select('stake').in('status', ['confirmed', 'won', 'lost']),
      supabase.from('bets')
        .select('*, player:players!bets_player_id_fkey(username)')
        .in('status', ['confirmed', 'won', 'lost'])
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('players').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
    ])

    const totalBetsValue = betsRes.data?.reduce((sum: number, b: { stake: number }) => sum + b.stake, 0) || 0

    setStats({
      totalPlayers: playersRes.count || 0,
      totalEvents: eventsRes.count || 0,
      openEvents: openEventsRes.count || 0,
      completedEvents: completedEventsRes.count || 0,
      totalBetsValue,
      totalBets: betsRes.data?.length || 0,
    })

    if (recentBetsRes.data) setRecentBets(recentBetsRes.data as any)
    if (recentPlayersRes.data) setRecentPlayers(recentPlayersRes.data)
    if (auditRes.data) setRecentAudit(auditRes.data)

    // Load open events
    const { data: openEvData } = await supabase
      .from('events')
      .select(`
        *, 
        character_a:characters!events_character_a_id_fkey(*),
        character_b:characters!events_character_b_id_fkey(*),
        winner_character:characters!events_winner_character_id_fkey(*)
      `)
      .eq('status', 'open')
      .limit(5)
    if (openEvData) setOpenEvents(openEvData as EventWithCharacters[])

    setLoading(false)
  }

  const handleWipeDatabase = async () => {
    if (!admin?.id) return
    if (confirmText.trim() !== 'مسح الكل' && confirmText.trim().toUpperCase() !== 'RESET') {
      toast.error("يرجى كتابة 'مسح الكل' لتأكيد العملية")
      return
    }

    setIsWiping(true)
    try {
      const { data, error } = await supabase.rpc('admin_wipe_database', {
        p_admin_id: admin.id,
        p_wipe_characters: wipeCharacters
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشلت عملية التفريغ')

      toast.success(data.message || 'تم تفريغ وتنظيف قاعدة البيانات بالكامل بنجاح! 🧹')
      setWipeModalOpen(false)
      setConfirmText('')
      setWipeCharacters(false)
      await loadDashboard()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء تفريغ قاعدة البيانات')
    } finally {
      setIsWiping(false)
    }
  }

  const auditActionLabels: Record<string, string> = {
    event_created: 'إنشاء إيفنت',
    event_updated: 'تعديل إيفنت',
    event_published: 'نشر إيفنت',
    event_opened: 'فتح الرهان',
    event_closed: 'إغلاق الرهان',
    event_result_declared: 'إعلان النتيجة',
    event_settled: 'تسوية إيفنت',
    event_cancelled: 'إلغاء إيفنت',
    player_banned: 'حظر لاعب',
    player_unbanned: 'رفع حظر لاعب',
    player_balance_adjusted: 'تعديل رصيد',
    character_created: 'إضافة شخصية',
    character_updated: 'تعديل شخصية',
    character_image_updated: 'تحديث صورة شخصية',
    character_deleted: 'حذف شخصية',
    database_wiped: 'تفريغ قاعدة البيانات بالكامل',
    player_password_reset: 'تعيين كلمة مرور لاعب',
    setting_updated: 'تحديث إعدادات النظام',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="جارٍ تحميل لوحة التحكم..." />
      </div>
    )
  }

  const isConfirmValid = confirmText.trim() === 'مسح الكل' || confirmText.trim().toUpperCase() === 'RESET'

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">لوحة التحكم</h1>
          <p className="text-slate-400 text-sm mt-1">نظرة عامة على منصة WuWa Betting ومؤشرات الأداء</p>
        </div>

        {/* Quick Wipe Button in header */}
        <button
          onClick={() => {
            setConfirmText('')
            setWipeCharacters(false)
            setWipeModalOpen(true)
          }}
          className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto hover:shadow-glow-red"
        >
          <Trash2 size={15} />
          تفريغ قاعدة البيانات بالكامل
        </button>
      </div>

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {[
          { title: 'إجمالي اللاعبين', value: stats.totalPlayers.toLocaleString('en-US'), icon: <Users size={24} />, color: 'blue' as const },
          { title: 'إجمالي الإيفنتات', value: stats.totalEvents.toLocaleString('en-US'), icon: <Swords size={24} />, color: 'purple' as const },
          { title: 'إيفنتات مفتوحة', value: stats.openEvents.toLocaleString('en-US'), icon: <Zap size={24} />, color: 'green' as const },
          { title: 'إيفنتات مكتملة', value: stats.completedEvents.toLocaleString('en-US'), icon: <Trophy size={24} />, color: 'gold' as const },
          { title: 'إجمالي الرهانات', value: stats.totalBets.toLocaleString('en-US'), icon: <Activity size={24} />, color: 'red' as const },
          { title: 'إجمالي المبالغ المراهن بها ($)', value: `$${stats.totalBetsValue.toLocaleString('en-US')}`, icon: <TrendingUp size={24} />, color: 'blue' as const },
        ].map((s, i) => (
          <motion.div
            key={i}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          >
            <StatCard title={s.title} value={s.value} icon={s.icon} color={s.color} />
          </motion.div>
        ))}
      </motion.div>

      {/* 2x2 Grid of Dashboard Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Bets */}
        <div className="glass-card rounded-2xl p-5 border border-slate-700/60">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Activity size={18} className="text-primary-400" />
            أحدث الرهانات
          </h3>
          {recentBets.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">لا توجد رهانات مسجلة بعد</p>
          ) : (
            <div className="space-y-2">
              {recentBets.map(bet => (
                <div key={bet.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">
                      {(bet.player as any)?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-white font-medium">{(bet.player as any)?.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 number-ltr">${bet.stake.toLocaleString('en-US')}</span>
                    <span className={`badge ${getBetStatusClass(bet.status)}`}>
                      {getBetStatusLabel(bet.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log */}
        <div className="glass-card rounded-2xl p-5 border border-slate-700/60">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            سجل العمليات الإدارية
          </h3>
          {recentAudit.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">لا توجد عمليات مسجلة بعد</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentAudit.map(log => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-800/50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">
                      {auditActionLabels[log.action] || log.action}
                    </span>
                    <span className="text-slate-500 text-[11px]">{formatDate(log.created_at)}</span>
                  </div>
                  {log.details && typeof log.details === 'object' && 'title' in log.details && (
                    <p className="text-slate-500 mt-0.5">{String(log.details.title)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Players */}
        <div className="glass-card rounded-2xl p-5 border border-slate-700/60">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Users size={18} className="text-green-400" />
            أحدث اللاعبين
          </h3>
          {recentPlayers.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">لا يوجد لاعبون مسجلون بعد</p>
          ) : (
            <div className="space-y-2">
              {recentPlayers.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {p.username[0]?.toUpperCase() || 'P'}
                    </div>
                    <span className="text-white font-medium">{p.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`number-ltr ${p.balance < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                      {p.balance < 0 ? '-' : ''}${Math.abs(p.balance).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Events */}
        <div className="glass-card rounded-2xl p-5 border border-slate-700/60">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Swords size={18} className="text-primary-400" />
            الإيفنتات المفتوحة حالياً
          </h3>
          {openEvents.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">لا توجد إيفنتات مفتوحة حالياً</p>
          ) : (
            <div className="space-y-2">
              {openEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 text-xs">
                  <div>
                    <p className="text-white font-medium">{event.title}</p>
                    <p className="text-slate-500 text-[11px]">
                      {event.character_a?.name} ضد {event.character_b?.name}
                    </p>
                  </div>
                  <span className="badge badge-open">مفتوح</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone: Full DB Wipe Section */}
      <div className="glass-card rounded-3xl p-6 border border-red-500/30 relative overflow-hidden bg-red-500/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertOctagon size={20} className="text-red-400" />
              <h3 className="text-lg font-black text-white">منطقة الخطر — تفريغ وتصفير قاعدة البيانات (Database Reset)</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
              تتيح لك هذه الميزة تفريغ قاعدة البيانات بالكامل ومسح جميع حسابات اللاعبين، الرهانات، سجل المعاملات، البطاقات وسوق التداول، الكلانات وتحديات PvP بشكل فوري لإعادة تشغيل المنصة من الصفر.
            </p>
          </div>

          <button
            onClick={() => {
              setConfirmText('')
              setWipeCharacters(false)
              setWipeModalOpen(true)
            }}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow-red transition-all whitespace-nowrap flex-shrink-0"
          >
            <Trash2 size={16} />
            تفريغ قاعدة البيانات الآن
          </button>
        </div>
      </div>

      {/* Empty Database Confirmation Modal */}
      <Modal
        isOpen={wipeModalOpen}
        onClose={() => !isWiping && setWipeModalOpen(false)}
        title="تأكيد تفريغ وتصفير قاعدة البيانات بالكامل"
        size="md"
      >
        <div className="p-6 space-y-5" dir="rtl">
          {/* Critical Warning Alert */}
          <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300 text-sm">تحذير لا يمكن التراجع عنه!</p>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  هذه العملية ستقوم بحذف الجداول والبيانات التالية نهائياً:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
                  <li>جميع حسابات اللاعبين وكلمات المرور والأرصدة.</li>
                  <li>جميع الرهانات، سجل المعاملات، والإيفنتات.</li>
                  <li>جميع بطاقات اللاعبين ومشتريات الصناديق وسوق التداول.</li>
                  <li>جميع الكلانات والأعضاء وتحديات PvP والإشعارات.</li>
                  <li><strong>حسابات المشرفين وإعدادات النظام ستبقى محفوظة لتتمكن من متابعة الإدارة.</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Optional Characters wipe */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <input
              type="checkbox"
              id="wipeChars"
              checked={wipeCharacters}
              onChange={e => setWipeCharacters(e.target.checked)}
              className="rounded text-red-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="wipeChars" className="text-xs text-slate-300 font-semibold cursor-pointer">
              مسح الشخصيات وقوالب البطاقات المصممة أيضاً (اختياري)
            </label>
          </div>

          {/* Type to confirm */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              للتأكيد، اكتب عبارة <span className="text-red-400 font-mono font-black text-sm">مسح الكل</span> أو <span className="text-red-400 font-mono font-black text-sm">RESET</span> في المربع أدناه:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="اكتب: مسح الكل"
              className="input-field text-center font-bold text-base py-2.5 border-red-500/30 focus:border-red-500"
              autoFocus
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleWipeDatabase}
              disabled={isWiping || !isConfirmValid}
              className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isConfirmValid && !isWiping
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-glow-red cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isWiping ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isWiping ? 'جارٍ تفريغ وتصفير قاعدة البيانات...' : 'تأكيد تفريغ قاعدة البيانات نهائياً'}
            </button>
            <button
              type="button"
              onClick={() => setWipeModalOpen(false)}
              disabled={isWiping}
              className="btn-secondary py-3 px-5 text-xs"
            >
              <X size={15} /> إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
