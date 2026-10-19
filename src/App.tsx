import React, { Component, ErrorInfo, ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Navbar } from './components/shared/Navbar'
import { LoginModal } from './components/shared/LoginModal'

// Public pages
import { HomePage } from './pages/Home'
import { EventsListPage } from './pages/Events'
import { EventDetailPage } from './pages/EventDetail'
import { LeaderboardPage } from './pages/Leaderboard'
import { HistoryPage } from './pages/History'
import { BoxStorePage } from './pages/BoxStore'
import { CollectionPage } from './pages/Collection'
import { MarketplacePage } from './pages/Marketplace'
import { QuestsPage } from './pages/Quests'
import { ProfilePage } from './pages/Profile'
import { ChallengesPage } from './pages/Challenges'
import { GuildsPage } from './pages/Guilds'
import { CardEvolutionPage } from './pages/CardEvolution'
import { CardFusionPage } from './pages/CardFusion'
import { NotificationsPage } from './pages/Notifications'
import { SeasonalEventsPage } from './pages/SeasonalEvents'
import { BossesPage } from './pages/Bosses'

// Admin
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { AdminCardDesigner } from './components/admin/AdminCardDesigner'
import { AdminEvents } from './components/admin/AdminEvents'
import { AdminCharacters } from './components/admin/AdminCharacters'
import { AdminPlayers } from './components/admin/AdminPlayers'
import { AdminBets } from './components/admin/AdminBets'
import { AdminSettings } from './components/admin/AdminSettings'
import { AdminSeasonal } from './components/admin/AdminSeasonal'
import { AdminGuilds } from './components/admin/AdminGuilds'
import { AdminChallenges } from './components/admin/AdminChallenges'
import { AdminNotifications } from './components/admin/AdminNotifications'
import { AdminBoxes } from './components/admin/AdminBoxes'
import { AdminBosses } from './components/admin/AdminBosses'
import { AdminTitles } from './components/admin/AdminTitles'
import { AdminTelegram } from './components/admin/AdminTelegram'

// Error boundary to catch any client-side exception and prevent black screens
interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WuWa Betting caught an error:', error, errorInfo)
  }

  handleReset = () => {
    localStorage.removeItem('wuwa-auth')
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-3xl border border-red-500/30 space-y-4 shadow-2xl">
            <img src="/logo.jpeg" alt="Logo" className="w-16 h-16 rounded-2xl mx-auto border border-primary-500/30" />
            <h2 className="text-2xl font-black text-white">حدث خطأ غير متوقع</h2>
            <p className="text-slate-400 text-sm">
              {this.state.error?.message || 'واجه التطبيق مشكلة مؤقتة أثناء التحميل.'}
            </p>
            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="btn-primary w-full py-3 text-sm font-bold"
              >
                تحديث الصفحة واستعادة الإعدادات
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Stars background component
function StarsBackground() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: 2 + Math.random() * 4,
    delay: Math.random() * 4,
    size: Math.random() > 0.8 ? 3 : 2,
  }))

  return (
    <div className="stars-bg" aria-hidden="true">
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            '--duration': `${s.duration}s`,
            '--delay': `${s.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// Public layout wrapper
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StarsBackground />
      <Navbar />
      <LoginModal />
      <main className="relative z-10">
        {children}
      </main>
    </>
  )
}

// App content
function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          <PublicLayout>
            <HomePage />
          </PublicLayout>
        } />
        <Route path="/events" element={
          <PublicLayout>
            <EventsListPage />
          </PublicLayout>
        } />
        <Route path="/events/:id" element={
          <PublicLayout>
            <EventDetailPage />
          </PublicLayout>
        } />
        <Route path="/boxes" element={
          <PublicLayout>
            <BoxStorePage />
          </PublicLayout>
        } />
        <Route path="/collection" element={
          <PublicLayout>
            <CollectionPage />
          </PublicLayout>
        } />
        <Route path="/market" element={
          <PublicLayout>
            <MarketplacePage />
          </PublicLayout>
        } />
        <Route path="/quests" element={
          <PublicLayout>
            <QuestsPage />
          </PublicLayout>
        } />
        <Route path="/leaderboard" element={
          <PublicLayout>
            <LeaderboardPage />
          </PublicLayout>
        } />
        <Route path="/history" element={
          <PublicLayout>
            <HistoryPage />
          </PublicLayout>
        } />
        <Route path="/profile" element={
          <PublicLayout>
            <ProfilePage />
          </PublicLayout>
        } />
        <Route path="/profile/:username" element={
          <PublicLayout>
            <ProfilePage />
          </PublicLayout>
        } />
        <Route path="/challenges" element={
          <PublicLayout>
            <ChallengesPage />
          </PublicLayout>
        } />
        <Route path="/guilds" element={
          <PublicLayout>
            <GuildsPage />
          </PublicLayout>
        } />
        <Route path="/evolution" element={
          <PublicLayout>
            <CardEvolutionPage />
          </PublicLayout>
        } />
        <Route path="/fusion" element={
          <PublicLayout>
            <CardFusionPage />
          </PublicLayout>
        } />
        <Route path="/notifications" element={
          <PublicLayout>
            <NotificationsPage />
          </PublicLayout>
        } />
        <Route path="/seasonal" element={
          <PublicLayout>
            <SeasonalEventsPage />
          </PublicLayout>
        } />
        <Route path="/bosses" element={
          <PublicLayout>
            <BossesPage />
          </PublicLayout>
        } />

        {/* Admin routes - protected */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="boxes" element={<AdminBoxes />} />
          <Route path="cards" element={<AdminCardDesigner />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="characters" element={<AdminCharacters />} />
          <Route path="seasonal" element={<AdminSeasonal />} />
          <Route path="guilds" element={<AdminGuilds />} />
          <Route path="challenges" element={<AdminChallenges />} />
          <Route path="bosses" element={<AdminBosses />} />
          <Route path="titles" element={<AdminTitles />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="telegram" element={<AdminTelegram />} />
          <Route path="bets" element={<AdminBets />} />
        </Route>
      </Routes>

      {/* Toast notifications */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'rgba(14, 14, 28, 0.95)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#e2e8f0',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '14px',
            direction: 'rtl',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: 'white' },
          },
          duration: 4000,
        }}
      />
    </BrowserRouter>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
