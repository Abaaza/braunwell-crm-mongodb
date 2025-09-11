"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LazyAvatar } from "@/components/ui/lazy-image"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getInitials, formatDateTime } from "@/lib/utils"
import {
  User,
  Mail,
  Shield,
  Calendar,
  Camera,
  Key,
  Activity,
  Settings,
  LogOut,
  Trash2,
  Bell,
  Moon,
  Sun,
  Eye,
  EyeOff,
} from "lucide-react"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const updateProfile = useMutation(api.auth.updateProfile)
  const updateAvatar = useMutation(api.auth.updateAvatar)
  const updatePassword = useMutation(api.auth.updatePassword)
  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }
    
    try {
      await updatePassword({
        userId: user.id,
        currentPassword,
        newPassword,
      })
      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error((error as Error).message || "Failed to update password")
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB")
      return
    }
    
    setUploadingAvatar(true)
    
    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        await updateAvatar({
          userId: user.id,
          avatarData: base64,
        })
        
        toast.success("Avatar updated successfully")
        // Update will reflect on next page load
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error("Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteAccount = () => {
    toast.error("Account deletion is disabled in demo mode")
  }

  const handleSaveName = async () => {
    if (!user || !name.trim()) return

    try {
      await updateProfile({
        userId: user.id,
        name: name.trim(),
      })
      toast.success("Name updated successfully")
      setIsEditingName(false)
      // Update will reflect on next page load
    } catch (error) {
      toast.error("Failed to update name")
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Profile"
        description="Manage your personal information and preferences"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <LazyAvatar
                  src={user.avatar}
                  alt={user.name}
                  fallback={getInitials(user.name)}
                  size="xl"
                  className="bg-primary text-white text-2xl"
                />
                <div className="space-y-2">
                  <input
                    type="file"
                    id="avatar-upload"
                    className="sr-only"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  <label htmlFor="avatar-upload">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadingAvatar}
                      asChild
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <span>
                        <Camera className="mr-2 h-4 w-4" />
                        {uploadingAvatar ? "Uploading..." : "Change Avatar"}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    JPG, GIF or PNG. Max size 2MB.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={isEditingName ? name : user.name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditingName}
                    />
                    {isEditingName ? (
                      <>
                        <Button
                          size="sm"
                          onClick={handleSaveName}
                          disabled={!name.trim() || name.trim() === user.name}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingName(false)
                            setName("")
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingName(true)
                          setName(user.name)
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                    />
                    <Badge variant="secondary" className="shrink-0">
                      <Mail className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="role"
                      value={user.role === "admin" ? "Administrator" : "User"}
                      disabled
                    />
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      <Shield className="mr-1 h-3 w-3" />
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" variant="gradient" animation="shine">
                  <Key className="mr-2 h-4 w-4" />
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card variant="elevated" interactive className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Member Since</p>
                  <p className="text-muted-foreground">
                    {user.id ? "January 2024" : "Unknown"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Last Activity</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(Date.now())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Notifications</span>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Theme</span>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Light
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Language</span>
                </div>
                <Button variant="outline" size="sm" disabled>
                  English
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" disabled>
                <Key className="mr-2 h-4 w-4" />
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Mail className="mr-2 h-4 w-4" />
                Email Preferences
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Activity className="mr-2 h-4 w-4" />
                Download Activity Log
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}