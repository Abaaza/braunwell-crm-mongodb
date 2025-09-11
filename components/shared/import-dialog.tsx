"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  acceptedFormats?: string[]
  maxFileSize?: number // in MB
  templateUrl?: string
  onImport: (data: any[]) => Promise<{ success: number; errors: string[] }>
  parseFile?: (file: File) => Promise<any[]>
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  description,
  acceptedFormats = [".csv", ".xlsx"],
  maxFileSize = 5,
  templateUrl,
  onImport,
  parseFile,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    success?: number
    errors?: string[]
  } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0])
      }
    },
    []
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      setResult({
        errors: [`File size exceeds ${maxFileSize}MB limit`],
      })
      return
    }

    // Check file format
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
    if (!acceptedFormats.includes(fileExtension)) {
      setResult({
        errors: [`Invalid file format. Accepted formats: ${acceptedFormats.join(", ")}`],
      })
      return
    }

    setFile(file)
    setResult(null)
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress(0)
    setResult(null)

    try {
      // Parse file
      setProgress(25)
      let data: any[] = []
      
      if (parseFile) {
        data = await parseFile(file)
      } else {
        // Default CSV parsing
        const text = await file.text()
        const lines = text.split("\n").filter(line => line.trim())
        const headers = lines[0].split(",").map(h => h.trim())
        
        data = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim())
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || ""
            return obj
          }, {} as any)
        })
      }

      setProgress(50)

      // Import data
      const result = await onImport(data)
      setProgress(100)
      setResult(result)

      if (result.errors.length === 0) {
        setTimeout(() => {
          onOpenChange(false)
          setFile(null)
          setResult(null)
        }, 2000)
      }
    } catch (error) {
      setResult({
        errors: [(error as Error).message || "Import failed"],
      })
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setProgress(0)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) reset()
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          {!file && !result && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Accepted formats: {acceptedFormats.join(", ")} (max {maxFileSize}MB)
              </p>
              <label htmlFor="file-upload">
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept={acceptedFormats.join(",")}
                  onChange={handleFileInput}
                />
                <Button variant="secondary" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Select File
                  </span>
                </Button>
              </label>
            </div>
          )}

          {file && !importing && !result && (
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground ml-2">
                  ({(file.size / 1024 / 1024).toFixed(2)}MB)
                </span>
              </AlertDescription>
            </Alert>
          )}

          {importing && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Importing data... {progress}%
              </p>
            </div>
          )}

          {result && (
            <Alert variant={result.errors && result.errors.length > 0 ? "destructive" : "default"}>
              {result.errors && result.errors.length > 0 ? (
                <>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Import failed</p>
                    <ul className="text-sm space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Successfully imported {result.success} records
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}

          {templateUrl && (
            <div className="flex items-center justify-center pt-2">
              <Button
                variant="link"
                size="sm"
                asChild
                className="text-xs"
              >
                <a href={templateUrl} download>
                  <Download className="mr-2 h-3 w-3" />
                  Download template
                </a>
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          {file && !result && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          )}
          {result && result.errors && result.errors.length > 0 && (
            <Button onClick={reset} variant="secondary">
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}