import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Layers, ArrowLeft, Package, ShoppingBag } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { CardFusionWorkbench } from '../components/fusion/CardFusionWorkbench'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store'

export function CardFusionPage() {
  const { isAuthenticated, player } = useAuth()
  const { setLoginModalOpen } = useUIStore()
  const [searchParams] = useSearchParams()
  const cardIdParam = searchParams.get('card_id')

  if (!isAuthenticated || !player) {
    return (
      <div className="min-h-screen pt-24 pb-28 md:pb-20 flex items-center justify-center px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-card rounded-3xl p-10 max-w-sm border border-slate-700/60 shadow-2xl space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Sparkles size={28} />
          </div>
          <h2 className="text-xl font-black text-white">سجّل دخولك أولاً</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            يجب تسجيل الدخول لفحص بطاقاتك المكررة واستخدام منصة دمج البطاقات لزيادة قوة بطاقاتك الأساسية.
          </p>
          <button
            onClick={() => setLoginModalOpen(true)}
            className="btn-primary w-full py-3 text-sm font-bold shadow-glow-amber"
          >
            دخول المنصة
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-36 md:pb-24 px-3 sm:px-4 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Layers size={14} />
            نظام دمج البطاقات المكررة (Card Fusion)
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white flex items-center gap-3">
            منصة دمج البطاقات المكررة
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            حوّل النسخ الزائدة من نفس البطاقة لترقية رتبة البطاقة الأساسية ورفع إحصائيات HP وATK وDEF والسرعة والضربة الحرجة في القتال الحقيقي دون تغيير الندرة الثابتة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link
            to="/collection"
            className="flex-1 sm:flex-initial btn-secondary py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            مجموعتي <ArrowLeft size={14} className="rotate-180" />
          </Link>
          <Link
            to="/evolution"
            className="flex-1 sm:flex-initial btn-secondary py-2 px-3 text-xs font-bold text-amber-400 border-amber-500/30 flex items-center justify-center gap-1.5"
          >
            ترقية الإحصائيات
          </Link>
          <Link
            to="/boxes"
            className="w-full sm:w-auto btn-primary py-2 px-3.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-glow-amber"
          >
            <Package size={14} /> صناديق الحظ
          </Link>
        </div>
      </motion.div>

      {/* Main Workbench */}
      <CardFusionWorkbench initialCardId={cardIdParam} />
    </div>
  )
}
