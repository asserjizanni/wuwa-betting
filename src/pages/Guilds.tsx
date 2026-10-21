import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, Crown, Star, Shield, Plus, Search, Swords, Trophy, 
  Flame, Lock, Check, X, ChevronLeft, RefreshCw, Loader2, 
  Settings, Award, UserCheck, ShieldAlert, Edit2, Trash2, ShieldCheck,
  UserPlus, UserX, Clock, Inbox, AlertCircle, CheckCircle2, ChevronDown
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
  can_accept_requests?: boolean
  display_order: number
}

interface ClanJoinRequest {
  id: string
  guild_id: string
  applicant_id: string
  applicant_username: string
  applicant_balance?: number
  created_at: string
  notification_id?: string
  source: 'table' | 'notification'
  message?: string
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

  // Clan Join Requests State
  const [clanSubTab, setClanSubTab] = useState<'members' | 'requests'>('members')
  const [pendingRequests, setPendingRequests] = useState<ClanJoinRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null)
  const [myPendingGuildIds, setMyPendingGuildIds] = useState<Set<string>>(new Set())

  // New Role Form State
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDesc, setNewRoleDesc] = useState("")
  const [newRoleColor, setNewRoleColor] = useState("#3b82f6")
  const [newRoleIcon, setNewRoleIcon] = useState("🛡️")
  const [newRolePerms, setNewRolePerms] = useState({
    invite_members: true,
    manage_applications: true,
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

  // Load user's pending clan join requests
  useEffect(() => {
    if (!player?.id) return
    loadMyPendingRequests()
  }, [player?.id])

  const loadMyPendingRequests = async () => {
    if (!player?.id) return
    const pendingSet = new Set<string>()

    // 1. From localStorage cache
    try {
      const stored = localStorage.getItem(`pending_clan_reqs_${player.id}`)
      if (stored) {
        const arr = JSON.parse(stored)
        if (Array.isArray(arr)) arr.forEach((id: string) => pendingSet.add(id))
      }
    } catch {}

    // 2. From player_notifications
    try {
      const { data: notifs } = await supabase
        .from('player_notifications')
        .select('metadata')
        .eq('type', 'clan_join_request')
        .limit(50)

      if (notifs) {
        notifs.forEach(n => {
          const meta = n.metadata || {}
          if (meta.applicant_id === player.id && meta.status === 'pending' && meta.guild_id) {
            pendingSet.add(meta.guild_id)
          }
        })
      }
    } catch {}

    // 3. From clan_join_requests table (if exists)
    try {
      const { data: tableData } = await supabase
        .from('clan_join_requests')
        .select('guild_id')
        .eq('player_id', player.id)
        .eq('status', 'pending')

      if (tableData) {
        tableData.forEach(r => pendingSet.add(r.guild_id))
      }
    } catch {}

    setMyPendingGuildIds(pendingSet)
  }

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
          const isLeader = bRole === 'leader' || memberData.role === 'leader'
          const isDeputy = bRole === 'deputy_leader' || bRole === 'officer' || memberData.role === 'officer'
          setMyBaseRole(isLeader ? 'leader' : isDeputy ? 'deputy_leader' : 'member')
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

      // 2. Resiliently fetch members
      const { data: membersData, error: mErr } = await supabase
        .from('guild_members')
        .select('*')
        .eq('guild_id', guildId)

      if (mErr) throw mErr

      if (membersData && membersData.length > 0) {
        const playerIds = membersData.map((m: any) => m.player_id).filter(Boolean)
        const { data: playersData } = await supabase
          .from('players')
          .select('id, username, balance, equipped_title_id')
          .in('id', playerIds)

        const playersMap = new Map((playersData || []).map((p: any) => [p.id, p]))

        // Fetch equipped titles if any
        const titleIds = (playersData || []).map((p: any) => p.equipped_title_id).filter(Boolean)
        let titlesMap = new Map()
        if (titleIds.length > 0) {
          const { data: titlesData } = await supabase
            .from('titles')
            .select('*')
            .in('id', titleIds)
          titlesMap = new Map((titlesData || []).map((t: any) => [t.id, t]))
        }

        const mapped: ClanMember[] = membersData.map((m: any) => {
          const p = playersMap.get(m.player_id)
          const equipped_title = p?.equipped_title_id ? titlesMap.get(p.equipped_title_id) : null
          return {
            id: m.id,
            player_id: m.player_id,
            role: m.role || 'member',
            base_role: (m.base_role === 'leader' || m.role === 'leader')
              ? 'leader'
              : (m.base_role === 'deputy_leader' || m.base_role === 'officer' || m.role === 'officer')
              ? 'deputy_leader'
              : 'member',
            custom_role_id: m.custom_role_id,
            joined_at: m.joined_at || m.created_at,
            player: {
              id: p?.id || m.player_id,
              username: p?.username || 'لاعب',
              wallet_balance: Number(p?.balance) || 0,
              equipped_title
            }
          }
        })

        // Sort: leader first, then deputy_leader, then member
        mapped.sort((a, b) => {
          const order: Record<string, number> = { leader: 0, deputy_leader: 1, member: 2 }
          const orderA = order[a.base_role] ?? 2
          const orderB = order[b.base_role] ?? 2
          if (orderA !== orderB) return orderA - orderB
          return (a.player.username || '').localeCompare(b.player.username || '')
        })

        setClanMembers(mapped)

        // Also check if current user is leader or has permissions, and load join requests
        loadClanJoinRequests(guildId, mapped)
      } else {
        setClanMembers([])
      }
    } catch (err: any) {
      console.warn('Error loading clan details:', err)
      toast.error('تعذر جلب تفاصيل الأعضاء: ' + (err.message || ''))
    } finally {
      setLoadingMembers(false)
    }
  }

  // Load clan join requests
  const loadClanJoinRequests = async (guildId: string, currentMembers?: ClanMember[]) => {
    setLoadingRequests(true)
    const membersList = currentMembers || clanMembers
    const requests: ClanJoinRequest[] = []
    const seenApplicantIds = new Set<string>()

    try {
      // 1. Try clan_join_requests table
      const { data: tableData, error: tErr } = await supabase
        .from('clan_join_requests')
        .select('*')
        .eq('guild_id', guildId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (!tErr && tableData) {
        for (const r of tableData) {
          seenApplicantIds.add(r.player_id)
          requests.push({
            id: r.id,
            guild_id: r.guild_id,
            applicant_id: r.player_id,
            applicant_username: 'لاعب',
            created_at: r.created_at,
            message: r.message,
            source: 'table'
          })
        }
      }
    } catch {
      // Table may not exist yet, fallback to notifications
    }

    try {
      // 2. Fetch from player_notifications for clan join requests
      const { data: notifData } = await supabase
        .from('player_notifications')
        .select('*')
        .eq('type', 'clan_join_request')
        .order('created_at', { ascending: false })
        .limit(60)

      if (notifData) {
        for (const n of notifData) {
          const meta = n.metadata || {}
          if (meta.guild_id === guildId && (meta.status === 'pending' || !meta.status)) {
            const applicantId = meta.applicant_id
            if (applicantId && !seenApplicantIds.has(applicantId)) {
              seenApplicantIds.add(applicantId)
              requests.push({
                id: n.id,
                guild_id: guildId,
                applicant_id: applicantId,
                applicant_username: meta.applicant_username || 'لاعب',
                applicant_balance: meta.applicant_balance,
                created_at: n.created_at || meta.created_at || new Date().toISOString(),
                notification_id: n.id,
                source: 'notification',
                message: n.message
              })
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error loading notif requests:', e)
    }

    // Filter out applicants who are already in clan
    const pendingOnly = requests.filter(r => !membersList.some(m => m.player_id === r.applicant_id))

    // Enrich applicant usernames & balances from players table
    if (pendingOnly.length > 0) {
      const pids = pendingOnly.map(r => r.applicant_id)
      try {
        const { data: pData } = await supabase
          .from('players')
          .select('id, username, balance')
          .in('id', pids)

        if (pData) {
          const pMap = new Map(pData.map(p => [p.id, p]))
          pendingOnly.forEach(r => {
            const p = pMap.get(r.applicant_id)
            if (p) {
              r.applicant_username = p.username
              r.applicant_balance = Number(p.balance) || 0
            }
          })
        }
      } catch {}
    }

    setPendingRequests(pendingOnly)
    setLoadingRequests(false)
  }

  // Find user's member row & role permissions
  const myGuild = guilds.find(g => g.isJoined)
  const myMember = clanMembers.find(m => m.player_id === player?.id)
  const myCustomRole = myMember?.custom_role_id ? customRoles.find(r => r.id === myMember.custom_role_id) : null
  
  // Can manage join requests: Leader, Deputy Leader, or role with can_accept_requests / manage_applications
  const canManageRequests = 
    myBaseRole === 'leader' || 
    myBaseRole === 'deputy_leader' || 
    Boolean(myCustomRole?.permissions?.manage_applications || myCustomRole?.can_accept_requests)

  const canManageRoles = myBaseRole === 'leader' || myBaseRole === 'deputy_leader'

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
      const dbRole = newRole === 'deputy_leader' ? 'officer' : 'member'
      const { error } = await supabase
        .from('guild_members')
        .update({ base_role: newRole, role: dbRole })
        .eq('id', member.id)

      if (error) throw error
      toast.success(newRole === 'deputy_leader' ? 'تمت ترقية العضو إلى نائب قائد ⭐' : 'تم تخفيض الرتبة إلى عضو')
      const myG = guilds.find(g => g.isJoined)
      if (myG) loadClanDetails(myG.id)
    } catch (err: any) {
      toast.error('فشل تحديث الدور: ' + err.message)
    }
  }

  const handleKickMember = async (member: ClanMember) => {
    if (!canManageRequests && myBaseRole !== 'leader' && myBaseRole !== 'deputy_leader') {
      return toast.error('ليس لديك صلاحية طرد الأعضاء')
    }
    if (member.base_role === 'leader') {
      return toast.error('لا يمكن طرد قائد الكلان!')
    }
    if (myBaseRole === 'deputy_leader' && member.base_role === 'deputy_leader') {
      return toast.error('نائب القائد لا يمكنه طرد نائب قائد آخر')
    }

    const ok = window.confirm(`هل أنت متأكد من رغبتك في طرد اللاعب "${member.player?.username}" من الكلان؟`)
    if (!ok) return

    try {
      const { error } = await supabase
        .from('guild_members')
        .delete()
        .eq('id', member.id)

      if (error) throw error

      // Send notification to player
      await supabase.from('player_notifications').insert([{
        player_id: member.player_id,
        type: 'clan_kicked',
        title: 'تم استبعادك من الكلان',
        message: `تم استبعادك من كلان [${myGuild?.name}].`,
        icon: '⚠️',
        metadata: { guild_id: myGuild?.id }
      }]).catch(() => {})

      toast.success(`تم استبعاد اللاعب ${member.player?.username} من الكلان`)
      if (myGuild) {
        await loadClanDetails(myGuild.id)
        await loadGuilds()
      }
    } catch (err: any) {
      toast.error('فشل استبعاد العضو: ' + (err.message || ''))
    }
  }

  // Handle request to join clan
  const handleRequestToJoin = async (targetGuild: Guild) => {
    if (!isAuthenticated || !player) {
      setLoginModalOpen(true)
      return
    }
    if (myGuild) {
      toast.error('يجب مغادرة كلانك الحالي أولاً للتقديم على كلان آخر')
      return
    }
    if (targetGuild.memberCount >= targetGuild.maxMembers) {
      toast.error('الكلان مكتمل الحد الأقصى للأعضاء')
      return
    }
    if (myPendingGuildIds.has(targetGuild.id)) {
      toast.error('لقد أرسلت طلباً لهذا الكلان بالفعل وهو قيد المراجعة')
      return
    }

    setJoiningId(targetGuild.id)
    try {
      // 1. Insert into clan_join_requests table if exists
      await supabase.from('clan_join_requests').insert([{
        guild_id: targetGuild.id,
        player_id: player.id,
        status: 'pending'
      }]).catch(() => {})

      // 2. Send notification to guild leader
      await supabase.from('player_notifications').insert([{
        player_id: targetGuild.leaderId,
        type: 'clan_join_request',
        title: 'طلب انضمام جديد للكلان 🏰',
        message: `أرسل اللاعب ${player.username} طلباً للانضمام إلى كلانكم [${targetGuild.name}]`,
        icon: '🏰',
        is_read: false,
        metadata: {
          guild_id: targetGuild.id,
          guild_name: targetGuild.name,
          applicant_id: player.id,
          applicant_username: player.username,
          applicant_balance: (player as any).balance || 0,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      }])

      // 3. Update local pending set
      const updated = new Set(myPendingGuildIds)
      updated.add(targetGuild.id)
      setMyPendingGuildIds(updated)
      try {
        localStorage.setItem(`pending_clan_reqs_${player.id}`, JSON.stringify(Array.from(updated)))
      } catch {}

      toast.success('تم إرسال طلب الانضمام بنجاح! سينظر القائد أو نوابه في طلبك 🏰')
    } catch (err: any) {
      toast.error(err.message || 'فشل إرسال طلب الانضمام')
    } finally {
      setJoiningId(null)
    }
  }

  // Cancel request to join
  const handleCancelRequest = async (guildId: string) => {
    if (!player) return
    try {
      await supabase
        .from('clan_join_requests')
        .update({ status: 'cancelled' })
        .eq('guild_id', guildId)
        .eq('player_id', player.id)
        .catch(() => {})

      const updated = new Set(myPendingGuildIds)
      updated.delete(guildId)
      setMyPendingGuildIds(updated)
      try {
        localStorage.setItem(`pending_clan_reqs_${player.id}`, JSON.stringify(Array.from(updated)))
      } catch {}

      toast.success('تم إلغاء طلب الانضمام')
    } catch (err: any) {
      toast.error('فشل إلغاء الطلب')
    }
  }

  // Accept a join request
  const handleAcceptRequest = async (req: ClanJoinRequest) => {
    if (!myGuild) return
    if (clanMembers.length >= myGuild.maxMembers) {
      return toast.error('الكلان مكتمل الحد الأقصى للأعضاء')
    }

    setRequestActionLoading(req.id)
    try {
      // 1. Add player to guild_members
      const { error: insertErr } = await supabase
        .from('guild_members')
        .insert([{
          guild_id: myGuild.id,
          player_id: req.applicant_id,
          role: 'member',
          base_role: 'member'
        }])

      if (insertErr) throw insertErr

      // 2. Mark table request as accepted
      if (req.source === 'table') {
        await supabase
          .from('clan_join_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', req.id)
          .catch(() => {})
      }

      // 3. Update notification status
      if (req.notification_id) {
        await supabase
          .from('player_notifications')
          .update({
            is_read: true,
            metadata: { status: 'accepted', updated_at: new Date().toISOString() }
          })
          .eq('id', req.notification_id)
          .catch(() => {})
      }

      // 4. Send approval notification to applicant
      await supabase.from('player_notifications').insert([{
        player_id: req.applicant_id,
        type: 'clan_accepted',
        title: 'تم قبول انضمامك للكلان! 🎉',
        message: `مبروك! قبل قائد كلان [${myGuild.name}] طلب انضمامك للكلان. مرحباً بك!`,
        icon: '🏰',
        is_read: false,
        metadata: { guild_id: myGuild.id }
      }]).catch(() => {})

      toast.success(`تم قبول انضمام ${req.applicant_username} إلى الكلان! 🎉`)
      
      // Refresh members & requests
      await loadClanDetails(myGuild.id)
      await loadGuilds()
    } catch (err: any) {
      toast.error('فشل قبول الطلب: ' + (err.message || ''))
    } finally {
      setRequestActionLoading(null)
    }
  }

  // Reject a join request
  const handleRejectRequest = async (req: ClanJoinRequest) => {
    if (!myGuild) return

    setRequestActionLoading(req.id)
    try {
      // 1. Update table request if source table
      if (req.source === 'table') {
        await supabase
          .from('clan_join_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', req.id)
          .catch(() => {})
      }

      // 2. Update notification
      if (req.notification_id) {
        await supabase
          .from('player_notifications')
          .update({
            is_read: true,
            metadata: { status: 'rejected', updated_at: new Date().toISOString() }
          })
          .eq('id', req.notification_id)
          .catch(() => {})
      }

      // 3. Send notification to applicant
      await supabase.from('player_notifications').insert([{
        player_id: req.applicant_id,
        type: 'clan_rejected',
        title: 'طلب انضمام للكلان',
        message: `للأسف، تم رفض طلب انضمامك إلى كلان [${myGuild.name}].`,
        icon: '❌',
        is_read: false,
        metadata: { guild_id: myGuild.id }
      }]).catch(() => {})

      toast.success(`تم رفض طلب الانضمام`)
      setPendingRequests(prev => prev.filter(r => r.id !== req.id))
    } catch (err: any) {
      toast.error('فشل رفض الطلب: ' + (err.message || ''))
    } finally {
      setRequestActionLoading(null)
    }
  }

  const handleLeave = async (guildId: string) => {
    if (!player) return
    const ok = window.confirm("هل أنت متأكد من رغبتك في مغادرة الكلان؟")
    if (!ok) return

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

  const filteredGuilds = guilds.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              الكلانات ونظام الرتب المتقدم (Clan Roles)
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              إدارة الأعضاء، قبول ومراجعة طلبات الانضمام، وتعيين الرتب والصلاحيات للكلان
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
              <button onClick={() => setActiveTab("mine")} className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "mine" ? "bg-primary-500 text-white shadow-glow-blue" : "glass-card text-slate-400 hover:text-white"}`}>
                <span>إدارة ورتب كلاني ({myGuild.name})</span>
                {canManageRequests && pendingRequests.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[11px] font-black flex items-center justify-center animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
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
              {filteredGuilds.map((g, idx) => {
                const hasPending = myPendingGuildIds.has(g.id)

                return (
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
                      ) : hasPending ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                            <Clock size={12} className="animate-spin text-amber-400" />
                            طلبك قيد المراجعة
                          </span>
                          <button
                            onClick={() => handleCancelRequest(g.id)}
                            className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestToJoin(g)}
                          disabled={joiningId === g.id || g.memberCount >= g.maxMembers}
                          className="btn-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1.5"
                        >
                          <UserPlus size={14} />
                          {joiningId === g.id ? 'جارٍ الإرسال...' : g.memberCount >= g.maxMembers ? 'الكلان ممتلئ' : 'تقديم طلب انضمام'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )
        )}

        {/* TAB 2: MY CLAN MEMBERS, REQUESTS & ROLES */}
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
                  يمكن للقائد ونوابه مراجعة طلبات الانضمام، تعيين الرتب وتوزيع الصلاحيات
                </p>
              </div>

              {canManageRoles && (
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

            {/* Pending Requests Alert Banner (if manager and pending requests exist) */}
            {canManageRequests && pendingRequests.length > 0 && clanSubTab !== 'requests' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-primary-500/10 to-transparent border border-amber-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      لديك {pendingRequests.length} طلب انضمام جديد بانتظار الموافقة!
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      راجع طلبات اللاعبين الراغبين بالانضمام إلى كلانك واقبل من تراه مناسباً
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setClanSubTab('requests')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all whitespace-nowrap shadow-glow-amber"
                >
                  عرض الطلبات ({pendingRequests.length})
                </button>
              </div>
            )}

            {/* Sub-tabs: Members List vs Join Requests */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setClanSubTab('members')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  clanSubTab === 'members'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={15} />
                أعضاء الكلان ({clanMembers.length})
              </button>

              {canManageRequests && (
                <button
                  onClick={() => setClanSubTab('requests')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
                    clanSubTab === 'requests'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Inbox size={15} />
                  طلبات الانضمام ({pendingRequests.length})
                  {pendingRequests.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  )}
                </button>
              )}
            </div>

            {/* SUB-TAB 1: MEMBERS LIST */}
            {clanSubTab === 'members' && (
              loadingMembers ? (
                <div className="text-center py-12">
                  <Loader2 className="animate-spin text-primary-400 mx-auto" size={30} />
                  <p className="text-xs text-slate-400 mt-2">جارٍ تحميل أعضاء الكلان...</p>
                </div>
              ) : clanMembers.length === 0 ? (
                <div className="glass-card rounded-2xl p-10 text-center border border-slate-800">
                  <Users size={40} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">لا يوجد أعضاء مسجلون في الكلان حالياً</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {clanMembers.map((member) => {
                    const isLeader = member.base_role === 'leader'
                    const isDeputy = member.base_role === 'deputy_leader'
                    const memberCustomRole = customRoles.find(r => r.id === member.custom_role_id)
                    const isMe = member.player_id === player?.id

                    // Check if current user can assign roles or manage this member
                    const canEditMemberRole = 
                      (myBaseRole === 'leader' && !isMe) ||
                      (myBaseRole === 'deputy_leader' && !isMe && member.base_role === 'member')

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
                              {isMe && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 font-bold border border-primary-500/30">
                                  أنت
                                </span>
                              )}
                              {member.player?.equipped_title && (
                                <PlayerTitleBadge title={member.player.equipped_title} />
                              )}
                            </div>
                            
                            {/* Role badges & wallet */}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
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

                              {typeof member.player?.wallet_balance === 'number' && (
                                <span className="text-[10px] text-slate-500">
                                  ${member.player.wallet_balance.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Management Actions for Leader & Deputy Leader */}
                        {canEditMemberRole && (
                          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-800 w-full sm:w-auto justify-end">
                            {/* Promote / Demote Deputy (Leader only) */}
                            {myBaseRole === 'leader' && (
                              <button
                                onClick={() => handleSetBaseRole(member, isDeputy ? 'member' : 'deputy_leader')}
                                className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              >
                                {isDeputy ? 'عزل من النيابة' : 'ترقية لنائب قائد ⭐'}
                              </button>
                            )}

                            {/* Assign Custom Role Selector */}
                            <div className="relative">
                              <select
                                value={member.custom_role_id || ''}
                                onChange={(e) => handleAssignCustomRole(member.id, e.target.value || null)}
                                className="select-field text-xs py-1.5 px-3 font-bold pr-3 bg-slate-900 border-slate-700 rounded-xl"
                              >
                                <option value="">-- بدون رتبة --</option>
                                {customRoles.map((r) => (
                                  <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Kick Member Button */}
                            <button
                              onClick={() => handleKickMember(member)}
                              className="text-xs p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                              title="طرد من الكلان"
                            >
                              <UserX size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* SUB-TAB 2: JOIN REQUESTS (APPLICATIONS) */}
            {clanSubTab === 'requests' && canManageRequests && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Inbox size={16} className="text-primary-400" />
                      طلبات الانضمام المعلقة للكلان
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      القائد والمفوضون بصلاحية قبول الأعضاء يستطيعون الموافقة على الطلبات أو رفضها
                    </p>
                  </div>
                  <button
                    onClick={() => myGuild && loadClanJoinRequests(myGuild.id)}
                    className="btn-secondary text-xs p-2"
                    title="تحديث الطلبات"
                  >
                    <RefreshCw size={13} className={loadingRequests ? 'animate-spin' : ''} />
                  </button>
                </div>

                {loadingRequests ? (
                  <div className="text-center py-10">
                    <Loader2 className="animate-spin text-primary-400 mx-auto" size={24} />
                    <p className="text-xs text-slate-400 mt-2">جارٍ جلب طلبات الانضمام...</p>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
                    <CheckCircle2 size={40} className="text-emerald-500/60 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-slate-300">لا توجد طلبات انضمام معلقة حالياً</p>
                    <p className="text-xs text-slate-500 mt-1">
                      عندما يقوم لاعب بتقديم طلب انضمام للكلان سيظهر هنا فوراً للمراجعة
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-primary-600 flex items-center justify-center font-bold text-white text-sm shadow">
                            {req.applicant_username[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">{req.applicant_username}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                طلب جديد
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              {typeof req.applicant_balance === 'number' && (
                                <span>الرصيد: <strong className="text-slate-200">${req.applicant_balance.toLocaleString()}</strong></span>
                              )}
                              <span>
                                {new Date(req.created_at).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleRejectRequest(req)}
                            disabled={requestActionLoading === req.id}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-xs font-bold transition-all border border-slate-700 hover:border-red-500/30 flex items-center gap-1.5"
                          >
                            <X size={14} />
                            رفض
                          </button>
                          <button
                            onClick={() => handleAcceptRequest(req)}
                            disabled={requestActionLoading === req.id || clanMembers.length >= myGuild.maxMembers}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-glow-emerald flex items-center gap-1.5"
                          >
                            {requestActionLoading === req.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            قبول الانضمام
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                        <span className="font-bold text-amber-300">مراجعة وقبول طلبات الانضمام</span>
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
