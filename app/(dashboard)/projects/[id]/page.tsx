"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { projectSchema, type ProjectFormData } from "@/lib/validations"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchBar } from "@/components/shared/search-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { useAuth } from "@/lib/auth"
import { formatCurrency, formatDate, formatDateTime, getInitials, formatCurrencyWithVAT, calculateVAT, calculateGrossAmount } from "@/lib/utils"
import { toast } from "sonner"
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp,
  CheckSquare,
  Users,
  Calendar,
  Clock,
  Plus,
  FileDown,
  Archive,
  AlertCircle,
  CheckCircle2,
  Phone,
  Building,
  Eye,
  CreditCard,
  PoundSterling,
  Copy,
  FileText,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ProjectRevenueChart } from "@/components/analytics/project-revenue-chart"
import { ProjectTimeline } from "@/components/projects/project-timeline"
import { ExpenseList } from "@/components/expenses/expense-list"
import { cn } from "@/lib/utils"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [linkContactDialogOpen, setLinkContactDialogOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<Id<"contacts"> | null>(null)
  const [contactRole, setContactRole] = useState("")
  const [contactNotes, setContactNotes] = useState("")
  const [contactSearch, setContactSearch] = useState("")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "card" | "cash" | "cheque">("bank_transfer")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [paymentVATInclusive, setPaymentVATInclusive] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateName, setDuplicateName] = useState("")
  const [duplicateIncludeTasks, setDuplicateIncludeTasks] = useState(true)
  const [duplicateIncludeContacts, setDuplicateIncludeContacts] = useState(true)
  const [duplicateIncludePayments, setDuplicateIncludePayments] = useState(false)
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "open",
      expectedRevenueGBP: 0,
      startDate: undefined,
      endDate: undefined,
    },
  })

  const projectId = params.id as Id<"projects">
  const project = useQuery(api.projects.get, { id: projectId })
  const projectFinancials = useQuery(api.projects.getProjectFinancials, { id: projectId })
  const contacts = useQuery(api.contacts.list, { search: "" }) // In real app, would filter by project
  const updateProject = useMutation(api.projects.update)
  const deleteProject = useMutation(api.projects.remove)
  const createTask = useMutation(api.tasks.create)
  const updateTaskStatus = useMutation(api.tasks.updateStatus)
  const projectContacts = useQuery(api.projectContacts.getProjectContacts, { projectId })
  const duplicateProject = useMutation(api.projects.duplicate)
  const archiveProject = useMutation(api.projects.archive)
  const unarchiveProject = useMutation(api.projects.unarchive)
  const availableContacts = useQuery(api.projectContacts.getAvailableContacts, { 
    projectId, 
    search: contactSearch 
  })
  const addContactToProject = useMutation(api.projectContacts.addContactToProject)
  const removeContactFromProject = useMutation(api.projectContacts.removeContactFromProject)
  const payments = useQuery(api.projectPayments.list, { projectId })
  const totalPaid = useQuery(api.projectPayments.getTotalPaid, { projectId })
  const vatSummary = useQuery(api.projectPayments.getVATSummary, { projectId })
  const createPayment = useMutation(api.projectPayments.create)
  const projectInvoices = useQuery(api.invoices.list, { projectId })

  const handleEditProject = () => {
    if (!project) return
    
    form.reset({
      name: project.name,
      company: project.company || "",
      description: project.description || "",
      status: project.status,
      expectedRevenueGBP: project.expectedRevenueGBP,
      startDate: project.startDate ? new Date(project.startDate) : undefined,
      endDate: project.endDate ? new Date(project.endDate) : undefined,
    })
    setEditDialogOpen(true)
  }

  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!user) return

    try {
      await updateProject({
        id: projectId,
        name: data.name,
        company: data.company || undefined,
        description: data.description || undefined,
        status: data.status,
        expectedRevenueGBP: data.expectedRevenueGBP,
        startDate: data.startDate ? data.startDate.getTime() : undefined,
        endDate: data.endDate ? data.endDate.getTime() : undefined,
        userId: user.id,
      })
      
      toast.success("Project updated successfully")
      setEditDialogOpen(false)
    } catch (error) {
      toast.error("Failed to update project")
    }
  }

  const handleDeleteProject = async () => {
    if (!user) return

    try {
      await deleteProject({
        id: projectId,
        userId: user.id,
      })
      
      toast.success("Project deleted successfully")
      router.push("/projects")
    } catch (error) {
      toast.error("Failed to delete project")
    }
  }

  const handleStatusChange = async () => {
    if (!user || !project) return

    const newStatus = project.status === "open" ? "closed" : "open"
    
    try {
      await updateProject({
        id: projectId,
        status: newStatus,
        userId: user.id,
      })
      
      toast.success(`Project ${newStatus === "closed" ? "closed" : "reopened"} successfully`)
      setStatusDialogOpen(false)
    } catch (error) {
      toast.error("Failed to update project status")
    }
  }

  const handleCreateTask = async () => {
    if (!user || !newTaskTitle.trim()) return

    try {
      await createTask({
        title: newTaskTitle,
        status: "todo",
        projectId,
        userId: user.id,
      })
      
      toast.success("Task created successfully")
      setNewTaskTitle("")
      setCreateTaskDialogOpen(false)
    } catch (error) {
      toast.error("Failed to create task")
    }
  }

  const handleTaskStatusUpdate = async (taskId: Id<"tasks">, newStatus: "todo" | "in_progress" | "done") => {
    if (!user) return

    try {
      await updateTaskStatus({
        id: taskId,
        status: newStatus,
        userId: user.id,
      })
      toast.success("Task status updated")
    } catch (error) {
      toast.error("Failed to update task status")
    }
  }

  const handleLinkContact = async () => {
    if (!user || !selectedContactId) return

    try {
      await addContactToProject({
        projectId,
        contactId: selectedContactId,
        role: contactRole || undefined,
        notes: contactNotes || undefined,
        userId: user.id,
      })
      
      // If project doesn't have a company and the linked contact does, suggest updating
      const linkedContact = availableContacts?.find(c => c._id === selectedContactId)
      if (linkedContact?.company && project && !project.company) {
        toast.success("Contact linked successfully. Consider updating the project company to match the contact's company.", {
          duration: 5000,
        })
      } else {
        toast.success("Contact linked to project successfully")
      }
      
      setLinkContactDialogOpen(false)
      setSelectedContactId(null)
      setContactRole("")
      setContactNotes("")
      setContactSearch("")
    } catch (error) {
      toast.error("Failed to link contact")
    }
  }

  const handleRemoveContact = async (associationId: Id<"projectContacts">) => {
    if (!user) return

    try {
      await removeContactFromProject({
        associationId,
        userId: user.id,
      })
      
      toast.success("Contact removed from project")
    } catch (error) {
      toast.error("Failed to remove contact")
    }
  }

  const handleCreatePayment = async () => {
    if (!user || !paymentAmount) return

    try {
      await createPayment({
        projectId,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
        isVATInclusive: paymentVATInclusive,
        userId: user.id,
      })
      
      toast.success("Payment recorded successfully")
      setPaymentDialogOpen(false)
      setPaymentAmount("")
      setPaymentMethod("bank_transfer")
      setPaymentReference("")
      setPaymentNotes("")
      setPaymentVATInclusive(false)
    } catch (error) {
      toast.error("Failed to record payment")
    }
  }

  const handleDuplicateProject = async () => {
    if (!user || !duplicateName.trim()) return

    try {
      const newProjectId = await duplicateProject({
        id: projectId,
        name: duplicateName,
        includeTasks: duplicateIncludeTasks,
        includeContacts: duplicateIncludeContacts,
        includePayments: duplicateIncludePayments,
        userId: user.id,
      })
      
      toast.success("Project duplicated successfully")
      setDuplicateDialogOpen(false)
      // Navigate to the new project
      router.push(`/projects/${newProjectId}`)
    } catch (error) {
      toast.error("Failed to duplicate project")
    }
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const taskStats = {
    total: project.tasks?.length || 0,
    todo: project.tasks?.filter(t => t.status === "todo").length || 0,
    inProgress: project.tasks?.filter(t => t.status === "in_progress").length || 0,
    done: project.tasks?.filter(t => t.status === "done").length || 0,
  }

  const completionRate = taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
        <span>/</span>
        <span>{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {project.name}
              {project.company && (
                <span className="text-muted-foreground text-xl ml-2">
                  - {project.company}
                </span>
              )}
            </h1>
            <div className="flex items-center gap-2">
              <Badge
                variant={project.status === "open" ? "default" : "success"}
                className="text-base"
              >
                {project.status}
              </Badge>
              {project.isArchived && (
                <Badge variant="secondary" className="text-base">
                  <Archive className="mr-1 h-3 w-3" />
                  Archived
                </Badge>
              )}
            </div>
          </div>
          {project.description && (
            <p className="mt-2 text-muted-foreground max-w-2xl">{project.description}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEditProject}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusDialogOpen(true)}>
                  {project.status === "open" ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Close Project
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Reopen Project
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  if (!user) return
                  try {
                    if (project.isArchived) {
                      await unarchiveProject({
                        id: projectId,
                        userId: user.id,
                      })
                      toast.success("Project unarchived successfully")
                    } else {
                      await archiveProject({
                        id: projectId,
                        userId: user.id,
                      })
                      toast.success("Project archived successfully")
                    }
                  } catch (error) {
                    toast.error(`Failed to ${project.isArchived ? 'unarchive' : 'archive'} project`)
                  }
                }}>
                  <Archive className="mr-2 h-4 w-4" />
                  {project.isArchived ? 'Unarchive' : 'Archive'} Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setDuplicateName(`${project.name} (Copy)`)
                  setDuplicateDialogOpen(true)
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard
          title="Expected Revenue"
          value={formatCurrency(project.expectedRevenueGBP)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Amount Paid (Gross)"
          value={formatCurrency(vatSummary?.totalGross || totalPaid || 0)}
          description={`${(((vatSummary?.totalGross || totalPaid || 0) / project.expectedRevenueGBP * 100).toFixed(0))}% paid`}
          icon={<PoundSterling className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Net Amount"
          value={formatCurrency(vatSummary?.totalNet || 0)}
          description={`£${(vatSummary?.totalVAT || 0).toFixed(2)} VAT`}
          icon={<CreditCard className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Amount Due"
          value={formatCurrency(project.expectedRevenueGBP - (vatSummary?.totalGross || totalPaid || 0))}
          icon={<CreditCard className="h-5 w-5" />}
          color={project.expectedRevenueGBP - (vatSummary?.totalGross || totalPaid || 0) > 0 ? "red" : "green"}
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate.toFixed(0)}%`}
          description={`${taskStats.done} of ${taskStats.total} tasks`}
          icon={<CheckSquare className="h-5 w-5" />}
          color="blue"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created By</p>
                    <p className="text-sm">{project.creatorName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                    <p className="text-sm">{formatDate(project.createdAt)}</p>
                  </div>
                  {project.startDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p className="text-sm">{formatDate(project.startDate)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{formatDateTime(project.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={project.status === "open" ? "default" : "success"}>
                      {project.status}
                    </Badge>
                  </div>
                  {project.endDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">End Date</p>
                      <p className="text-sm">{formatDate(project.endDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <ProjectRevenueChart 
            projectId={projectId} 
            expectedRevenue={project.expectedRevenueGBP} 
          />
        </TabsContent>

        <TabsContent value="timeline">
          <ProjectTimeline 
            projectId={projectId}
            startDate={project.startDate}
            endDate={project.endDate}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Tasks</h3>
            {isAdmin && (
              <Button onClick={() => setCreateTaskDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            )}
          </div>

          {project.tasks && project.tasks.length > 0 ? (
            <div className="space-y-3">
              {project.tasks.map((task) => (
                <Card key={task._id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {task.assigneeName && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {getInitials(task.assigneeName)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{task.assigneeName}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Select
                      value={task.status}
                      onValueChange={(value: "todo" | "in_progress" | "done") => 
                        handleTaskStatusUpdate(task._id, value)
                      }
                      disabled={!isAdmin}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckSquare className="h-12 w-12" />}
              title="No tasks yet"
              description="Create your first task to track work on this project"
              action={
                isAdmin
                  ? {
                      label: "Add Task",
                      onClick: () => setCreateTaskDialogOpen(true),
                    }
                  : undefined
              }
            />
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Expenses</h3>
            {isAdmin && (
              <Button onClick={() => router.push(`/expenses?project=${projectId}`)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            )}
          </div>

          {projectFinancials ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Expected Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(projectFinancials.expectedRevenue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(projectFinancials.expenses.total)}</div>
                    <p className="text-xs text-muted-foreground">
                      {projectFinancials.expenseCount} expense{projectFinancials.expenseCount !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-2xl font-bold",
                      projectFinancials.netProfit >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(projectFinancials.netProfit)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {projectFinancials.profitMargin}% margin
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{formatCurrency(projectFinancials.expenses.pending)}</div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting approval
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm">Paid Expenses</span>
                      <span className="font-medium">{formatCurrency(projectFinancials.expenses.paid)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm">Approved (Unpaid)</span>
                      <span className="font-medium">{formatCurrency(projectFinancials.expenses.approved)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm">Pending Approval</span>
                      <span className="font-medium">{formatCurrency(projectFinancials.expenses.pending)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm">Rejected</span>
                      <span className="font-medium text-muted-foreground">{formatCurrency(projectFinancials.expenses.rejected)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold">
                      <span>Total Expenses</span>
                      <span>{formatCurrency(projectFinancials.expenses.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ExpenseList projectId={projectId as Id<"projects">} hideProjectColumn />
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Payment History</h3>
            {isAdmin && (
              <Button onClick={() => setPaymentDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            )}
          </div>

          {payments ? (
            payments.length > 0 ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-4 font-medium">Date</th>
                          <th className="text-left p-4 font-medium">Amount</th>
                          <th className="text-left p-4 font-medium">Net</th>
                          <th className="text-left p-4 font-medium">VAT</th>
                          <th className="text-left p-4 font-medium">Gross</th>
                          <th className="text-left p-4 font-medium">Method</th>
                          <th className="text-left p-4 font-medium">Reference</th>
                          <th className="text-left p-4 font-medium">Recorded By</th>
                          <th className="text-left p-4 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment: any) => (
                          <tr key={payment.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">{formatDate(payment.date || payment.createdAt)}</td>
                            <td className="p-4 font-medium">
                              {formatCurrency(payment.amount)}
                              {payment.isVATInclusive && (
                                <span className="text-xs text-muted-foreground ml-1">(inc VAT)</span>
                              )}
                            </td>
                            <td className="p-4">{formatCurrency(payment.netAmount || 0)}</td>
                            <td className="p-4">{formatCurrency(payment.vatAmount || 0)}</td>
                            <td className="p-4 font-medium">{formatCurrency(payment.grossAmount || payment.amount)}</td>
                            <td className="p-4">
                              <Badge variant="outline">
                                {payment.method?.replace('_', ' ').toUpperCase() || 'N/A'}
                              </Badge>
                            </td>
                            <td className="p-4">{payment.reference || '-'}</td>
                            <td className="p-4">{payment.createdByName}</td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {payment.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/50">
                          <td className="p-4 font-semibold">Totals</td>
                          <td className="p-4 font-bold text-lg">
                            {formatCurrency(totalPaid || 0)}
                          </td>
                          <td className="p-4 font-bold">
                            {formatCurrency(vatSummary?.totalNet || 0)}
                          </td>
                          <td className="p-4 font-bold">
                            {formatCurrency(vatSummary?.totalVAT || 0)}
                          </td>
                          <td className="p-4 font-bold text-lg">
                            {formatCurrency(vatSummary?.totalGross || totalPaid || 0)}
                          </td>
                          <td colSpan={4} className="p-4 text-right text-muted-foreground">
                            {vatSummary?.totalGross && project.expectedRevenueGBP > 0 && (
                              <span>
                                {((vatSummary.totalGross / project.expectedRevenueGBP) * 100).toFixed(1)}% of expected revenue
                              </span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <EmptyState
                icon={<CreditCard className="h-12 w-12" />}
                title="No payments recorded"
                description="Record payments as they are received to track project revenue"
                action={
                  isAdmin
                    ? {
                        label: "Record Payment",
                        onClick: () => setPaymentDialogOpen(true),
                      }
                    : undefined
                }
              />
            )
          ) : (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Invoices</h3>
            {isAdmin && (
              <Button onClick={() => window.location.href = `/invoices?project=${projectId}`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            )}
          </div>

          {projectInvoices ? (
            projectInvoices.length > 0 ? (
              <div className="space-y-4">
                {projectInvoices.map((invoice) => (
                  <Card key={invoice._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.clientInfo.name} • {formatDate(invoice.issueDate)}
                            </p>
                          </div>
                          <Badge variant={invoice.status === "paid" ? "success" : 
                                         invoice.status === "overdue" ? "destructive" : "default"}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(invoice.totalAmount)}</p>
                          <p className="text-sm text-muted-foreground">
                            Net: {formatCurrency(invoice.subtotal)} • VAT: {formatCurrency(invoice.totalVAT)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No invoices created"
                description="Create invoices for this project to track billing"
                action={
                  isAdmin
                    ? {
                        label: "Create Invoice",
                        onClick: () => window.location.href = `/invoices?project=${projectId}`,
                      }
                    : undefined
                }
              />
            )
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Associated Contacts</h3>
            {isAdmin && (
              <Button variant="outline" onClick={() => setLinkContactDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Link Contact
              </Button>
            )}
          </div>

          {projectContacts ? (
            projectContacts.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {projectContacts.filter((c): c is NonNullable<typeof c> => c !== null).map((contact) => (
                  <Card key={contact._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-muted-foreground">{contact.email}</p>
                            </div>
                          </div>
                          {contact.role && (
                            <Badge variant="outline" className="mt-2">
                              {contact.role}
                            </Badge>
                          )}
                          <div className="mt-2 text-sm text-muted-foreground space-y-1">
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {contact.company && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span>{contact.company}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/contacts/${contact._id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Contact
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleRemoveContact(contact.associationId)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove from Project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No contacts linked"
                description="Link contacts to this project to track stakeholders"
                action={
                  isAdmin
                    ? {
                        label: "Link Contact",
                        onClick: () => setLinkContactDialogOpen(true),
                      }
                    : undefined
                }
              />
            )
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <h3 className="text-lg font-semibold">Activity Timeline</h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-primary/10 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="w-px h-full bg-border" />
              </div>
              <div className="flex-1 pb-8">
                <p className="font-medium text-sm">Project created</p>
                <p className="text-xs text-muted-foreground">
                  by {project.creatorName} • {formatDateTime(project.createdAt)}
                </p>
              </div>
            </div>
            
            {project.updatedAt !== project.createdAt && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Edit className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Project updated</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(project.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and information
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateProject)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    {projectContacts && projectContacts.length > 0 && (
                      <FormDescription>
                        Associated contacts: {projectContacts.filter(c => c !== null).map(c => c.company ? `${c.name} (${c.company})` : c.name).join(", ")}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedRevenueGBP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Revenue (£)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Update Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation */}
      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title={project.status === "open" ? "Close Project" : "Reopen Project"}
        description={
          project.status === "open"
            ? "Are you sure you want to close this project? You can reopen it later if needed."
            : "Are you sure you want to reopen this project?"
        }
        confirmText={project.status === "open" ? "Close Project" : "Reopen Project"}
        onConfirm={handleStatusChange}
        variant={project.status === "open" ? "warning" : "info"}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will also delete all associated tasks."
        confirmText="Delete Project"
        onConfirm={handleDeleteProject}
        variant="destructive"
      />

      {/* Create Task Dialog */}
      <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a new task to this project
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Contact Dialog */}
      <Dialog open={linkContactDialogOpen} onOpenChange={setLinkContactDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link Contact to Project</DialogTitle>
            <DialogDescription>
              Select a contact to associate with this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Contacts</Label>
              <SearchBar
                placeholder="Search by name, email, or company..."
                value={contactSearch}
                onChange={setContactSearch}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Select Contact</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                {availableContacts ? (
                  availableContacts.length > 0 ? (
                    availableContacts.map((contact) => (
                      <div
                        key={contact._id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted ${
                          selectedContactId === contact._id ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedContactId(contact._id)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {contact.email} {contact.company && `• ${contact.company}`}
                            </p>
                          </div>
                        </div>
                        {selectedContactId === contact._id && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No available contacts found
                    </p>
                  )
                ) : (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2 p-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedContactId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="contact-role">Role (Optional)</Label>
                  <Input
                    id="contact-role"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="e.g., Project Manager, Technical Lead"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-notes">Notes (Optional)</Label>
                  <Textarea
                    id="contact-notes"
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    placeholder="Additional notes about this contact's involvement"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkContact} disabled={!selectedContactId}>
              Link Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment received for this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>VAT Treatment</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="vat-inclusive"
                  checked={paymentVATInclusive}
                  onChange={(e) => setPaymentVATInclusive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="vat-inclusive" className="text-sm">
                  Amount includes VAT (20%)
                </Label>
              </div>
              {paymentAmount && (
                <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted/50 rounded">
                  <p className="font-medium">VAT Breakdown:</p>
                  {paymentVATInclusive ? (
                    <>
                      <p>Gross Amount: {formatCurrency(parseFloat(paymentAmount))}</p>
                      <p>Net Amount: {formatCurrency(parseFloat(paymentAmount) / 1.20)}</p>
                      <p>VAT (20%): {formatCurrency(parseFloat(paymentAmount) - (parseFloat(paymentAmount) / 1.20))}</p>
                    </>
                  ) : (
                    <>
                      <p>Net Amount: {formatCurrency(parseFloat(paymentAmount))}</p>
                      <p>VAT (20%): {formatCurrency(parseFloat(paymentAmount) * 0.20)}</p>
                      <p>Gross Amount: {formatCurrency(parseFloat(paymentAmount) * 1.20)}</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (optional)</Label>
              <Input
                id="reference"
                placeholder="Transaction reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this payment"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayment} disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Project Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Project</DialogTitle>
            <DialogDescription>
              Create a copy of this project with selected components
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Project Name</Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-3">
              <Label>Include in duplication:</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={duplicateIncludeTasks}
                    onChange={(e) => setDuplicateIncludeTasks(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Tasks ({project.tasks?.length || 0} items)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={duplicateIncludeContacts}
                    onChange={(e) => setDuplicateIncludeContacts(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Linked Contacts ({projectContacts?.length || 0} items)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={duplicateIncludePayments}
                    onChange={(e) => setDuplicateIncludePayments(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Payment Records ({payments?.length || 0} items)</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicateProject} disabled={!duplicateName.trim()}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}