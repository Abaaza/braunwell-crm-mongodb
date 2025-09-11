"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { PageHeader } from "@/components/shared/page-header"
import { SearchBar } from "@/components/shared/search-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { VirtualList } from "@/components/shared/virtual-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth"
import { formatDate, getInitials, cn } from "@/lib/utils"
import { toast } from "sonner"
import { BulkActions, SelectAllCheckbox, type BulkAction } from "@/components/shared/bulk-actions"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  CheckSquare,
  Plus,
  MoreVertical,
  Calendar,
  User,
  Flag,
  Grid3X3,
  List,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  RefreshCw,
  GitBranch,
  Lock,
} from "lucide-react"

type TaskFormData = {
  title: string
  description: string
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high" | "none"
  dueDate: string
  projectId: Id<"projects"> | ""
  assignedTo: Id<"users"> | "" | "unassigned"
  isRecurring: boolean
  recurringPattern: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | ""
  recurringEndDate: string
  dependencies: Id<"tasks">[]
}

const priorityConfig = {
  low: { label: "Low", color: "text-gray-500", bgColor: "bg-gray-100" },
  medium: { label: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  high: { label: "High", color: "text-red-600", bgColor: "bg-red-100" },
}

const statusConfig = {
  todo: { label: "To Do", icon: Clock, color: "text-gray-500" },
  in_progress: { label: "In Progress", icon: AlertCircle, color: "text-blue-500" },
  done: { label: "Done", icon: CheckCircle2, color: "text-green-500" },
}

export default function TasksPage() {
  const { user, isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [statusFilter, setStatusFilter] = useState<"all" | "todo" | "in_progress" | "done">("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "todo",
    priority: "none",
    dueDate: "",
    projectId: "",
    assignedTo: "",
    isRecurring: false,
    recurringPattern: "",
    recurringEndDate: "",
    dependencies: [],
  })
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<"todo" | "in_progress" | "done">("done")

  const tasks = useQuery(api.tasks.list, {
    search,
    status: statusFilter === "all" ? undefined : statusFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
  })
  const projects = useQuery(api.projects.list, { includeArchived: false })
  const templates = useQuery(api.taskTemplates.list, {})
  const users = useQuery(api.auth.getCurrentUser, { token: undefined }) // For assignee list
  const createTask = useMutation(api.tasks.create)
  const updateTask = useMutation(api.tasks.update)
  const updateTaskStatus = useMutation(api.tasks.updateStatus)
  const deleteTask = useMutation(api.tasks.remove)
  const deleteMultipleTasks = useMutation(api.tasks.removeMultiple)
  const updateMultipleStatus = useMutation(api.tasks.updateMultipleStatus)
  const createTaskFromTemplate = useMutation(api.taskTemplates.createTaskFromTemplate)

  const handleCreateTask = async () => {
    if (!user || !formData.projectId) return

    try {
      await createTask({
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority === "none" ? undefined : formData.priority as "low" | "medium" | "high" | undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
        projectId: formData.projectId,
        assignedTo: formData.assignedTo === "unassigned" || formData.assignedTo === "" ? undefined : formData.assignedTo,
        userId: user.id,
        isRecurring: formData.isRecurring,
        recurringPattern: formData.isRecurring && formData.recurringPattern ? formData.recurringPattern as any : undefined,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate ? new Date(formData.recurringEndDate).getTime() : undefined,
        dependencies: formData.dependencies.length > 0 ? formData.dependencies : undefined,
      })
      
      toast.success("Task created successfully")
      setCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create task")
    }
  }

  const handleUpdateTask = async () => {
    if (!user || !selectedTask) return

    try {
      await updateTask({
        id: selectedTask._id,
        title: formData.title || undefined,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority === "none" ? undefined : formData.priority as "low" | "medium" | "high" | undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
        assignedTo: formData.assignedTo === "unassigned" || formData.assignedTo === "" ? undefined : formData.assignedTo,
        dependencies: formData.dependencies.length > 0 ? formData.dependencies : undefined,
        userId: user.id,
      })
      
      toast.success("Task updated successfully")
      setEditDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to update task")
    }
  }

  const handleDeleteTask = async () => {
    if (!user || !selectedTask) return

    try {
      await deleteTask({
        id: selectedTask._id,
        userId: user.id,
      })
      
      toast.success("Task deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedTask(null)
    } catch (error) {
      toast.error("Failed to delete task")
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: "todo" | "in_progress" | "done") => {
    e.preventDefault()
    if (!user) return

    const taskId = e.dataTransfer.getData("taskId") as Id<"tasks">
    
    try {
      const result = await updateTaskStatus({
        id: taskId,
        status: newStatus,
        userId: user.id,
      })
      
      // Check if this was a recurring task that created a new occurrence
      if (newStatus === "done" && typeof result === 'object' && result.nextTaskId) {
        toast.success("Task completed and next recurrence created")
      } else {
        toast.success("Task status updated")
      }
    } catch (error) {
      toast.error("Failed to update task status")
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "todo",
      priority: "none",
      dueDate: "",
      projectId: "",
      assignedTo: "",
      isRecurring: false,
      recurringPattern: "",
      recurringEndDate: "",
      dependencies: [],
    })
    setSelectedTask(null)
    setSelectedTemplateId("")
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t._id === templateId)
    if (template) {
      setFormData({
        ...formData,
        title: template.title,
        description: template.description || "",
        priority: template.priority || "none",
      })
    } else {
      setFormData({
        ...formData,
        title: "",
        description: "",
        priority: "none",
      })
    }
    setSelectedTemplateId(templateId)
  }

  const openEditDialog = (task: any) => {
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority || "none",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      projectId: task.projectId,
      assignedTo: task.assignedTo || "unassigned",
      isRecurring: task.isRecurring || false,
      recurringPattern: task.recurringPattern || "",
      recurringEndDate: task.recurringEndDate ? new Date(task.recurringEndDate).toISOString().split('T')[0] : "",
      dependencies: task.dependencies || [],
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (task: any) => {
    setSelectedTask(task)
    setDeleteDialogOpen(true)
  }

  const isOverdue = (dueDate?: number) => {
    return dueDate && dueDate < Date.now()
  }

  // Bulk actions handlers
  const handleBulkDelete = async () => {
    if (!user || selectedTasks.size === 0) return

    try {
      await deleteMultipleTasks({
        ids: Array.from(selectedTasks) as any[],
        userId: user.id,
      })
      toast.success(`Deleted ${selectedTasks.size} tasks`)
      setSelectedTasks(new Set())
      setBulkDeleteOpen(false)
    } catch (error) {
      toast.error("Failed to delete tasks")
    }
  }

  const handleBulkStatusChange = async () => {
    if (!user || selectedTasks.size === 0) return

    try {
      const result = await updateMultipleStatus({
        ids: Array.from(selectedTasks) as any[],
        status: bulkStatus,
        userId: user.id,
      })
      
      let message = `Updated ${result.updatedCount} tasks to ${statusConfig[bulkStatus].label}`
      if (bulkStatus === "done" && result.recurringTasksCreated > 0) {
        message += ` and created ${result.recurringTasksCreated} recurring tasks`
      }
      
      toast.success(message)
      setSelectedTasks(new Set())
      setBulkStatusOpen(false)
    } catch (error) {
      toast.error("Failed to update tasks")
    }
  }

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks)
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId)
    } else {
      newSelection.add(taskId)
    }
    setSelectedTasks(newSelection)
  }

  const toggleAllTasks = () => {
    const visibleTasks = tasks || []
    if (selectedTasks.size === visibleTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(visibleTasks.map(t => t._id)))
    }
  }

  const bulkActions: BulkAction[] = [
    {
      label: "Change Status",
      icon: <Edit className="h-4 w-4" />,
      onClick: () => setBulkStatusOpen(true),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setBulkDeleteOpen(true),
      variant: "destructive",
    },
  ]

  const TaskCard = ({ task }: { task: any }) => (
    <Card
      draggable
      onDragStart={(e) => handleDragStart(e, task._id)}
      className={cn(
        "cursor-move transition-all duration-200 relative",
        selectedTasks.has(task._id) && "ring-2 ring-primary"
      )}
      variant="elevated"
      interactive
    >
      {isAdmin && (
        <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={selectedTasks.has(task._id)}
            onChange={() => toggleTaskSelection(task._id)}
          />
        </div>
      )}
      <CardHeader className={cn("pb-3", isAdmin && "pl-10")}>
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(task)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => openDeleteDialog(task)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center gap-3">
          {task.priority && task.priority in priorityConfig && (
            <div className="flex items-center gap-1">
              <Flag className={`h-3 w-3 ${priorityConfig[task.priority as keyof typeof priorityConfig].color}`} />
              <span className={`text-xs font-medium ${priorityConfig[task.priority as keyof typeof priorityConfig].color}`}>
                {priorityConfig[task.priority as keyof typeof priorityConfig].label}
              </span>
            </div>
          )}
          {task.isRecurring && (
            <div className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">
                Recurring
              </span>
            </div>
          )}
          {task.dependencies && task.dependencies.length > 0 && (
            <div className="flex items-center gap-1">
              <GitBranch className="h-3 w-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-600">
                {task.dependencies.length} dependencies
              </span>
            </div>
          )}
          {task.blockedBy && task.blockedBy.length > 0 && (
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-orange-600" />
              <span className="text-xs font-medium text-orange-600">
                Blocks {task.blockedBy.length} tasks
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-primary">{task.projectName}</span>
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue(task.dueDate) ? "text-destructive" : ""}`}>
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
        
        {task.assigneeName && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(task.assigneeName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{task.assigneeName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const KanbanColumn = ({ status, title, tasks: columnTasks }: {
    status: "todo" | "in_progress" | "done"
    title: string
    tasks: any[]
  }) => {
    const StatusIcon = statusConfig[status].icon
    const columnColor = status === "todo" ? "border-gray-300" : status === "in_progress" ? "border-blue-300" : "border-green-300"
    
    return (
      <div
        className={`flex-1 bg-muted/30 rounded-lg p-4 border-t-4 ${columnColor}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusConfig[status].color}`} />
            <h3 className="font-semibold">{title}</h3>
            <Badge variant="secondary">{columnTasks.length}</Badge>
          </div>
        </div>
        <div className="space-y-3">
          {columnTasks.length > 0 ? (
            columnTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">Drop tasks here</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tasks"
        description="Manage and track your project tasks"
      >
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link href="/tasks/templates">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Templates
              </Button>
            </Link>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              variant="gradient"
              animation="shine"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 flex-1">
          <SearchBar
            placeholder="Search tasks..."
            value={search}
            onChange={setSearch}
            className="max-w-sm glass"
          />
          <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
            <SelectTrigger className="w-[140px] glass">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          {viewMode === "list" && (
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px] glass">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("kanban")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tasks View */}
      {tasks ? (
        viewMode === "kanban" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            <KanbanColumn
              status="todo"
              title="To Do"
              tasks={tasks.filter(t => t.status === "todo")}
            />
            <KanbanColumn
              status="in_progress"
              title="In Progress"
              tasks={tasks.filter(t => t.status === "in_progress")}
            />
            <KanbanColumn
              status="done"
              title="Done"
              tasks={tasks.filter(t => t.status === "done")}
            />
          </div>
        ) : (
          <Card variant="elevated" interactive>
            {/* Table Header */}
            <div className="border-b">
              <div className="flex items-center px-4 py-3 font-medium text-sm">
                {isAdmin && (
                  <div className="w-12">
                    <SelectAllCheckbox
                      checked={selectedTasks.size === (tasks?.length || 0)}
                      indeterminate={selectedTasks.size > 0 && selectedTasks.size < (tasks?.length || 0)}
                      onCheckedChange={toggleAllTasks}
                    />
                  </div>
                )}
                <div className="flex-1 grid grid-cols-6 gap-4">
                  <div>Task</div>
                  <div>Project</div>
                  <div>Status</div>
                  <div>Priority</div>
                  <div>Assignee</div>
                  <div>Due Date</div>
                </div>
                {isAdmin && <div className="w-12 text-right">Actions</div>}
              </div>
            </div>
            
            {/* Virtual List */}
            {tasks.length > 0 ? (
              <VirtualList
                items={tasks}
                height="calc(100vh - 450px)"
                itemHeight={80}
                renderItem={(task) => {
                  const StatusIcon = statusConfig[task.status].icon
                  return (
                    <div
                      key={task._id}
                      className={cn(
                        "flex items-center px-4 py-4 border-b hover:bg-muted/50",
                        selectedTasks.has(task._id) && "bg-muted/50"
                      )}
                    >
                      {isAdmin && (
                        <div className="w-12">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 transition-all duration-200 hover:border-primary focus:ring-primary"
                            checked={selectedTasks.has(task._id)}
                            onChange={() => toggleTaskSelection(task._id)}
                          />
                        </div>
                      )}
                      <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-sm">{task.projectName}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${statusConfig[task.status].color}`} />
                            <span className="text-sm">{statusConfig[task.status].label}</span>
                          </div>
                        </div>
                        <div>
                          {task.priority && (
                            <Badge className={`${priorityConfig[task.priority].bgColor} ${priorityConfig[task.priority].color}`}>
                              {priorityConfig[task.priority].label}
                            </Badge>
                          )}
                        </div>
                        <div>
                          {task.assigneeName ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(task.assigneeName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{task.assigneeName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </div>
                        <div>
                          {task.dueDate ? (
                            <span className={`text-sm ${isOverdue(task.dueDate) ? "text-destructive font-medium" : ""}`}>
                              {formatDate(task.dueDate)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="w-12 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(task)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteDialog(task)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  )
                }}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No tasks found
              </div>
            )}
          </Card>
        )
      ) : (
        // Loading state
        <div className="space-y-4">
          <Skeleton className="h-32 animate-shimmer" />
          <Skeleton className="h-32 animate-shimmer" />
          <Skeleton className="h-32 animate-shimmer" />
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg glass border-0">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to track work
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {templates && templates.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="template">Use Template (optional)</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template._id} value={template._id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value as Id<"projects"> | "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.filter(p => p.status === "open").map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "todo" | "in_progress" | "done") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as "low" | "medium" | "high" | "none" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value as Id<"users"> | "" | "unassigned" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {user && (
                    <SelectItem value={user.id}>
                      {user.name} (Me)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Task Dependencies */}
            <div className="grid gap-2">
              <Label htmlFor="dependencies">Dependencies</Label>
              <div className="space-y-2">
                <Select
                  value=""
                  onValueChange={(value) => {
                    const taskId = value as Id<"tasks">
                    if (!formData.dependencies.includes(taskId)) {
                      setFormData({ ...formData, dependencies: [...formData.dependencies, taskId] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task dependencies" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks?.filter(t => 
                      t._id !== selectedTask?._id && 
                      t.projectId === formData.projectId &&
                      !formData.dependencies.includes(t._id)
                    ).map((task) => (
                      <SelectItem key={task._id} value={task._id}>
                        {task.title} ({statusConfig[task.status].label})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.dependencies.length > 0 && (
                  <div className="space-y-1">
                    {formData.dependencies.map((depId) => {
                      const depTask = tasks?.find(t => t._id === depId)
                      return depTask ? (
                        <div key={depId} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">
                            {depTask.title} 
                            <Badge variant="outline" className="ml-2">
                              {statusConfig[depTask.status].label}
                            </Badge>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData({ 
                              ...formData, 
                              dependencies: formData.dependencies.filter(d => d !== depId) 
                            })}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Recurring Task Settings */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isRecurring: !!checked })
                  }
                  className="transition-all duration-200 hover:border-primary focus:ring-primary"
                />
                <Label 
                  htmlFor="recurring" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Make this a recurring task
                </Label>
              </div>
              
              {formData.isRecurring && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="recurringPattern">Repeat</Label>
                    <Select
                      value={formData.recurringPattern}
                      onValueChange={(value) => setFormData({ ...formData, recurringPattern: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recurringEndDate">End Date (optional)</Label>
                    <Input
                      id="recurringEndDate"
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                      min={formData.dueDate}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!formData.title || !formData.projectId}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg glass border-0">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "todo" | "in_progress" | "done") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as "low" | "medium" | "high" | "none" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-assignee">Assignee</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value as Id<"users"> | "" | "unassigned" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {user && (
                      <SelectItem value={user.id}>
                        {user.name} (Me)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Task Dependencies */}
            <div className="grid gap-2">
              <Label htmlFor="edit-dependencies">Dependencies</Label>
              <div className="space-y-2">
                <Select
                  value=""
                  onValueChange={(value) => {
                    const taskId = value as Id<"tasks">
                    if (!formData.dependencies.includes(taskId)) {
                      setFormData({ ...formData, dependencies: [...formData.dependencies, taskId] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task dependencies" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks?.filter(t => 
                      t._id !== selectedTask?._id && 
                      t.projectId === selectedTask?.projectId &&
                      !formData.dependencies.includes(t._id)
                    ).map((task) => (
                      <SelectItem key={task._id} value={task._id}>
                        {task.title} ({statusConfig[task.status].label})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.dependencies.length > 0 && (
                  <div className="space-y-1">
                    {formData.dependencies.map((depId) => {
                      const depTask = tasks?.find(t => t._id === depId)
                      return depTask ? (
                        <div key={depId} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">
                            {depTask.title} 
                            <Badge variant="outline" className="ml-2">
                              {statusConfig[depTask.status].label}
                            </Badge>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData({ 
                              ...formData, 
                              dependencies: formData.dependencies.filter(d => d !== depId) 
                            })}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTask}
              disabled={!formData.title}
            >
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass border-0">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTask?.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Selected Tasks"
        description={`Are you sure you want to delete ${selectedTasks.size} task${selectedTasks.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete Tasks"
        onConfirm={handleBulkDelete}
        variant="destructive"
      />

      {/* Bulk Status Change Dialog */}
      <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <DialogContent className="glass border-0">
          <DialogHeader>
            <DialogTitle>Change Task Status</DialogTitle>
            <DialogDescription>
              Change the status of {selectedTasks.size} selected task{selectedTasks.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={bulkStatus} onValueChange={(value: any) => setBulkStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkStatusChange}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Toolbar */}
      <BulkActions
        selectedCount={selectedTasks.size}
        onClearSelection={() => setSelectedTasks(new Set())}
        actions={bulkActions}
      />
    </div>
  )
}