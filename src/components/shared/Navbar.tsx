import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Home, Calendar, LogOut, Menu, X, 
  User, Swords, ChevronDown, Wallet, Package, Sparkles, 
  ShoppingBag, Gift, Users, Bell, Zap, Skull, Layers, RotateCw
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useUIStore } from '../../store'
import { formatBalance } from '../../lib/utils'
import { AnimatedNumber } from './UI'

const navLinks = [
  { to: '/', label: 'الرئيسية', icon: Home },
  { to: '/lucky-wheel', label: 'عجلة الحظ', icon: RotateCw },
  { to: '/bosses', label: 'الزعماء', icon: Skull },
  { to: '/events', label: 'الإيفنتات', icon: Swords },
  { to: '/boxes', label: 'متجر الصناديق', icon: Package },
  { to: '/collection', label: 'مجموعتي', icon: Sparkles },
  { to: '/evolution', label: 'تطوير البطاقات', icon: Zap },
  { to: '/fusion', label: 'دمج البطاقات', icon: Layers },
  { to: '/market', label: 'سوق البطاقات', icon: ShoppingBag },
  { to: '/challenges', label: 'التحديات', icon: Swords },
  { to: '/guilds', label: 'الكلانات', icon: Users },
  { to: '/leaderboard', label: 'المتصدرون', icon: Trophy },
]

// Bottom navigation items for mobile screens
const mobileBottomLinks = [
  { to: '/', label: 'الرئيسية', icon: Home },
  { to: '/lucky-wheel', label: 'العجلة', icon: RotateCw },
  { to: '/events', label: 'الإيفنتات', icon: Swords },
  { to: '/boxes', label: 'الصناديق', icon: Package },
  { to: '/collection', label: 'مجموعتي', icon: Sparkles },
  { to: '/guilds', label: 'الكلانات', icon: Users },
]

export function Navbar() {
  const { player, signOut, isAuthenticated } = useAuth()
  const { setLoginModalOpen } = useUIStore()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const initialLetter = (player?.username?.[0] || 'U').toUpperCase()

  return (
    <>
      {/* Top Navbar */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 border-b border-slate-700/60 shadow-xl"
        style={{ background: 'rgba(5, 5, 8, 0.96)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="relative">
                <img
                  src="/logo.jpeg"
                  alt="WuWa Betting"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-primary-500/30 group-hover:border-primary-400 transition-all shadow-md"
                />
                <div className="absolute inset-0 rounded-xl blur-md bg-primary-500/30 -z-10 group-hover:bg-primary-500/50 transition-all" />
              </div>
              <span className="font-black text-base sm:text-lg text-white tracking-tight flex items-center gap-1">
                <span className="gradient-text-primary">WuWa</span>
                <span className="text-slate-300">Betting</span>
              </span>
            </Link>

            {/* Desktop Nav Links (xl+) */}
            <div className="hidden xl:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`nav-link text-xs lg:text-sm flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-all ${
                    isActive(to) ? 'active font-bold text-primary-400 bg-primary-500/10' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Medium screen links (md - xl) */}
            <div className="hidden md:flex xl:hidden items-center gap-1">
              {navLinks.slice(0, 5).map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`nav-link text-xs flex items-center gap-1 py-1.5 px-2 rounded-lg transition-all ${
                    isActive(to) ? 'active font-bold text-primary-400 bg-primary-500/10' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {isAuthenticated && player ? (
                <>
                  {/* Balance (Visible on sm+) */}
                  <div 
                    className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold"
                    style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                  >
                    <Wallet size={13} className="text-primary-400" />
                    <span className="text-primary-300 number-ltr">
                      <AnimatedNumber value={player.balance || 0} prefix="$" />
                    </span>
                  </div>

                  {/* Profile Menu Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow">
                        {initialLetter}
                      </div>
                      <span className="hidden sm:block text-xs sm:text-sm font-medium text-slate-300 max-w-[90px] truncate">
                        {player.username || 'لاعب'}
                      </span>
                      <ChevronDown size={13} className={`text-slate-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {profileMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute left-0 mt-2 w-52 glass-card rounded-2xl py-2 shadow-2xl border border-slate-700/80 z-50"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <div className="px-4 py-2 border-b border-slate-700/50 mb-1">
                            <p className="text-sm font-bold text-white">{player.username || 'لاعب'}</p>
                            <p className="text-xs font-mono font-bold text-primary-400">
                              {formatBalance(player.balance || 0)}
                            </p>
                          </div>

                          <Link
                            to="/profile"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <User size={15} className="text-slate-400" />
                            ملفي الشخصي
                          </Link>

                          <Link
                            to="/bosses"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <Skull size={15} className="text-red-400" />
                            الزعماء الأسطوريون
                          </Link>

                          <Link
                            to="/collection"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <Sparkles size={15} className="text-primary-400" />
                            مجموعة بطاقاتي
                          </Link>

                          <Link
                            to="/evolution"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <Zap size={15} className="text-amber-400" />
                            تطوير البطاقات
                          </Link>

                          <Link
                            to="/fusion"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <Layers size={15} className="text-cyan-400" />
                            دمج البطاقات
                          </Link>

                          <Link
                            to="/boxes"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <Package size={15} className="text-amber-400" />
                            متجر الصناديق
                          </Link>

                          <Link
                            to="/market"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <ShoppingBag size={15} className="text-purple-400" />
                            سوق التداول
                          </Link>

                          <Link
                            to="/seasonal"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <Calendar size={15} className="text-green-400" />
                            الأحداث الموسمية
                          </Link>

                          <Link
                            to="/notifications"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <Bell size={15} className="text-blue-400" />
                            الإشعارات
                          </Link>

                          <div className="border-t border-slate-700/50 mt-1 pt-1">
                            <button
                              onClick={signOut}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <LogOut size={15} />
                              تسجيل الخروج
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="btn-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5"
                >
                  <User size={13} />
                  دخول الساحة
                </button>
              )}

              {/* Mobile menu toggle (hamburger) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white"
                aria-label="القائمة"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="xl:hidden border-t border-slate-800 bg-[#090912]/98 backdrop-blur-xl px-4 py-3 space-y-1 shadow-2xl"
            >
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive(to)
                      ? 'bg-primary-500/20 text-primary-400 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Bottom Navigation Bar (Screens < md) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/90 shadow-2xl"
        style={{ background: 'rgba(9, 9, 16, 0.98)', backdropFilter: 'blur(20px)' }}
      >
        <div className="grid grid-cols-6 h-14 max-w-md mx-auto px-1 items-center">
          {mobileBottomLinks.map(({ to, label, icon: Icon }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center py-1 transition-all relative ${
                  active ? 'text-primary-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeBottomTab"
                    className="absolute -top-1 w-6 h-1 rounded-full bg-primary-500"
                  />
                )}
                <Icon size={17} />
                <span className="text-[10px] mt-0.5 tracking-tight">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
