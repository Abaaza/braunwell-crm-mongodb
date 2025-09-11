"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Shield, User, Users } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

interface PermissionsMatrixProps {
  userId: Id<"users">
  userName: string
  userRole: "admin" | "user"
  currentUserId: Id<"users">
}

export function PermissionsMatrix({ userId, userName, userRole, currentUserId }: PermissionsMatrixProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  const permissions = useQuery(api.permissions.getPermissions)
  const userPermissions = useQuery(api.permissions.getUserPermissions, { userId })
  const updatePermissions = useMutation(api.permissions.updateUserPermissions)

  useEffect(() => {
    if (userPermissions) {
      setSelectedPermissions(new Set(userPermissions))
    }
  }, [userPermissions])

  const handlePermissionToggle = (permissionId: string) => {
    const newPermissions = new Set(selectedPermissions)
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId)
    } else {
      newPermissions.add(permissionId)
    }
    setSelectedPermissions(newPermissions)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updatePermissions({
        userId,
        permissions: Array.from(selectedPermissions),
        updatedBy: currentUserId,
      })
      toast.success("Permissions updated successfully")
    } catch (error) {
      toast.error("Failed to update permissions")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectAll = (category: string) => {
    const categoryPermissions = permissions?.filter(p => p.category === category) || []
    const newPermissions = new Set(selectedPermissions)
    categoryPermissions.forEach(p => newPermissions.add(p.id))
    setSelectedPermissions(newPermissions)
  }

  const handleDeselectAll = (category: string) => {
    const categoryPermissions = permissions?.filter(p => p.category === category) || []
    const newPermissions = new Set(selectedPermissions)
    categoryPermissions.forEach(p => newPermissions.delete(p.id))
    setSelectedPermissions(newPermissions)
  }

  if (!permissions) {
    return <div>Loading permissions...</div>
  }

  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, typeof permissions>)

  const isAdmin = userRole === "admin"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Permissions Matrix</CardTitle>
            <CardDescription>
              Manage permissions for {userName}
            </CardDescription>
          </div>
          <Badge variant={isAdmin ? "default" : "secondary"}>
            <User className="mr-1 h-3 w-3" />
            {isAdmin ? "Admin" : "User"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isAdmin ? (
          <div className="rounded-lg bg-muted p-4 mb-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">Admin users have all permissions by default</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Admin permissions cannot be modified. To change permissions, first change the user role.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                  const allSelected = categoryPermissions.every(p => selectedPermissions.has(p.id))
                  const someSelected = categoryPermissions.some(p => selectedPermissions.has(p.id))
                  
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{category}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectAll(category)}
                            disabled={allSelected}
                          >
                            Select All
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeselectAll(category)}
                            disabled={!someSelected}
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {categoryPermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50"
                          >
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.has(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                            />
                            <div className="flex-1 space-y-1">
                              <Label
                                htmlFor={permission.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {permission.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {category !== Object.keys(permissionsByCategory)[Object.keys(permissionsByCategory).length - 1] && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedPermissions.size} permissions selected
              </p>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}