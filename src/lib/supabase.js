import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isValid =
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.includes('.supabase.co') &&
  SUPABASE_ANON_KEY.length > 20

export const supabaseConfigured = isValid

const noop = () => Promise.resolve({ data: null, error: null })
const chain = () => {
  const obj = {
    select: () => obj,
    eq: () => obj,
    gte: () => obj,
    lte: () => obj,
    order: () => obj,
    limit: () => obj,
    single: noop,
    maybeSingle: noop,
    upsert: noop,
    insert: noop,
    update: noop,
    delete: noop,
  }
  return obj
}

const mockClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: () => Promise.resolve({ error: { message: '.env 파일에 Supabase 키를 입력해주세요.' } }),
    signInWithPassword: () => Promise.resolve({ error: { message: '.env 파일에 Supabase 키를 입력해주세요.' } }),
    signOut: () => Promise.resolve({}),
  },
  from: () => chain(),
}

let client = mockClient
if (isValid) {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  } catch (e) {
    console.warn('Supabase init failed:', e.message)
  }
}

export const supabase = client
