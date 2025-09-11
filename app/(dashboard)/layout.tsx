"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ProtectedRoute, useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { GlobalSearch } from "@/components/shared/global-search"
import { BraunwellLogo } from "@/components/shared/braunwell-logo"
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  UserCircle,
  LogOut,
  Menu,
  X,
  Bell,
  FileText,
  Receipt,
  Heart
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { useState } from "react"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { NotificationProvider } from "@/components/notifications/notification-provider"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

const adminNavigation = [
  { name: "Users", href: "/users", icon: Users },
]

const userNavigation = [
  { name: "Profile", href: "/profile", icon: UserCircle },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProtectedRoute>
      <NotificationProvider>
        <div className="flex h-screen bg-gray-50">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-lg shadow-xl transform transition-all duration-300 lg:relative lg:transform-none",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-6 border-b bg-white/50 backdrop-blur">
              <div className="transition-transform duration-300 hover:scale-105">
                <BraunwellLogo size="md" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-primary to-primary-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse-glow" />
                    )}
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-200 relative z-10",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    <span className="relative z-10">{item.name}</span>
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/40 rounded-l-full" />
                    )}
                  </Link>
                )
              })}

              {isAdmin && (
                <>
                  <div className="pt-4">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin
                    </p>
                  </div>
                  {adminNavigation.map((item, index) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                          isActive
                            ? "bg-gradient-to-r from-primary to-primary-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                        style={{
                          animationDelay: `${(navigation.length + index) * 50}ms`,
                        }}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse-glow" />
                        )}
                        <item.icon className={cn(
                          "h-5 w-5 transition-transform duration-200 relative z-10",
                          isActive ? "scale-110" : "group-hover:scale-110"
                        )} />
                        <span className="relative z-10">{item.name}</span>
                        {isActive && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/40 rounded-l-full" />
                        )}
                      </Link>
                    )
                  })}
                </>
              )}

              <div className="pt-4">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Account
                </p>
              </div>
              {userNavigation.map((item, index) => {
                const isActive = pathname === item.href
                const totalPreviousItems = navigation.length + (isAdmin ? adminNavigation.length : 0)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-primary to-primary-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    style={{
                      animationDelay: `${(totalPreviousItems + index) * 50}ms`,
                    }}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse-glow" />
                    )}
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-200 relative z-10",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    <span className="relative z-10">{item.name}</span>
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/40 rounded-l-full" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* User info */}
            <div className="border-t bg-gray-50/50 p-4 space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50 backdrop-blur">
                <Avatar className="ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-600 text-white font-semibold">
                    {user ? getInitials(user.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Logout"
                  className="hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Footer in sidebar */}
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-400">
                  Built by{" "}
                  <a 
                    href="https://braunwell.co.uk" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-gray-600 underline underline-offset-2"
                  >
                    Braunwell
                  </a>{" "}
                  with <Heart className="inline h-3 w-3 fill-red-500 text-red-500" />
                </p>
                <p className="text-xs text-gray-400">
                  © {new Date().getFullYear()}{" "}
                  <a 
                    href="https://braunwell.co.uk" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-gray-600 underline underline-offset-2"
                  >
                    Braunwell
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Top bar */}
          <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm border-b flex items-center px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-primary/10 hover:text-primary"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Global Search */}
              <div className="flex-1 max-w-2xl animate-fade-in">
                <GlobalSearch />
              </div>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <NotificationCenter />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto relative">
            <div className="absolute inset-0 bg-gradient-mesh opacity-[0.03]" />
            <div className="container mx-auto px-6 py-8 relative z-10">
              {children}
            </div>
          </main>
        </div>
        </div>
      </NotificationProvider>
    </ProtectedRoute>
  )
}