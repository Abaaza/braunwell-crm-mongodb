"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PageHeader } from "@/components/shared/page-header"
import { SearchBar } from "@/components/shared/search-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import {
  FileText,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Briefcase,
  Clock,
  CheckSquare,
  PoundSterling,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

interface TemplateTask {
  title: string
  description?: string
  priority?: "low" | "medium" | "high"
  daysFromStart: number
}

interface TemplateFormData {
  name: string
  description: string
  company: string
  expectedRevenueGBP: string
  durationDays: string
  tasks: TemplateTask[]
}

export default function ProjectTemplatesPage() {
  const { user, isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    description: "",
    company: "",
    expectedRevenueGBP: "",
    durationDays: "",
    tasks: [],
  })

  const templates = useQuery(api.projectTemplates.list)
  const createTemplate = useMutation(api.projectTemplates.create)
  const updateTemplate = useMutation(api.projectTemplates.update)
  const deleteTemplate = useMutation(api.projectTemplates.remove)

  const filteredTemplates = templates?.filter(template =>
    search === "" ||
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateTemplate = async () => {
    if (!user || !formData.name || !formData.expectedRevenueGBP) return

    try {
      await createTemplate({
        name: formData.name,
        description: formData.description || undefined,
        company: formData.company || undefined,
        expectedRevenueGBP: parseFloat(formData.expectedRevenueGBP) || 0,
        durationDays: formData.durationDays ? parseInt(formData.durationDays) : undefined,
        tasks: formData.tasks,
        userId: user.id,
      })

      toast.success("Template created successfully")
      setCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create template")
    }
  }

  const handleUpdateTemplate = async () => {
    if (!user || !selectedTemplate || !formData.name) return

    try {
      await updateTemplate({
        id: selectedTemplate._id,
        name: formData.name,
        description: formData.description || undefined,
        company: formData.company || undefined,
        expectedRevenueGBP: parseFloat(formData.expectedRevenueGBP) || 0,
        durationDays: formData.durationDays ? parseInt(formData.durationDays) : undefined,
        tasks: formData.tasks,
        userId: user.id,
      })

      toast.success("Template updated successfully")
      setEditDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to update template")
    }
  }

  const handleDeleteTemplate = async () => {
    if (!user || !selectedTemplate) return

    try {
      await deleteTemplate({
        id: selectedTemplate._id,
        userId: user.id,
      })

      toast.success("Template deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedTemplate(null)
    } catch (error) {
      toast.error("Failed to delete template")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      company: "",
      expectedRevenueGBP: "",
      durationDays: "",
      tasks: [],
    })
    setSelectedTemplate(null)
  }

  const openEditDialog = (template: any) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || "",
      company: template.company || "",
      expectedRevenueGBP: template.expectedRevenueGBP.toString(),
      durationDays: template.durationDays?.toString() || "",
      tasks: template.tasks || [],
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (template: any) => {
    setSelectedTemplate(template)
    setDeleteDialogOpen(true)
  }

  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { title: "", daysFromStart: 0 }],
    })
  }

  const updateTask = (index: number, field: keyof TemplateTask, value: any) => {
    const newTasks = [...formData.tasks]
    newTasks[index] = { ...newTasks[index], [field]: value }
    setFormData({ ...formData, tasks: newTasks })
  }

  const removeTask = (index: number) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Templates"
        description="Create and manage reusable project templates"
      >
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        )}
      </PageHeader>

      <div className="flex items-center justify-between">
        <SearchBar
          placeholder="Search templates..."
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
      </div>

      {filteredTemplates ? (
        filteredTemplates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card key={template._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(template)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => openDeleteDialog(template)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm">
                    {template.company && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{template.company}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <PoundSterling className="h-4 w-4 text-muted-foreground" />
                      <span>{formatCurrency(template.expectedRevenueGBP)}</span>
                    </div>
                    {template.durationDays && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{template.durationDays} days</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{template.tasks.length} tasks</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created by {template.creatorName}</span>
                    <span>{formatDate(template.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No templates found"
            description={search ? "Try adjusting your search" : "Create your first project template"}
            action={
              isAdmin ? {
                label: "Create Template",
                onClick: () => setCreateDialogOpen(true)
              } : undefined
            }
          />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Project Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for similar projects
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Website Development"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this template..."
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="company">Default Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="revenue">Expected Revenue (£) *</Label>
                <Input
                  id="revenue"
                  type="number"
                  value={formData.expectedRevenueGBP}
                  onChange={(e) => setFormData({ ...formData, expectedRevenueGBP: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                placeholder="Project duration in days"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Template Tasks</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTask}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
              {formData.tasks.map((task, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Task title"
                        value={task.title}
                        onChange={(e) => updateTask(index, "title", e.target.value)}
                      />
                      <Textarea
                        placeholder="Task description (optional)"
                        value={task.description || ""}
                        onChange={(e) => updateTask(index, "description", e.target.value)}
                        rows={2}
                      />
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <Label className="text-xs">Priority</Label>
                          <select
                            className="w-full p-2 border rounded-md text-sm"
                            value={task.priority || ""}
                            onChange={(e) => updateTask(index, "priority", e.target.value || undefined)}
                          >
                            <option value="">None</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Days from start</Label>
                          <Input
                            type="number"
                            value={task.daysFromStart}
                            onChange={(e) => updateTask(index, "daysFromStart", parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!formData.name || !formData.expectedRevenueGBP}
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project Template</DialogTitle>
            <DialogDescription>
              Update template details and tasks
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Same form fields as create dialog */}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Template Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Website Development"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this template..."
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-company">Default Company</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-revenue">Expected Revenue (£) *</Label>
                <Input
                  id="edit-revenue"
                  type="number"
                  value={formData.expectedRevenueGBP}
                  onChange={(e) => setFormData({ ...formData, expectedRevenueGBP: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-duration">Duration (days)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                placeholder="Project duration in days"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Template Tasks</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTask}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
              {formData.tasks.map((task, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Task title"
                        value={task.title}
                        onChange={(e) => updateTask(index, "title", e.target.value)}
                      />
                      <Textarea
                        placeholder="Task description (optional)"
                        value={task.description || ""}
                        onChange={(e) => updateTask(index, "description", e.target.value)}
                        rows={2}
                      />
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <Label className="text-xs">Priority</Label>
                          <select
                            className="w-full p-2 border rounded-md text-sm"
                            value={task.priority || ""}
                            onChange={(e) => updateTask(index, "priority", e.target.value || undefined)}
                          >
                            <option value="">None</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Days from start</Label>
                          <Input
                            type="number"
                            value={task.daysFromStart}
                            onChange={(e) => updateTask(index, "daysFromStart", parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTemplate}
              disabled={!formData.name || !formData.expectedRevenueGBP}
            >
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}