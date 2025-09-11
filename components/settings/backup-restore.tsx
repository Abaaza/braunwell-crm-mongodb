"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Download, Upload, AlertTriangle, FileJson } from "lucide-react"
import { useAuth } from "@/lib/auth"

export function BackupRestore() {
  const { user } = useAuth()
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [clearExisting, setClearExisting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const exportData = useQuery(api.backup.exportData, user ? { userId: user.id } : "skip")
  const restoreData = useMutation(api.backup.restoreData)
  const logExport = useMutation(api.backup.logExport)

  const handleExport = async () => {
    if (!user || !exportData) return

    setIsExporting(true)
    try {
      // The data is already available from the query
      const backupData = exportData
      
      // Create a blob and download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `braunewell-crm-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Log the export action
      await logExport({ userId: user.id })
      
      toast.success("Backup exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export backup")
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/json") {
      setSelectedFile(file)
    } else {
      toast.error("Please select a valid JSON backup file")
    }
  }

  const handleRestore = async () => {
    if (!user || !selectedFile) return

    setIsRestoring(true)
    try {
      const text = await selectedFile.text()
      const backup = JSON.parse(text)
      
      // Validate backup structure
      if (!backup.version || !backup.data) {
        throw new Error("Invalid backup file format")
      }

      await restoreData({
        backup,
        userId: user.id,
        clearExisting,
      })
      
      toast.success("Data restored successfully")
      setRestoreDialogOpen(false)
      setSelectedFile(null)
      setClearExisting(false)
      
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Restore error:", error)
      toast.error("Failed to restore backup")
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data Backup & Restore</CardTitle>
          <CardDescription>
            Export your data for safekeeping or restore from a previous backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Export Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download all your CRM data as a JSON file. This includes contacts, projects, tasks, and all related information.
              </p>
              <Button onClick={handleExport} disabled={isExporting || !exportData}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export Backup"}
              </Button>
            </div>
          </div>

          <div className="border-t pt-6">
            {/* Import Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Restore Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a previously exported backup file to restore your data.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="backup-file" className="block mb-2">
                      Select Backup File
                    </Label>
                    <div className="flex items-center gap-4">
                      <input
                        id="backup-file"
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary file:text-primary-foreground
                          hover:file:bg-primary/90"
                      />
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>

                  <Button 
                    onClick={() => setRestoreDialogOpen(true)} 
                    disabled={!selectedFile || isRestoring}
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Restore from Backup
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileJson className="h-4 w-4" />
              <span>Backups are stored in JSON format and can be opened with any text editor</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Data from Backup</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                You are about to restore data from the selected backup file. This operation cannot be undone.
              </p>
              
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="clear-existing" className="text-base">
                    Replace all existing data
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Delete all current data before restoring
                  </p>
                </div>
                <Switch
                  id="clear-existing"
                  checked={clearExisting}
                  onCheckedChange={setClearExisting}
                />
              </div>
              
              {clearExisting && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-destructive">Warning</p>
                    <p className="text-muted-foreground">
                      All existing data will be permanently deleted before restoring from the backup.
                    </p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? "Restoring..." : "Restore Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}