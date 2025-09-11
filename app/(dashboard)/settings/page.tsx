"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import {
  Settings,
  Building,
  Bell,
  Mail,
  Shield,
  Database,
  Globe,
  Clock,
  FileDown,
  HardDrive,
  Zap,
  Key,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { BackupRestore } from "@/components/settings/backup-restore"
import { NotificationPreferences } from "@/components/notifications/notification-preferences"

export default function SettingsPage() {
  const { user, isAdmin } = useAuth()
  const [companyName, setCompanyName] = useState("")
  const [supportEmail, setSupportEmail] = useState("")
  const [supportPhone, setSupportPhone] = useState("")
  const [timezone, setTimezone] = useState("Europe/London")
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")
  const [currency, setCurrency] = useState("GBP")
  const [language, setLanguage] = useState("en-GB")
  const [saving, setSaving] = useState(false)
  
  // Queries
  const organizationSettings = useQuery(api.settings.getOrganizationSettings)
  const notificationSettings = useQuery(
    api.settings.getUserNotificationSettings,
    user ? { userId: user.id } : "skip"
  )
  const securitySettings = useQuery(api.settings.getSecuritySettings)
  
  // Mutations
  const updateOrganization = useMutation(api.settings.updateOrganizationSettings)
  const updateNotifications = useMutation(api.settings.updateUserNotificationSettings)
  const updateSecurity = useMutation(api.settings.updateSecuritySettings)
  
  // Load organization settings
  useEffect(() => {
    if (organizationSettings) {
      setCompanyName(organizationSettings.companyName || "")
      setSupportEmail(organizationSettings.supportEmail || "")
      setSupportPhone(organizationSettings.supportPhone || "")
      setTimezone(organizationSettings.timezone || "Europe/London")
      setDateFormat(organizationSettings.dateFormat || "DD/MM/YYYY")
      setCurrency(organizationSettings.currency || "GBP")
      setLanguage(organizationSettings.language || "en-GB")
    }
  }, [organizationSettings])

  const handleSaveGeneral = async () => {
    if (!user || !isAdmin) return
    
    setSaving(true)
    try {
      await updateOrganization({
        companyName,
        supportEmail,
        supportPhone,
        timezone,
        dateFormat,
        currency,
        language,
        userId: user.id,
      })
      toast.success("Settings saved successfully")
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = () => {
    toast.info("Email configuration test not implemented in demo")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        description="Configure system settings and preferences"
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:flex lg:grid-cols-none">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          {isAdmin && <TabsTrigger value="system">System</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Configure your organization's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company-email">Support Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@company.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company-phone">Support Phone</Label>
                  <Input
                    id="company-phone"
                    type="tel"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+44 20 1234 5678"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveGeneral} 
                disabled={saving || !isAdmin}
                variant="gradient"
                animation="shine"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>
                Configure locale and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Dublin">Dublin (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleSaveGeneral} 
                disabled={saving || !isAdmin}
                variant="gradient"
                animation="shine"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationPreferences />

          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure email server settings for notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      placeholder="587"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtp-security">Security</Label>
                    <Select defaultValue="tls">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input
                    id="smtp-username"
                    placeholder="username@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    placeholder="Enter SMTP password"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="gradient" animation="shine">Save Configuration</Button>
                <Button variant="outline" onClick={handleTestEmail} className="hover:bg-primary/10 hover:text-primary">
                  <Mail className="mr-2 h-4 w-4" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
              <CardDescription>
                Connect with third-party services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isAdmin && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center">
                        <Settings className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Custom Fields</p>
                        <p className="text-sm text-muted-foreground">
                          Define custom fields for contacts, projects, and tasks
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/settings/custom-fields">
                        Configure
                      </Link>
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Google Workspace</p>
                      <p className="text-sm text-muted-foreground">
                        Sync contacts and calendar events
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Slack</p>
                      <p className="text-sm text-muted-foreground">
                        Send notifications to Slack channels
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-green-100 flex items-center justify-center">
                      <Database className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">QuickBooks</p>
                      <p className="text-sm text-muted-foreground">
                        Sync financial data
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>
                Manage API keys for external integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50 glass">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4" />
                  <p className="font-medium text-sm">Production API Key</p>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  pk_live_••••••••••••••••••••••••••••••••
                </p>
              </div>
              <Button variant="outline">
                Generate New API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 py-3 border-b">
                  <div className="flex-1">
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Require 2FA for all users
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0">Enable</Button>
                </div>
                <div className="flex items-start justify-between gap-4 py-3 border-b">
                  <div className="flex-1">
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Automatically log out inactive users
                    </p>
                  </div>
                  <Select defaultValue="7">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-start justify-between gap-4 py-3 border-b">
                  <div className="flex-1">
                    <p className="font-medium">Password Policy</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Minimum password requirements
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0">Configure</Button>
                </div>
                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1">
                    <p className="font-medium">IP Whitelist</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Restrict access to specific IP addresses
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Audit Log Retention</CardTitle>
              <CardDescription>
                Configure how long to retain audit logs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="retention-period">Retention Period</Label>
                <Select defaultValue="365">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="730">2 years</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border p-4 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Compliance Notice
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Ensure audit log retention complies with your industry regulations.
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="gradient" animation="shine">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <BackupRestore />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="system" className="space-y-6">
            <Card variant="elevated" interactive>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  View system status and information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Environment</span>
                    <span className="font-medium">Production</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Database</span>
                    <Badge variant="success">Connected</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage Used</span>
                    <span className="font-medium">2.4 GB / 10 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Calls (Today)</span>
                    <span className="font-medium">1,234</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" interactive>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>
                  View and download system logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border p-4 bg-muted/50 font-mono text-xs space-y-1">
                  <p className="text-muted-foreground">[2024-01-09 10:23:45] INFO: System startup complete</p>
                  <p className="text-muted-foreground">[2024-01-09 10:23:46] INFO: Database connection established</p>
                  <p className="text-muted-foreground">[2024-01-09 10:23:47] INFO: All services running normally</p>
                  <p className="text-green-600">[2024-01-09 10:23:48] SUCCESS: Health check passed</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/settings/logs">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View All Logs
                    </Link>
                  </Button>
                  <Button variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Download Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}