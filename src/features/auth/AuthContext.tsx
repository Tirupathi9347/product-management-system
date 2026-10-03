'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { getUserProfile, getUserSettings } from '@/lib/services'
import { Profile, UserSettings } from '@/types/database'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  settings: UserSettings | null
  isLoading: boolean
  isConfigured: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  settings: null,
  isLoading: true,
  isConfigured: false,
  error: null,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isConfigured } = getSupabaseConfig()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(isConfigured)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const fetchUserData = async (currentUser: User) => {
    try {
      const [userProfile, userSettings] = await Promise.all([
        getUserProfile(currentUser.id),
        getUserSettings(currentUser.id),
      ])
      setProfile(userProfile)
      setSettings(userSettings)
    } catch (err) {
      console.warn('Could not fetch user profile or settings:', err)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user)
    }
  }

  useEffect(() => {
    if (!isConfigured) {
      return
    }

    const supabase = getSupabaseBrowserClient()

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message)
      }
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      if (initialSession?.user) {
        fetchUserData(initialSession.user)
      }
      setIsLoading(false)
    })

    // 2. Realtime auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setError(null)

      if (newSession?.user) {
        await fetchUserData(newSession.user)
      } else {
        setProfile(null)
        setSettings(null)
      }

      setIsLoading(false)

      if (event === 'SIGNED_IN') {
        startTransition(() => {
          router.refresh()
        })
      }
      if (event === 'SIGNED_OUT') {
        startTransition(() => {
          router.push('/login')
          router.refresh()
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isConfigured, router])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      if (isConfigured) {
        const supabase = getSupabaseBrowserClient()
        await supabase.auth.signOut()
      }
      setUser(null)
      setSession(null)
      setProfile(null)
      setSettings(null)
      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error signing out')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        settings,
        isLoading,
        isConfigured,
        error,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
