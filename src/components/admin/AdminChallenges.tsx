import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Swords, ShieldAlert, CheckCircle2, XCircle, Clock,
  Search, Loader2, RefreshCw, Trophy, AlertTriangle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner, ConfirmDialog, Modal } from '../shared/UI'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

interface ChallengeRow {
  id: string
  stake: number
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired' | 'cancelled'
  message: string | null
  created_at: string
  expires_at: string
  challenger_id: string
  challenged_id: string
  challenger_name: string
  challenged_name: string
  winner_name: string | null
}

export function AdminChallenges() {
  const { admin } = useAuth()
  const [challenges, setChallenges] = useState<ChallengeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [resolveModal, setResolveModal] = useState<ChallengeRow | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pvp_challenges')
        .select(`
          *,
          challenger:challenger_id(username),
          challenged:challenged_id(username),
          winner:winner_id(username)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      if (data) {
        setChallenges(data.map(c => ({
          ...c,
          challenger_id: c.challenger_id,
          challenged_id: c.challenged_id,
          challenger_name: (c.challenger as any)?.username || 'غير معروف',
          challenged_name: (c.challenged as any)?.username || 'غير معروف',
          winner_name: (c.winner as any)?.username || null,
        })))
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تحميل التحديات')
    } finally {
      setLoading(false)
    }
  }

  const handleDeclareWinner = async (winnerId: string) => {
    if (!admin?.id || !resolveModal) return
    setIsResolving(true)
    try {
      const { data, error } = await supabase.rpc('admin_resolve_pvp_challenge', {
        p_admin_id: admin.id,
        p_challenge_id: resolveModal.id,
        p_winner_id: winnerId,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل إعلان الفائز')

      toast.success(data.message || 'تم إعلان الفائز بنجاح! 🏆')
      setResolveModal(null)
      await loadChallenges()
    } catch (err: any) {
      toast.error(err?.message || 'فشل إعلان الفائز')
    } finally {
      setIsResolving(false)
    }
  }

  const handleCancelChallenge = async (challengeId: string) => {
    setCancellingId(challengeId)
    try {
      const { error } = await supabase
        .from('pvp_challenges')
        .update({ status: 'cancelled' })
        .eq('id', challengeId)

      if (error) throw error
      toast.success('تم إلغاء التحدي')
      await loadChallenges()
    } catch (err) {
      toast.error('فشل إلغاء التحدي')
    } finally {
      setCancellingId(null)
    }
  }

  const filtered = challenges.filter(c =>
    c.challenger_name.toLowerCase().includes(search.toLowerCase()) ||
    c.challenged_name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">مكتمل 🏆</span>
      case 'accepted':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">جارٍ الآن ⚔️</span>
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">معلق ⏳</span>
      case 'declined':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-400">مرفوض 🚫</span>
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300">ملغى ❌</span>
      case 'expired':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-500">منتهي الصلاحية</span>
      default:
        return <span className="badge text-xs">{status}</span>
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Swords className="text-red-400" />
            مراقبة التحديات والمبارزات (PVP)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            متابعة تحديات اللاعبين المباشرة، فض النزاعات، وإلغاء الرهانات المعلقة.
          </p>
        </div>
        <button onClick={loadChallenges} className="btn-secondary text-xs self-start sm:self-auto gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="البحث باسم المتحدي أو الخصم..."
          className="input-field pr-10 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner text="جارٍ جلب التحديات..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-700/60">
          <Swords size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">لا توجد تحديات مسجلة</h3>
          <p className="text-slate-400 text-xs">ستظهر هنا أي مبارزة أو تحدٍ ينشئه اللاعبون بين بعضهم البعض</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/60">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>المتحدي</th>
                  <th>الخصم</th>
                  <th>قيمة الرهان</th>
                  <th>الحالة</th>
                  <th>الفائز</th>
                  <th>التاريخ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-bold text-white text-sm">{c.challenger_name}</span>
                    </td>
                    <td>
                      <span className="font-bold text-white text-sm">{c.challenged_name}</span>
                    </td>
                    <td>
                      <span className="font-bold text-amber-300 number-ltr text-sm">
                        ${c.stake.toLocaleString('en-US')}
                      </span>
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>
                      {c.winner_name ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-400 text-xs">
                          <Trophy size={13} /> {c.winner_name}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-slate-400 text-xs">{formatDate(c.created_at)}</span>
                    </td>
                    <td>
                      {c.status === 'accepted' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setResolveModal(c)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <Trophy size={13} />
                            إعلان الفائز
                          </button>
                          <button
                            onClick={() => handleCancelChallenge(c.id)}
                            disabled={cancellingId === c.id}
                            className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold transition-colors inline-flex items-center gap-1"
                          >
                            {cancellingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                            إلغاء
                          </button>
                        </div>
                      ) : c.status === 'pending' ? (
                        <button
                          onClick={() => handleCancelChallenge(c.id)}
                          disabled={cancellingId === c.id}
                          className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          {cancellingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                          إلغاء التحدي
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">منتهي</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolve Winner Modal */}
      <Modal
        isOpen={!!resolveModal}
        onClose={() => !isResolving && setResolveModal(null)}
        title="إعلان نتيجة المبارزة وتوزيع الجائزة"
        size="md"
      >
        {resolveModal && (
          <div className="p-6 space-y-5" dir="rtl">
            <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 text-center">
              <p className="text-xs text-slate-400 mb-1">إجمالي جائزة الفائز (ضعف الرهان)</p>
              <p className="text-2xl font-black text-amber-300 number-ltr">
                ${(resolveModal.stake * 2).toLocaleString('en-US')}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                رهان كل لاعب: ${resolveModal.stake.toLocaleString('en-US')}
              </p>
            </div>

            <p className="text-sm font-bold text-white text-center">
              من هو اللاعب الفائز في هذه المواجهة؟
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDeclareWinner(resolveModal.challenger_id)}
                disabled={isResolving}
                className="p-5 rounded-2xl border border-primary-500/40 bg-primary-500/10 hover:bg-primary-500/20 text-center transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mx-auto mb-2 text-xl font-black text-primary-400 group-hover:scale-110 transition-transform">
                  {resolveModal.challenger_name[0]?.toUpperCase() || 'C'}
                </div>
                <p className="text-xs text-slate-400 mb-0.5">المتحدي</p>
                <p className="font-black text-white text-base">{resolveModal.challenger_name}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <Trophy size={13} /> تحديد كفائز
                </span>
              </button>

              <button
                onClick={() => handleDeclareWinner(resolveModal.challenged_id)}
                disabled={isResolving}
                className="p-5 rounded-2xl border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-center transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mx-auto mb-2 text-xl font-black text-orange-400 group-hover:scale-110 transition-transform">
                  {resolveModal.challenged_name[0]?.toUpperCase() || 'D'}
                </div>
                <p className="text-xs text-slate-400 mb-0.5">الخصم</p>
                <p className="font-black text-white text-base">{resolveModal.challenged_name}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <Trophy size={13} /> تحديد كفائز
                </span>
              </button>
            </div>

            {isResolving && (
              <div className="flex items-center justify-center gap-2 text-primary-400 text-xs">
                <Loader2 size={16} className="animate-spin" />
                <span>جارٍ تسجيل الفوز وتحويل الأرباح ($)...</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
