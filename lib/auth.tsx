"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCookie, setCookie, deleteCookie } from "cookies-next"
import { api } from "@/lib/api"

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, csrfToken?: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const demoMode = getCookie("demo-mode") === "true"
  
  useEffect(() => {
    const checkAuth = async () => {
      if (demoMode) {
        setUser({
          id: "demo",
          email: "demo@braunwell.co.uk",
          name: "Demo User",
          role: "admin",
        })
        setLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('auth-token')
        if (token) {
          const currentUser = await api.auth.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('auth-token')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [demoMode])
  
  const login = async (email: string, password: string, csrfToken?: string) => {
    try {
      const result = await api.auth.login(email, password)
      
      if (!result || !result.user) {
        throw new Error("Invalid response from server")
      }
      
      setUser(result.user)
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error in auth context:", error)
      throw error
    }
  }
  
  const logout = async () => {
    try {
      await api.auth.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
    localStorage.removeItem('auth-token')
    router.push("/login")
  }
  
  const isAdmin = user?.role === "admin"
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function ProtectedRoute({ children, adminOnly = false }: {
  children: React.ReactNode
  adminOnly?: boolean
}) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (!loading && adminOnly && !isAdmin) {
      router.push("/dashboard")
    }
  }, [user, loading, adminOnly, isAdmin, router])
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (!user || (adminOnly && !isAdmin)) {
    return null
  }
  
  return <>{children}</>
}