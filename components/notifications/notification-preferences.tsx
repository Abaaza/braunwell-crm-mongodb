"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  useNotificationPreferences, 
  useNotificationEffects 
} from "./notification-provider"
import { toast } from "sonner"

interface NotificationPreferencesProps {
  className?: string
}

const notificationTypes = [
  {
    key: "taskAssigned",
    label: "Task Assigned",
    description: "When a task is assigned to you",
  },
  {
    key: "taskUpdated",
    label: "Task Updated",
    description: "When a task you're assigned to is updated",
  },
  {
    key: "taskCompleted",
    label: "Task Completed",
    description: "When a task you created is completed",
  },
  {
    key: "projectCreated",
    label: "Project Created",
    description: "When a new project is created",
  },
  {
    key: "projectUpdated",
    label: "Project Updated",
    description: "When a project you're involved in is updated",
  },
  {
    key: "projectClosed",
    label: "Project Closed",
    description: "When a project you're involved in is closed",
  },
  {
    key: "contactCreated",
    label: "Contact Created",
    description: "When a new contact is added",
  },
  {
    key: "contactUpdated",
    label: "Contact Updated",
    description: "When a contact is updated",
  },
  {
    key: "paymentReceived",
    label: "Payment Received",
    description: "When a payment is received for any project",
  },
  {
    key: "systemMaintenance",
    label: "System Maintenance",
    description: "System maintenance and important announcements",
  },
  {
    key: "userMentioned",
    label: "User Mentioned",
    description: "When you are mentioned in comments or notes",
  },
]

export function NotificationPreferences({ className }: NotificationPreferencesProps) {
  const { preferences, updatePreference } = useNotificationPreferences()
  const { 
    soundEnabled, 
    setSoundEnabled, 
    vibrationEnabled, 
    setVibrationEnabled 
  } = useNotificationEffects()
  
  const [hasChanges, setHasChanges] = useState(false)

  const handlePreferenceChange = (key: string, value: boolean) => {
    updatePreference(key, value)
    setHasChanges(true)
  }

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled)
    setHasChanges(true)
  }

  const handleVibrationToggle = (enabled: boolean) => {
    setVibrationEnabled(enabled)
    setHasChanges(true)
  }

  const handleSave = () => {
    // Preferences are automatically saved to localStorage via the hook
    setHasChanges(false)
    toast.success("Notification preferences saved")
  }

  const handleTestNotification = () => {
    toast.info("Test Notification", {
      description: "This is a test notification to verify your settings are working correctly.",
      duration: 4000,
    })
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Customize which notifications you receive and how they're delivered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sound and Vibration Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Notification Effects</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-enabled">Sound Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Play a sound when notifications are received
                  </p>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={soundEnabled}
                  onCheckedChange={handleSoundToggle}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="vibration-enabled">Vibration</Label>
                  <p className="text-sm text-muted-foreground">
                    Vibrate device when notifications are received (mobile only)
                  </p>
                </div>
                <Switch
                  id="vibration-enabled"
                  checked={vibrationEnabled}
                  onCheckedChange={handleVibrationToggle}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <h4 className="font-medium">Notification Types</h4>
            <div className="space-y-3">
              {notificationTypes.map((type) => (
                <div key={type.key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={type.key}>{type.label}</Label>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                  <Switch
                    id={type.key}
                    checked={preferences[type.key as keyof typeof preferences]}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange(type.key, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges}
              variant={hasChanges ? "default" : "secondary"}
            >
              {hasChanges ? "Save Changes" : "Saved"}
            </Button>
            <Button 
              onClick={handleTestNotification}
              variant="outline"
            >
              Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}