import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Swords, AlertCircle, Loader2, Key, Copy, Check,
  Sparkles, Lock, User, UserPlus, LogIn, ShieldAlert, ArrowRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore, useUIStore } from '../../store'
import type { Player } from '../../types/database'
import toast from 'react-hot-toast'

type ModalTab = 'login' | 'register' | 'recovery'

export function LoginModal() {
  const { loginModalOpen, setLoginModalOpen } = useUIStore()
  const { setPlayer, setAdmin } = useAuthStore()

  const [activeTab, setActiveTab] = useState<ModalTab>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [legacyNotice, setLegacyNotice] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setRecoveryCode('')
    setError('')
    setLegacyNotice(false)
    setGeneratedCode('')
    setIsLoading(false)
    setCodeCopied(false)
  }

  const handleClose = () => {
    setLoginModalOpen(false)
    resetForm()
    setActiveTab('login')
  }

  // 1. Regular Login with Username + Password
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')
    setLegacyNotice(false)

    const trimmedUsername = username.trim()
    if (!trimmedUsername) return setError('يرجى إدخال اسم اللاعب')
    if (!password) return setError('يرجى إدخال كلمة المرور')

    setIsLoading(true)
    try {
      const { data: result, error: rpcError } = await supabase.rpc('login_player_with_password', {
        p_username: trimmedUsername,
        p_password: password
      })

      if (rpcError) throw new Error(rpcError.message)

      if (!result?.success) {
        if (result?.needs_password_setup) {
          setLegacyNotice(true)
          setError(result.message || 'هذا الحساب لا يملك كلمة مرور بعد')
          return
        }
        throw new Error(result?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة')
      }

      const playerData = result.player as Player
      setPlayer(playerData)
      setAdmin(null)
      toast.success(`مرحباً بعودتك يا ${playerData.username}! 🎉`)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تسجيل الدخول')
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Register New Player with Password
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')

    const trimmedUsername = username.trim()
    if (!trimmedUsername) return setError('يرجى إدخال اسم اللاعب')
    if (trimmedUsername.length < 2) return setError('اسم اللاعب يجب أن يكون حرفين على الأقل')
    if (trimmedUsername.length > 30) return setError('اسم اللاعب يجب ألا يتجاوز 30 حرفاً')
    if (!password) return setError('يرجى إدخال كلمة المرور')
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل')
    if (password !== confirmPassword) return setError('كلمتا المرور غير متطابقتين')

    setIsLoading(true)
    try {
      const { data: result, error: rpcError } = await supabase.rpc('register_player_with_password', {
        p_username: trimmedUsername,
        p_password: password
      })

      if (rpcError) throw new Error(rpcError.message)
      if (!result?.success) throw new Error(result?.message || 'تعذر إنشاء الحساب')

      const playerData = result.player as Player
      setPlayer(playerData)
      setAdmin(null)

      setGeneratedCode(playerData.recovery_code || '')
      toast.success(`أهلاً بك يا ${playerData.username}! تم منحك 500$ هدية 🎁`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إنشاء الحساب')
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Recovery / Set Password for Legacy or Forgotten Accounts
  const handleRecovery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')

    const trimmedUsername = username.trim()
    const code = recoveryCode.trim().toUpperCase()

    if (!trimmedUsername) return setError('يرجى إدخال اسم اللاعب')
    if (!code) return setError('يرجى إدخال رمز الاسترداد')
    if (!password) return setError('يرجى إدخال كلمة المرور الجديدة')
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    if (password !== confirmPassword) return setError('كلمتا المرور غير متطابقتين')

    setIsLoading(true)
    try {
      const { data: result, error: rpcError } = await supabase.rpc('set_password_with_recovery', {
        p_username: trimmedUsername,
        p_recovery_code: code,
        p_new_password: password
      })

      if (rpcError) throw new Error(rpcError.message)
      if (!result?.success) throw new Error(result?.message || 'رمز الاسترداد غير صحيح')

      const playerData = result.player as Player
      setPlayer(playerData)
      setAdmin(null)

      if (result.new_recovery_code) {
        setGeneratedCode(result.new_recovery_code)
      } else {
        toast.success(`تم تعيين كلمة المرور بنجاح، مرحباً ${playerData.username}! 🛡️`)
        handleClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'رمز الاسترداد غير صحيح أو منتهي')
    } finally {
      setIsLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCodeCopied(true)
    toast.success('تم نسخ رمز الاسترداد!')
    setTimeout(() => setCodeCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      {loginModalOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md my-4"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.35 }}
          >
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60" dir="rtl">
              {/* Header */}
              <div
                className="relative p-6 pb-4 text-center border-b border-slate-700/50"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.12))' }}
              >
                <button
                  onClick={handleClose}
                  className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>

                <div className="relative inline-block mb-2">
                  <img
                    src="/logo.jpeg"
                    alt="WuWa Betting"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-primary-500/40 shadow-glow-blue mx-auto"
                  />
                </div>

                {generatedCode ? (
                  <>
                    <h2 className="text-xl font-black text-white mb-1">🎉 تم تأمين حسابك بنجاح!</h2>
                    <p className="text-slate-400 text-xs">احفظ رمز الاسترداد في مكان آمن لاستعادة الحساب عند الحاجة</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-black text-white mb-1">ساحة رهان WuWa</h2>
                    <p className="text-slate-400 text-xs">سجل دخولك أو أنشئ حسابك المحمي بكلمة مرور</p>
                  </>
                )}
              </div>

              {/* Navigation Tabs (when not showing generated code) */}
              {!generatedCode && (
                <div className="flex border-b border-slate-700/50 bg-slate-900/60 p-1.5 gap-1">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setError(''); setLegacyNotice(false); }}
                    className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'login'
                        ? 'bg-primary-500 text-white shadow-glow-blue'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <LogIn size={15} />
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setError(''); setLegacyNotice(false); }}
                    className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'register'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-glow-green'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <UserPlus size={15} />
                    حساب جديد (500🎁)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('recovery'); setError(''); setLegacyNotice(false); }}
                    className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'recovery'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Key size={14} />
                    استرداد / حماية
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="p-6">
                {generatedCode ? (
                  /* Display new recovery code after Registration or Recovery */
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                      <p className="text-xs text-amber-300 mb-2 font-bold flex items-center gap-1.5">
                        <Sparkles size={15} /> رمز الاسترداد الخاص بحسابك:
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="flex-1 text-center text-lg sm:text-xl font-mono font-bold text-amber-300 tracking-wider py-2.5 bg-black/60 rounded-xl select-all border border-amber-500/25">
                          {generatedCode}
                        </code>
                        <button
                          type="button"
                          onClick={copyCode}
                          className="w-11 h-11 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 flex items-center justify-center text-amber-300 transition-colors flex-shrink-0"
                          title="نسخ الرمز"
                        >
                          {codeCopied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                        ⚠️ هذا الرمز هو مفتاحك لاستعادة الحساب إذا نسيت كلمة المرور أو غيرت جهازك. احفظه في مكان آمن الآن.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn-success w-full py-3.5 text-base font-bold shadow-lg"
                    >
                      <Swords size={18} />
                      ابدأ اللعب الآن
                    </button>
                  </motion.div>
                ) : activeTab === 'login' ? (
                  /* Form: LOGIN */
                  <form onSubmit={handleLogin} className="space-y-4">
                    {legacyNotice && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <ShieldAlert size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-300">هذا الحساب مسجل مسبقاً بدون كلمة مرور!</p>
                            <p className="text-slate-300 mt-1">
                              لحماية رصيدك وبطاقاتك، اضغط على الزر أدناه لتعيين كلمة مرور لحسابك برمز الاسترداد.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('recovery')
                            setError('')
                            setLegacyNotice(false)
                          }}
                          className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          تعيين كلمة مرور للحساب الآن <ArrowRight size={14} />
                        </button>
                      </motion.div>
                    )}

                    <div>
                      <label className="field-label text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <User size={14} className="text-primary-400" />
                        اسم اللاعب
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(''); setLegacyNotice(false); }}
                        placeholder="اسم المستخدم الخاص بك..."
                        className="input-field py-2.5 px-3.5 w-full text-sm"
                        maxLength={30}
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Lock size={14} className="text-primary-400" />
                        كلمة المرور
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="••••••••"
                        className="input-field py-2.5 px-3.5 w-full text-sm"
                      />
                    </div>

                    {error && !legacyNotice && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                      >
                        <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-400">{error}</p>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !username.trim() || !password}
                      className="btn-primary w-full py-3 text-sm font-bold gap-2 shadow-lg"
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                      {isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
                    </button>

                    <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center text-xs text-slate-400">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('recovery'); setError(''); setLegacyNotice(false); }}
                        className="hover:text-amber-300 transition-colors flex items-center gap-1"
                      >
                        <Key size={12} />
                        نسيت كلمة المرور؟
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('register'); setError(''); setLegacyNotice(false); }}
                        className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
                      >
                        ليس لديك حساب؟ أنشئ حساباً
                      </button>
                    </div>
                  </form>
                ) : activeTab === 'register' ? (
                  /* Form: REGISTER */
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    <div>
                      <label className="field-label text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <User size={14} className="text-emerald-400" />
                        اسم اللاعب الجديد
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(''); }}
                        placeholder="مثال: Rover, Jin, صائد_الوحوش..."
                        className="input-field py-2.5 px-3.5 w-full text-sm"
                        maxLength={30}
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Lock size={14} className="text-emerald-400" />
                        كلمة المرور (6 أحرف أو أرقام على الأقل)
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="••••••••"
                        className="input-field py-2.5 px-3.5 w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Lock size={14} className="text-emerald-400" />
                        تأكيد كلمة المرور
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="••••••••"
                        className="input-field py-2.5 px-3.5 w-full text-sm"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                      <Sparkles size={16} className="flex-shrink-0" />
                      <span>ستحصل على <strong>500$ ترحيبية</strong> مجاناً فور التسجيل!</span>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                      >
                        <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-400">{error}</p>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !username.trim() || !password || !confirmPassword}
                      className="btn-success w-full py-3 text-sm font-bold gap-2 shadow-lg"
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      {isLoading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب وبدء اللعب'}
                    </button>
                  </form>
                ) : (
                  /* Form: RECOVERY / SETUP PASSWORD FOR LEGACY ACCOUNTS */
                  <form onSubmit={handleRecovery} className="space-y-3.5">
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 leading-relaxed">
                      💡 استخدم رمز الاسترداد الخاص بك لتعيين كلمة مرور جديدة لحسابك واستعادة الوصول إليه بكامل رصيدك وبطاقاتك.
                    </div>

                    <div>
                      <label className="field-label text-xs font-semibold text-slate-300 mb-1">اسم اللاعب</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(''); }}
                        placeholder="اسم اللاعب المسجل..."
                        className="input-field py-2 px-3 w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs font-semibold text-slate-300 mb-1">رمز الاسترداد</label>
                      <input
                        type="text"
                        value={recoveryCode}
                        onChange={(e) => { setRecoveryCode(e.target.value.toUpperCase()); setError(''); }}
                        placeholder="XXXX-XXXX-XXXX"
                        className="input-field font-mono text-center tracking-wider py-2 px-3 w-full text-base"
                        maxLength={16}
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs font-semibold text-slate-300 mb-1">كلمة المرور الجديدة</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="6 أحرف أو أرقام على الأقل"
                        className="input-field py-2 px-3 w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs font-semibold text-slate-300 mb-1">تأكيد كلمة المرور الجديدة</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="تأكيد كلمة المرور"
                        className="input-field py-2 px-3 w-full text-sm"
                      />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                      >
                        <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-400">{error}</p>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !username.trim() || !recoveryCode.trim() || !password}
                      className="btn-primary w-full py-3 text-sm font-bold gap-2 shadow-lg"
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                      {isLoading ? 'جارٍ التحقق والتفعيل...' : 'تأكيد وحفظ كلمة المرور'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('login'); setError(''); }}
                      className="w-full text-xs text-slate-400 hover:text-slate-300 transition-colors py-1 text-center"
                    >
                      ← العودة لتسجيل الدخول
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
