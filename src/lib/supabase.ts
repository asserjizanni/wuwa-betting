import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim()
const supabaseUrl = (rawUrl && !rawUrl.includes('placeholder'))
  ? rawUrl.replace(/\/+$/, '')
  : 'https://axaoxpeqlobiljrromun.supabase.co'

const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim()
const supabaseAnonKey = (rawKey && !rawKey.includes('placeholder'))
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4YW94cGVxbG9iaWxqcnJvbXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTY5MDMsImV4cCI6MjEwNzY3MjkwM30.tMZ1sKPOpbGeCHTp4I-3puENq2JLfL_ZIWjg9c8_bAU'

export const SUPABASE_URL = supabaseUrl
export const SUPABASE_ANON_KEY = supabaseAnonKey

export const isConfigured = true

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (...args) => fetch(...args),
  },
})

export default supabase
