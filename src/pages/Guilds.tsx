import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, Crown, Star, Shield, Plus, Search, Swords, Trophy, 
  Flame, Lock, Check, X, ChevronLeft, RefreshCw, Loader2, 
  Settings, Award, UserCheck, ShieldAlert, Edit2, Trash2, ShieldCheck
} from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useUIStore } from "../store"
import { supabase } from "../lib/supabase"
import { AnimatedNumber } from "../components/shared/UI"
import { ClanWarsArena } from "../components/guilds/ClanWarsArena"
import { PlayerTitleBadge } from "../components/shared/PlayerTitleBadge"
import toast from "react-hot-toast"

type Guild = {
  id: string
  name: string
  tag: string
  description: string
  memberCount: number
  maxMembers: number
  level: number
  totalWinnings: number
  rank: number
  isJoined: boolean
  leaderId: string
  leaderName: string
  badge: string
  color: string
}

interface ClanMember {
  id: string
  player_id: string
  role: string
  base_role: 'leader' | 'deputy_leader' | 'member'
  custom_role_id?: string
  joined_at?: string
  player: {
    id: string
    username: string
    wallet_balance?: number
    equipped_title?: any
  }
}

interface CustomRole {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  permissions: {
    invite_members?: boolean
    manage_applications?: boolean
    send_announcements?: boolean
    organize_events?: boolean
  }
  display_order: number
}

export function GuildsPage() {
  const { player, isAuthenticated } = useAuth()
  const { setLoginModalOpen } = useUIStore()

  const [guilds, setGuilds] = useState<Guild[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"browse" | "mine">("browse")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [guildName, setGuildName] = useState("")
  const [guildTag, setGuildTag] = useState("")
  const [guildDesc, setGuildDesc] = useState("")
  const [creating, setCreating] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [clanWarsOpen, setClanWarsOpen] = useState(false)

  // Clan Roles & Members State
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([])
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [myBaseRole, setMyBaseRole] = useState<'leader' | 'deputy_leader' | 'member'>('member')
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [rolesModalOpen, setRolesModalOpen] = useState(false)

  // New Role Form State
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDesc, setNewRoleDesc] = useState("")
  const [newRoleColor, setNewRoleColor] = useState("#3b82f6")
  const [newRoleIcon, setNewRoleIcon] = useState("🛡️")
  const [newRolePerms, setNewRolePerms] = useState({
    invite_members: true,
    manage_applications: false,
    send_announcements: false,
    organize_events: false,
  })
  const [savingRole, setSavingRole] = useState(false)

  useEffect(() => {
    loadGuilds()
  }, [player?.id])

  useEffect(() => {
    const myG = guilds.find(g => g.isJoined)
    if (myG && activeTab === 'mine') {
      loadClanDetails(myG.id)
    }
  }, [activeTab, guilds])

  const loadGuilds = async () => {
    setLoading(true)
    try {
      const { data: guildsData, error } = await supabase
        .from('guilds')
        .select(`
          *,
          players:leader_id(username)
        `)
        .eq('is_active', true)
        .order('total_winnings', { ascending: false })

      if (error) throw error

      let myGuildId: string | null = null
      if (player?.id) {
        const { data: memberData } = await supabase
          .from('guild_members')
          .select('guild_id, base_role, role')
          .eq('player_id', player.id)
          .maybeSingle()
        if (memberData) {
          myGuildId = memberData.guild_id
          const bRole = (memberData.base_role || memberData.role || 'member') as any
          setMyBaseRole(bRole === 'leader' ? 'leader' : bRole === 'deputy_leader' ? 'deputy_leader' : 'member')
        }
      }

      if (guildsData) {
        const formatted = await Promise.all(guildsData.map(async (g: any, idx: number) => {
          const { count } = await supabase
            .from('guild_members')
            .select('*', { count: 'exact', head: true })
            .eq('guild_id', g.id)

          return {
            id: g.id,
            name: g.name,
            tag: g.tag,
            description: g.description || 'كلان في ساحة Wuthering Waves',
            memberCount: count || 1,
            maxMembers: g.max_members || 30,
            level: g.level || 1,
            totalWinnings: Number(g.total_winnings) || 0,
            rank: idx + 1,
            isJoined: g.id === myGuildId,
            leaderId: g.leader_id,
            leaderName: g.players?.username || 'القائد',
            badge: g.badge || '🏰',
            color: g.color || '#6366f1'
          }
        }))
        setGuilds(formatted)
      }
    } catch (err) {
      console.warn('Error loading guilds:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadClanDetails = async (guildId: string) => {
    setLoadingMembers(true)
    try {
      // 1. Fetch custom roles
      const { data: rolesData } = await supabase
        .from('clan_custom_roles')
        .select('*')
        .eq('guild_id', guildId)
        .order('display_order', { ascending: true })

      setCustomRoles(rolesData || [])

      // 2. Fetch members with their players and equipped titles
      const { data: membersData, error } = await supabase
        .from('guild_members')
        .select(`
          id,
          player_id,
          role,
          base_role,
          custom_role_id,
          created_at,
          player:player_id (
            id,
            username,
            wallet_balance,
            equipped_title:equipped_title_id (
              id,
              name_ar,
              name_en,
              style,
              color,
              icon,
              rarity
            )
          )
        `)
        .eq('guild_id', guildId)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (membersData) {
        const mapped: ClanMember[] = membersData.map((m: any) => ({
          id: m.id,
          player_id: m.player_id,
          role: m.role || 'member',
          base_role: m.base_role || (m.role === 'leader' ? 'leader' : 'member'),
          custom_role_id: m.custom_role_id,
          joined_at: m.created_at,
          player: m.player,
        }))
        setClanMembers(mapped)
      }
    } catch (err: any) {
      console.warn('Error loading clan details:', err)
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault()
    const myG = guilds.find(g => g.isJoined)
    if (!myG || !newRoleName.trim()) return

    setSavingRole(true)
    try {
      const { error } = await supabase
        .from('clan_custom_roles')
        .insert([{
          guild_id: myG.id,
          name: newRoleName.trim(),
          description: newRoleDesc.trim(),
          color: newRoleColor,
          icon: newRoleIcon,
          permissions: newRolePerms,
          can_invite: !!newRolePerms.invite_members,
          can_accept_requests: !!newRolePerms.manage_applications,
          can_post_announcements: !!newRolePerms.send_announcements,
          can_manage_events: !!newRolePerms.organize_events,
          can_manage_roles: false,
          created_by: player?.id,
          display_order: customRoles.length + 1,
          is_active: true,
        }])

      if (error) throw error
      toast.success('تم إنشاء الرتبة المخصصة بنجاح!')
      setNewRoleName("")
      setNewRoleDesc("")
      loadClanDetails(myG.id)
    } catch (err: any) {
      toast.error('فشل إنشاء الرتبة: ' + err.message)
    } finally {
      setSavingRole(false)
    }
  }

  const handleDeleteCustomRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('clan_custom_roles')
        .delete()
        .eq('id', roleId)

      if (error) throw error
      toast.success('تم حذف الرتبة المخصصة')
      const myG = guilds.find(g => g.isJoined)
      if (myG) loadClanDetails(myG.id)
    } catch (err: any) {
      toast.error('فشل حذف الرتبة: ' + err.message)
    }
  }

  const handleAssignCustomRole = async (memberId: string, customRoleId: string | null) => {
    try {
      const { error } = await supabase
        .from('guild_members')
        .update({ custom_role_id: customRoleId })
        .eq('id', memberId)

      if (error) throw error
      toast.success('تم تحديث رتبة العضو!')
      const myG = guilds.find(g => g.isJoined)
      if (myG) loadClanDetails(myG.id)
    } catch (err: any) {
      toast.error('فشل تعيين الرتبة: ' + err.message)
    }
  }

  const handleSetBaseRole = async (member: ClanMember, newRole: 'deputy_leader' | 'member') => {
    if (myBaseRole !== 'leader') {
      return toast.error('القائد فقط يستطيع تعيين نواب القائد')
    }
    try {
      const { error } = await supabase
        .from('guild_members')
        .update({ base_role: newRole, role: newRole })
        .eq('id', member.id)

      if (error) throw error
      toast.success(newRole === 'deputy_leader' ? 'تمت ترقية العضو إلى نائب قائد' : 'تم تخفيض الرتبة إلى عضو')
      const myG = guilds.find(g => g.isJoined)
      if (myG) loadClanDetails(myG.id)
    } catch (err: any) {
      toast.error('فشل تحديث الدور: ' + err.message)
    }
  }

  const myGuild = guilds.find(g => g.isJoined)
  const filteredGuilds = guilds.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleJoin = async (guildId: string) => {
    if (!isAuthenticated || !player) { setLoginModalOpen(true); return }
    if (myGuild && myGuild.id !== guildId) {
      toast.error("يجب مغادرة كلانك الحالي أولاً")
      return
    }

    setJoiningId(guildId)
    try {
      const { error } = await supabase
        .from('guild_members')
        .insert([{
          guild_id: guildId,
          player_id: player.id,
          role: 'member',
          base_role: 'member'
        }])

      if (error) throw error

      toast.success("تم الانضمام إلى الكلان بنجاح! 🏰")
      await loadGuilds()
      setActiveTab("mine")
    } catch (err: any) {
      toast.error(err.message || "فشل الانضمام للكلان")
    } finally {
      setJoiningId(null)
    }
  }

  const handleLeave = async (guildId: string) => {
    if (!player) return
    try {
      const { error } = await supabase
        .from('guild_members')
        .delete()
        .eq('guild_id', guildId)
        .eq('player_id', player.id)

      if (error) throw error

      toast.success("تمت مغادرة الكلان")
      await loadGuilds()
      setActiveTab("browse")
    } catch (err) {
      toast.error("فشل مغادرة الكلان")
    }
  }

  const handleCreate = async () => {
    if (!isAuthenticated || !player) { setLoginModalOpen(true); return }
    if (!guildName.trim()) { toast.error("أدخل اسم الكلان"); return }
    const tag = guildTag.trim().toUpperCase()
    if (!tag || tag.length > 5) { toast.error("أدخل كود الكلان (1-5 أحرف)"); return }
    if (myGuild) { toast.error("يجب مغادرة كلانك الحالي أولاً"); return }

    setCreating(true)
    try {
      const { data: newGuild, error: gError } = await supabase
        .from('guilds')
        .insert([{
          name: guildName.trim(),
          tag,
          description: guildDesc.trim() || 'كلان في ساحة WuWa',
          leader_id: player.id,
          badge: '🏰',
          color: '#6366f1',
          max_members: 30,
          level: 1,
          is_active: true
        }])
        .select()
        .single()

      if (gError) throw gError

      await supabase
        .from('guild_members')
        .insert([{
          guild_id: newGuild.id,
          player_id: player.id,
          role: 'leader',
          base_role: 'leader'
        }])

      toast.success("تم تأسيس الكلان بنجاح! 🏰")
      setShowCreateModal(false)
      setGuildName("")
      setGuildTag("")
      setGuildDesc("")
      await loadGuilds()
      setActiveTab("mine")
    } catch (err: any) {
      toast.error(err.message?.includes('unique') ? 'اسم الكلان أو التاج مستخدم بالفعل' : 'فشل إنشاء الكلان')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-28 md:pb-16 px-4 max-w-5xl mx-auto" dir="rtl">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
                <Users size={20} className="text-primary-400" />
              </div>
              الكلانات ونظام الرتب المتطور (Clan Roles)
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              أدوار حقيقية (قائد، نائب قائد، أعضاء) ورتب مخصصة بصلاحيات كاملة داخل الكلان
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setClanWarsOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black flex items-center gap-2 shadow-glow-amber transition-all"
            >
              <Swords size={15} /> حرب الكلانات (Clan Wars)
            </button>
            <button onClick={loadGuilds} className="btn-secondary text-xs">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-glow-blue">
              <Plus size={16} /> تأسيس كلان جديد
            </button>
          </div>
        </motion.div>

        {/* My Guild Quick Card (if member) */}
        {myGuild && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-5 border border-primary-500/40 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.05))" }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl p-2.5 rounded-2xl bg-black/40 border border-slate-700">{myGuild.badge}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{myGuild.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">[{myGuild.tag}]</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    القائد: <span className="text-slate-200 font-semibold">{myGuild.leaderName}</span> • دورك: <strong className="text-amber-400">{myBaseRole === 'leader' ? '👑 قائد الكلان' : myBaseRole === 'deputy_leader' ? '⭐ نائب القائد' : 'عضو'}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="text-right">
                  <p className="text-xs text-slate-400">مستوى الكلان</p>
                  <p className="text-base font-black text-amber-400">Lvl {myGuild.level}</p>
                </div>
                <button onClick={() => handleLeave(myGuild.id)} className="btn-secondary text-xs text-red-400 hover:bg-red-500/20 mr-auto sm:mr-0">
                  مغادرة الكلان
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-1">
            <button onClick={() => setActiveTab("browse")} className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${activeTab === "browse" ? "bg-primary-500 text-white shadow-glow-blue" : "glass-card text-slate-400 hover:text-white"}`}>
              تصفح الكلانات ({guilds.length})
            </button>
            {myGuild && (
              <button onClick={() => setActiveTab("mine")} className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${activeTab === "mine" ? "bg-primary-500 text-white shadow-glow-blue" : "glass-card text-slate-400 hover:text-white"}`}>
                إدارة ورتب كلاني ({myGuild.name})
              </button>
            )}
          </div>
          {activeTab === "browse" && (
            <div className="relative sm:w-64">
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="البحث بالاسم أو التاج..."
                className="input-field pr-10 py-2.5 text-xs w-full"
              />
            </div>
          )}
        </div>

        {/* TAB 1: BROWSE GUILDS */}
        {activeTab === "browse" && (
          loading ? (
            <div className="glass-card rounded-3xl p-16 text-center border border-slate-700/60">
              <Loader2 size={36} className="animate-spin text-primary-400 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">جارٍ جلب الكلانات...</p>
            </div>
          ) : filteredGuilds.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-slate-700/60">
              <Users size={48} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium text-sm mb-1">لا توجد كلانات مطابقة</p>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs mt-3">
                + تأسيس كلان الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuilds.map((g, idx) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="glass-card rounded-2xl p-5 border border-slate-700/60 flex flex-col justify-between space-y-4 hover:border-primary-500/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-xl bg-slate-800/80 border border-slate-700">{g.badge}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-white text-base">{g.name}</h3>
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 font-bold">[{g.tag}]</span>
                          </div>
                          <p className="text-slate-400 text-xs">القائد: {g.leaderName}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30">
                        Lvl {g.level}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                      {g.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <div className="text-xs text-slate-400">
                      الأعضاء: <span className="font-bold text-white">{g.memberCount} / {g.maxMembers}</span>
                    </div>
                    {g.isJoined ? (
                      <span className="text-xs px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        أنت عضو هنا ✅
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoin(g.id)}
                        disabled={joiningId === g.id || g.memberCount >= g.maxMembers}
                        className="btn-primary text-xs py-1.5 px-4 font-bold"
                      >
                        {joiningId === g.id ? 'جارٍ الانضمام...' : g.memberCount >= g.maxMembers ? 'الكلان ممتلئ' : 'انضمام للكلان'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* TAB 2: MY CLAN MEMBERS & ROLES */}
        {activeTab === "mine" && myGuild && (
          <div className="space-y-6">
            
            {/* Roles Management Header */}
            <div className="glass-card rounded-3xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldCheck className="text-primary-400" size={20} />
                  إدارة أعضاء ورتب الكلان ({clanMembers.length} أعضاء)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  يمكن للقائد ونائب القائد إدارة الأعضاء، إنشاء رتب مخصصة، وتوزيع الصلاحيات
                </p>
              </div>

              {(myBaseRole === 'leader' || myBaseRole === 'deputy_leader') && (
                <button
                  onClick={() => setRolesModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs font-bold hover:bg-primary-500/30 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Settings size={14} />
                  إدارة الرتب المخصصة ({customRoles.length})
                </button>
              )}
            </div>

            {/* Custom Roles Badges Showcase */}
            {customRoles.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-semibold shrink-0">الرتب المتاحة بالكلان:</span>
                {customRoles.map((r) => (
                  <span
                    key={r.id}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 shrink-0"
                    style={{ borderColor: `${r.color}50`, background: `${r.color}15`, color: r.color }}
                  >
                    <span>{r.icon}</span>
                    <span>{r.name}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Members List */}
            {loadingMembers ? (
              <div className="text-center py-12">
                <Loader2 className="animate-spin text-primary-400 mx-auto" size={30} />
              </div>
            ) : (
              <div className="space-y-2.5">
                {clanMembers.map((member) => {
                  const isLeader = member.base_role === 'leader'
                  const isDeputy = member.base_role === 'deputy_leader'
                  const memberCustomRole = customRoles.find(r => r.id === member.custom_role_id)

                  return (
                    <div
                      key={member.id}
                      className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow">
                          {member.player?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{member.player?.username}</span>
                            {member.player?.equipped_title && (
                              <PlayerTitleBadge title={member.player.equipped_title} />
                            )}
                          </div>
                          
                          {/* Role badges */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                              isLeader 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                : isDeputy 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {isLeader ? '👑 قائد' : isDeputy ? '⭐ نائب قائد' : 'عضو'}
                            </span>

                            {memberCustomRole && (
                              <span
                                className="text-[11px] px-2 py-0.5 rounded-md font-bold border flex items-center gap-1"
                                style={{
                                  borderColor: `${memberCustomRole.color}40`,
                                  background: `${memberCustomRole.color}15`,
                                  color: memberCustomRole.color,
                                }}
                              >
                                {memberCustomRole.icon} {memberCustomRole.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Management Actions for Leader & Deputy Leader */}
                      {myBaseRole === 'leader' && member.player_id !== player?.id && (
                        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                          {/* Promote / Demote Deputy */}
                          <button
                            onClick={() => handleSetBaseRole(member, isDeputy ? 'member' : 'deputy_leader')}
                            className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            {isDeputy ? 'عزل من النيابة' : 'تعيين نائب قائد'}
                          </button>

                          {/* Assign Custom Role Selector */}
                          <select
                            value={member.custom_role_id || ''}
                            onChange={(e) => handleAssignCustomRole(member.id, e.target.value || null)}
                            className="select-field text-xs py-1 px-2.5 font-bold"
                          >
                            <option value="">-- بدون رتبة مخصصة --</option>
                            {customRoles.map((r) => (
                              <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Roles Manager Modal */}
      <AnimatePresence>
        {rolesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 flex flex-col"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <Award className="text-primary-400" size={20} />
                  <h3 className="text-lg font-black text-white">إدارة الرتب المخصصة للكلان</h3>
                </div>
                <button
                  onClick={() => setRolesModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
                {/* Existing Roles List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300">الرتب الحالية:</h4>
                  {customRoles.length === 0 ? (
                    <p className="text-xs text-slate-500">لا توجد رتب مخصصة بعد. أنشئ رتبة جديدة بالأسفل.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {customRoles.map((r) => (
                        <div key={r.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{r.icon}</span>
                            <div>
                              <div className="text-xs font-bold" style={{ color: r.color }}>{r.name}</div>
                              <div className="text-[10px] text-slate-400">{r.description || 'رتبة كلان مخصصة'}</div>
                            </div>
                          </div>
                          {(myBaseRole === 'leader' || myBaseRole === 'deputy_leader') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomRole(r.id)}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="حذف الرتبة"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create New Role Form */}
                <form onSubmit={handleCreateCustomRole} className="space-y-4 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus size={14} className="text-primary-400" />
                    إنشاء رتبة مخصصة جديدة
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم الرتبة *</label>
                      <input
                        type="text"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        required
                        placeholder="مثال: نخبة الكلان (Elite)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">الوصف</label>
                      <input
                        type="text"
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                        placeholder="مثال: للأعضاء الأكثر فاعلية"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">الرمز / الأيقونة</label>
                      <input
                        type="text"
                        value={newRoleIcon}
                        onChange={(e) => setNewRoleIcon(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-center text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">لون الرتبة</label>
                      <input
                        type="color"
                        value={newRoleColor}
                        onChange={(e) => setNewRoleColor(e.target.value)}
                        className="w-full h-8 bg-slate-950 border border-slate-700 rounded-xl p-1 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Permissions checkboxes */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-primary-300">صلاحيات الرتبة الفعلية:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRolePerms.invite_members}
                          onChange={(e) => setNewRolePerms({ ...newRolePerms, invite_members: e.target.checked })}
                          className="rounded text-primary-500"
                        />
                        <span>دعوة أعضاء جدد</span>
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRolePerms.manage_applications}
                          onChange={(e) => setNewRolePerms({ ...newRolePerms, manage_applications: e.target.checked })}
                          className="rounded text-primary-500"
                        />
                        <span>مراجعة طلبات الانضمام</span>
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRolePerms.send_announcements}
                          onChange={(e) => setNewRolePerms({ ...newRolePerms, send_announcements: e.target.checked })}
                          className="rounded text-primary-500"
                        />
                        <span>إرسال إعلانات الكلان</span>
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRolePerms.organize_events}
                          onChange={(e) => setNewRolePerms({ ...newRolePerms, organize_events: e.target.checked })}
                          className="rounded text-primary-500"
                        />
                        <span>تنظيم الفعاليات وحروب الكلان</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingRole || !newRoleName.trim()}
                      className="btn-primary py-2 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      {savingRole ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      إنشاء الرتبة
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Guild Modal */}
      {showCreateModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-3xl p-6 w-full max-w-sm border border-primary-500/30">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Users size={20} className="text-primary-400" /> تأسيس كلان جديد
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">اسم الكلان *</label>
                <input
                  value={guildName}
                  onChange={e => setGuildName(e.target.value)}
                  placeholder="مثال: حراس العواصف"
                  className="input-field py-2.5 text-sm"
                  maxLength={50}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">تاج الكلان (رمز مختصر 2-5 أحرف) *</label>
                <input
                  value={guildTag}
                  onChange={e => setGuildTag(e.target.value.toUpperCase())}
                  placeholder="مثال: STM"
                  className="input-field font-mono font-bold tracking-widest text-center py-2 text-sm"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">وصف وشروط الكلان</label>
                <textarea
                  value={guildDesc}
                  onChange={e => setGuildDesc(e.target.value)}
                  placeholder="اكتب نبذة عن الكلان وشروط القبول..."
                  className="input-field text-xs h-20 resize-none"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={creating || !guildName.trim() || !guildTag.trim()}
                className="btn-primary w-full py-3 text-sm font-bold gap-2 shadow-glow-blue"
              >
                {creating ? "جاري التأسيس..." : "🏰 تأسيس الكلان فوراً"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Clan Wars Mode (2v2, 4v4, 5v5) */}
      <ClanWarsArena
        isOpen={clanWarsOpen}
        onClose={() => setClanWarsOpen(false)}
        myClanId={myGuild?.id}
        myClanName={myGuild?.name}
        currentUserId={player?.id}
      />
    </div>
  )
}
