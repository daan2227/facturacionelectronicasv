import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  init: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      async init() {
        const { data } = await supabase.auth.getSession()
        set({ user: data.session?.user ?? null, loading: false })
        supabase.auth.onAuthStateChange((_e, session) =>
          set({ user: session?.user ?? null })
        )
      },
      async signIn(email, password) {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return error.message
        set({ user: data.user })
        return null
      },
      async signOut() {
        await supabase.auth.signOut()
        set({ user: null })
      },
    }),
    { name: 'auth', partialize: (s) => ({ user: s.user }) }
  )
)
