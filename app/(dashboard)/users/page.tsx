"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PageHeader } from "@/components/shared/page-header"
import { SearchBar } from "@/components/shared/search-bar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProtectedRoute, useAuth } from "@/lib/auth"
import { getInitials, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import {
  Users,
  MoreVertical,
  Shield,
  User,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  FolderOpen,
  CheckSquare,
  UserPlus,
  Key,
  Settings,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"
import { PermissionsMatrix } from "@/components/users/permissions-matrix"
import { UserActivity } from "@/components/users/user-activity"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newRole, setNewRole] = useState<"admin" | "user">("user")
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user"
  })

  const users = useQuery(api.users.list)
  const updateRole = useMutation(api.users.updateRole)
  const toggleStatus = useMutation(api.users.toggleStatus)
  const createUser = useMutation(api.users.createUser)

  const filteredUsers = users?.filter(user =>
    search === "" ||
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleUpdateRole = async () => {
    if (!currentUser || !selectedUser) return

    try {
      await updateRole({
        userId: selectedUser._id,
        role: newRole,
        currentUserId: currentUser.id,
      })
      
      toast.success("User role updated successfully")
      setRoleDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      toast.error((error as Error).message || "Failed to update role")
    }
  }

  const handleToggleStatus = async (userId: Id<"users">) => {
    if (!currentUser) return

    try {
      await toggleStatus({
        userId,
        currentUserId: currentUser.id,
      })
      
      toast.success("User status updated successfully")
    } catch (error) {
      toast.error((error as Error).message || "Failed to update status")
    }
  }

  const openRoleDialog = (user: any) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setRoleDialogOpen(true)
  }

  const openPermissionsDialog = (user: any) => {
    setSelectedUser(user)
    setPermissionsDialogOpen(true)
  }

  const handleCreateUser = async () => {
    if (!currentUser) return

    try {
      await createUser({
        name: newUserData.name,
        email: newUserData.email,
        password: newUserData.password,
        role: newUserData.role,
        createdBy: currentUser.id,
      })
      
      toast.success("User created successfully")
      setInviteDialogOpen(false)
      setNewUserData({
        name: "",
        email: "",
        password: "",
        role: "user"
      })
    } catch (error) {
      toast.error((error as Error).message || "Failed to create user")
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="User Management"
          description="Manage user accounts and permissions"
        >
          <Button 
            onClick={() => setInviteDialogOpen(true)}
            variant="gradient"
            animation="shine"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </PageHeader>

        <div className="flex items-center justify-between">
          <SearchBar
            placeholder="Search by name or email..."
            value={search}
            onChange={setSearch}
            className="max-w-md glass"
          />
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-300" />
              <span>Inactive</span>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card variant="elevated" interactive className="transition-all duration-200 hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Users</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
            </CardContent>
          </Card>
          <Card variant="elevated" interactive className="transition-all duration-200 hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Active Users</h3>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter(u => u.isActive !== false).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated" interactive className="transition-all duration-200 hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Admins</h3>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter(u => u.role === "admin").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated" interactive className="transition-all duration-200 hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Regular Users</h3>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter(u => u.role === "user").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card variant="elevated" interactive>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Last Login</th>
                  <th className="text-left p-4 font-medium">Projects</th>
                  <th className="text-left p-4 font-medium">Tasks</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers ? (
                  filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className={user.role === "admin" ? "bg-primary text-white" : ""}>
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? (
                              <>
                                <Shield className="mr-1 h-3 w-3" />
                                Admin
                              </>
                            ) : (
                              <>
                                <User className="mr-1 h-3 w-3" />
                                User
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {user.isActive !== false ? (
                              <>
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-sm">Active</span>
                              </>
                            ) : (
                              <>
                                <div className="h-2 w-2 rounded-full bg-gray-300" />
                                <span className="text-sm text-muted-foreground">Inactive</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {user.lastLoginAt
                              ? formatDateTime(user.lastLoginAt)
                              : "Never"}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">
                            <FolderOpen className="mr-1 h-3 w-3" />
                            {user.projectsCount}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">
                            <CheckSquare className="mr-1 h-3 w-3" />
                            {user.tasksCount}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={user._id === currentUser?.id}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPermissionsDialog(user)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Manage Permissions
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(user._id)}>
                                {user.isActive !== false ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  )
                ) : (
                  // Loading state
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full animate-shimmer" style={{animationDelay: `${i * 100}ms`}} />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32 animate-shimmer" style={{animationDelay: `${i * 100 + 50}ms`}} />
                            <Skeleton className="h-3 w-48 animate-shimmer" style={{animationDelay: `${i * 100 + 100}ms`}} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-12" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-12" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-8 w-8" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* User Activity */}
        <UserActivity limit={50} />

        {/* Change Role Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent className="glass border-0">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update the role for {selectedUser?.name}. Admins have full access to all features.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select
                value={newRole}
                onValueChange={(value: "admin" | "user") => setNewRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      User
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRole}>
                Update Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permissions Dialog */}
        <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass border-0">
            <DialogHeader>
              <DialogTitle>User Permissions</DialogTitle>
              <DialogDescription>
                Manage detailed permissions for {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && currentUser && (
              <PermissionsMatrix
                userId={selectedUser._id}
                userName={selectedUser.name}
                userRole={selectedUser.role}
                currentUserId={currentUser.id}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="glass border-0">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system with their credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUserData.role}
                  onValueChange={(value: "admin" | "user") => setNewUserData({ ...newUserData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        User
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setInviteDialogOpen(false)
                setNewUserData({
                  name: "",
                  email: "",
                  password: "",
                  role: "user"
                })
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={!newUserData.name || !newUserData.email || !newUserData.password}
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}