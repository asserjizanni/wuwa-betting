import React, { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Swords, Users, ImageIcon,
  LogOut, Menu, X, ExternalLink, BarChart2,
  Lock, Loader2, AlertCircle, Sparkles, Sliders,
  Bell, Trophy, Flame, Box, Skull, Key, Check, Send
} from 'lucide-react'
import { useAuthStore } from '../../store'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/supabase'
import type { Admin } from '../../types/database'
import toast from 'react-hot-toast'

const adminNav = [
  { to: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { to: '/admin/bosses', label: 'الزعماء الأسطوريون', icon: Skull },
  { to: '/admin/titles', label: 'الألقاب والمقتنيات', icon: Trophy },
  { to: '/admin/boxes', label: 'صناديق السحب (Gacha)', icon: Box },
  { to: '/admin/cards', label: 'مصمم البطاقات', icon: Sparkles },
  { to: '/admin/challenges', label: 'تحديات PVP', icon: Swords },
  { to: '/admin/settings', label: 'إعدادات النظام والألعاب', icon: Sliders },
  { to: '/admin/players', label: 'اللاعبون والحسابات', icon: Users },
  { to: '/admin/events', label: 'الإيفنتات والمباريات', icon: Swords },
  { to: '/admin/characters', label: 'الشخصيات', icon: ImageIcon },
  { to: '/admin/seasonal', label: 'الفعاليات الموسمية', icon: Flame },
  { to: '/admin/guilds', label: 'الكلانات والنقابات', icon: Users },
  { to: '/admin/notifications', label: 'مركز الإشعارات والبث', icon: Bell },
  { to: '/admin/telegram', label: 'إشعارات تلجرام (Bot)', icon: Send },
  { to: '/admin/bets', label: 'الرهانات', icon: BarChart2 },
]

export function AdminLayout() {
  // Read admin directly from store (not via useAuth) to avoid any stale-closure re-renders
  const { admin, setAdmin, logout } = useAuthStore()
  const isAdmin = !!admin
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Dedicated Admin Login State
  const [adminUsername, setAdminUsername] = useState('admin')
  const [adminPassword, setAdminPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Dedicated Admin Password Change State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [currentAdminPassword, setCurrentAdminPassword] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin?.id) return toast.error('يرجى تسجيل الدخول كمسؤول أولاً')
    if (!currentAdminPassword) return toast.error('يرجى إدخال كلمة المرور الحالية')
    if (!newAdminPassword || newAdminPassword.length < 6) {
      return toast.error('يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل')
    }
    if (newAdminPassword !== confirmAdminPassword) {
      return toast.error('كلمتا المرور غير متطابقتين')
    }

    setIsChangingPassword(true)
    try {
      const { data, error } = await supabase.rpc('admin_change_password', {
        p_admin_id: admin.id,
        p_current_password: currentAdminPassword,
        p_new_password: newAdminPassword,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل تحديث كلمة المرور')

      toast.success(data.message || 'تم تحديث كلمة مرور المسؤول بنجاح! 🔐')
      setPasswordModalOpen(false)
      setCurrentAdminPassword('')
      setNewAdminPassword('')
      setConfirmAdminPassword('')
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تغيير كلمة المرور')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    const trimmed = adminUsername.trim()
    if (!trimmed) return setLoginError('أدخل اسم المستخدم')
    if (!adminPassword) return setLoginError('أدخل كلمة المرور')

    setIsLoggingIn(true)
    try {
      let result: { success?: boolean; message?: string; admin?: Admin } | null = null

      // 1. Try Supabase SDK RPC first
      try {
        const { data, error } = await supabase.rpc('admin_login', {
          p_username: trimmed,
          p_password: adminPassword,
        })
        if (!error && data) {
          result = data as { success?: boolean; message?: string; admin?: Admin }
        }
      } catch (sdkErr) {
        console.warn('Supabase SDK rpc failed, attempting direct fetch:', sdkErr)
      }

      // 2. Direct HTTP fallback if SDK didn't succeed
      if (!result) {
        const fallbackUrl = 'https://axaoxpeqlobiljrromun.supabase.co'
        const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4YW94cGVxbG9iaWxqcnJvbXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTY5MDMsImV4cCI6MjEwNzY3MjkwM30.tMZ1sKPOpbGeCHTp4I-3puENq2JLfL_ZIWjg9c8_bAU'
        const targetUrl = (SUPABASE_URL || fallbackUrl).replace(/\/+$/, '')
        const targetKey = SUPABASE_ANON_KEY || fallbackKey

        const res = await fetch(`${targetUrl}/rest/v1/rpc/admin_login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': targetKey,
            'Authorization': `Bearer ${targetKey}`,
          },
          body: JSON.stringify({ p_username: trimmed, p_password: adminPassword }),
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`خطأ من الخادم (${res.status}): ${errText}`)
        }

        result = await res.json()
      }

      if (!result?.success) throw new Error(result?.message || 'بيانات الدخول غير صحيحة')

      const adminData = result.admin as Admin
      setAdmin(adminData)
      toast.success(`مرحباً بك في لوحة الإدارة، ${adminData.username}!`)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'فشل تسجيل الدخول')
    } finally {
      setIsLoggingIn(false)
    }
  }


  const handleSignOut = () => {
    logout()
    toast.success('تم تسجيل الخروج')
  }

  // If not logged in as admin, show private admin login portal immediately
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-dark-900" dir="rtl">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="glass-card rounded-3xl p-8 shadow-2xl border border-slate-700/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary-500 to-purple-600" />
            
            <div className="text-center mb-8">
              <img
                src="/logo.jpeg"
                alt="WuWa Betting"
                className="w-16 h-16 mx-auto mb-4 rounded-2xl object-cover shadow-glow-amber border border-amber-500/30"
              />
              <h1 className="text-2xl font-black text-white">لوحة تحكم المشرفين</h1>
              <p className="text-slate-400 text-sm mt-1">منطقة خاصة بإدارة منصة WuWa Betting</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="field-label">اسم مستخدم المشرف</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => { setAdminUsername(e.target.value); setLoginError('') }}
                  placeholder="admin"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div>
                <label className="field-label">كلمة المرور</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => { setAdminPassword(e.target.value); setLoginError('') }}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn || !adminUsername.trim() || !adminPassword}
                className="btn-primary w-full py-3.5 text-base bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700"
              >
                {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                {isLoggingIn ? 'جارٍ التحقق...' : 'تسجيل دخول الإدارة'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-700/50 text-center">
              <a href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                ← العودة إلى الموقع الرئيسي
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 z-50 transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}
        style={{ background: 'rgba(5, 5, 12, 0.98)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(99,102,241,0.15)' }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="WuWa Betting"
              className="w-10 h-10 rounded-xl object-cover border border-primary-500/40 shadow-glow-blue"
            />
            <div>
              <p className="font-black text-white text-sm">WuWa Betting</p>
              <p className="text-xs text-slate-500">لوحة الإدارة</p>
            </div>
          </div>
          {admin && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">تسجيل دخول كـ</p>
                <p className="text-sm font-bold text-primary-300">{admin.username}</p>
                <p className="text-xs text-slate-600 capitalize">{admin.role.replace('_', ' ')}</p>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="p-1.5 rounded-lg bg-primary-500/20 text-primary-300 hover:bg-primary-500/40 hover:text-white transition-colors"
                title="تغيير كلمة مرور المشرف"
              >
                <Key size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-slate-700/50 space-y-2">
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-amber-300 hover:text-white hover:bg-amber-500/20 transition-colors"
          >
            <Key size={14} />
            تغيير كلمة المرور
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <ExternalLink size={14} />
            عرض الموقع العام
          </a>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={14} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-slate-700/50"
          style={{ background: 'rgba(5, 5, 12, 0.95)', backdropFilter: 'blur(20px)' }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="font-bold text-white text-sm">لوحة الإدارة</span>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-black text-base">
                <Lock size={18} className="text-amber-400" />
                تغيير كلمة مرور المشرف ({admin?.username})
              </div>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangeAdminPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور الحالية *</label>
                <input
                  type="password"
                  value={currentAdminPassword}
                  onChange={e => setCurrentAdminPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور الجديدة *</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  placeholder="6 أحرف أو أرقام على الأقل"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">تأكيد كلمة المرور الجديدة *</label>
                <input
                  type="password"
                  value={confirmAdminPassword}
                  onChange={e => setConfirmAdminPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isChangingPassword || !currentAdminPassword || !newAdminPassword || !confirmAdminPassword}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold shadow-glow-amber bg-amber-500 hover:bg-amber-400 text-black border-none flex items-center justify-center gap-1.5"
                >
                  {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {isChangingPassword ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="btn-secondary py-2.5 px-4 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
