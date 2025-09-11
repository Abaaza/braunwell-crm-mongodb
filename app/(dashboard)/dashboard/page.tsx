"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { projectSchema, contactSchema, type ProjectFormData, type ContactFormData } from "@/lib/validations"
import { z } from "zod"

// Extended task schema for dashboard
const dashboardTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "none"]).default("none"),
  dueDate: z.date().optional(),
  projectId: z.string().min(1, "Project is required"),
  assignedToId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  recurringEndDate: z.date().optional(),
})

type TaskFormData = z.infer<typeof dashboardTaskSchema>

// Expense schema for dashboard
const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  vendor: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  date: z.date(),
  category: z.enum([
    "travel", "equipment", "software", "office",
    "marketing", "professional_services", "utilities",
    "insurance", "other"
  ]),
  projectId: z.string().optional(),
  paymentMethod: z.enum(["bank_transfer", "card", "cash", "cheque", "direct_debit"]).default("bank_transfer"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  vatRate: z.number().default(20),
  isVatIncluded: z.boolean().default(true),
  receiptUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(["monthly", "quarterly", "yearly"]).optional(),
  recurringEndDate: z.date().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuth } from "@/lib/auth"
import { formatCurrency, formatDateTime, getInitials } from "@/lib/utils"
import { toast } from "sonner"
import { 
  FolderOpen, 
  CheckSquare, 
  TrendingUp, 
  Users,
  Plus,
  Activity,
  Clock,
  FileText,
  Receipt,
  Calculator
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [createContactOpen, setCreateContactOpen] = useState(false)
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [vatIncluded, setVatIncluded] = useState(true)
  
  const stats = useQuery(api.dashboard.getStats)
  const recentActivity = useQuery(api.dashboard.getRecentActivity)
  const recentContacts = useQuery(api.dashboard.getRecentContacts)
  const projects = useQuery(api.projects.list, { includeArchived: false })
  const contacts = useQuery(api.contacts.list, { search: "" })
  
  // Mutations
  const createProject = useMutation(api.projects.create)
  const createTask = useMutation(api.tasks.create)
  const createContact = useMutation(api.contacts.create)
  const createExpense = useMutation(api.expenses.create)
  
  // Forms
  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      company: "",
      description: "",
      status: "open",
      expectedRevenueGBP: 0,
      startDate: undefined,
      endDate: undefined,
    },
  })
  
  const taskForm = useForm<TaskFormData>({
    resolver: zodResolver(dashboardTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "none",
      status: "todo",
      dueDate: undefined,
      projectId: "",
      assignedToId: "",
      isRecurring: false,
      recurringPattern: "",
      recurringEndDate: undefined,
    },
  })
  
  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    },
  })
  
  const expenseForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      vendor: "",
      amount: 0,
      date: new Date(),
      category: "other",
      projectId: "",
      paymentMethod: "bank_transfer",
      reference: "",
      notes: "",
      vatRate: 20,
      isVatIncluded: true,
      receiptUrl: "",
      tags: [],
      isRecurring: false,
      recurringPattern: undefined,
      recurringEndDate: undefined,
    },
  })
  
  // Handlers
  const handleCreateProject = async (data: ProjectFormData) => {
    if (!user) return
    
    try {
      await createProject({
        name: data.name,
        company: data.company || undefined,
        description: data.description || undefined,
        status: data.status,
        expectedRevenueGBP: data.expectedRevenueGBP,
        startDate: data.startDate ? data.startDate.getTime() : undefined,
        endDate: data.endDate ? data.endDate.getTime() : undefined,
        userId: user.id,
      })
      
      if (selectedContacts.length > 0) {
        toast.info(`${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''} will be associated once the feature is enabled`)
      }
      
      toast.success("Project created successfully")
      setCreateProjectOpen(false)
      projectForm.reset()
      setSelectedContacts([])
    } catch (error) {
      toast.error("Failed to create project")
    }
  }
  
  const handleCreateTask = async (data: TaskFormData) => {
    if (!user) return
    
    // Validate that a project is selected
    if (!data.projectId) {
      toast.error("Please select a project for this task")
      return
    }
    
    try {
      await createTask({
        title: data.title,
        description: data.description || undefined,
        priority: data.priority === "none" ? undefined : data.priority as "low" | "medium" | "high" | undefined,
        status: data.status,
        dueDate: data.dueDate ? data.dueDate.getTime() : undefined,
        projectId: data.projectId as Id<"projects">,
        assignedTo: data.assignedToId === "unassigned" ? undefined : data.assignedToId as Id<"users"> | undefined,
        userId: user.id,
        isRecurring: data.isRecurring,
        recurringPattern: data.isRecurring && data.recurringPattern ? data.recurringPattern as any : undefined,
        recurringEndDate: data.isRecurring && data.recurringEndDate ? data.recurringEndDate.getTime() : undefined,
      })
      
      toast.success("Task created successfully")
      setCreateTaskOpen(false)
      taskForm.reset()
    } catch (error) {
      toast.error("Failed to create task")
    }
  }
  
  const handleCreateContact = async (data: ContactFormData) => {
    if (!user) return
    
    try {
      await createContact({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company || undefined,
        notes: data.notes || undefined,
        userId: user.id,
      })
      
      if (selectedProjects.length > 0) {
        toast.info(`${selectedProjects.length} project${selectedProjects.length !== 1 ? 's' : ''} will be associated once the feature is enabled`)
      }
      
      toast.success("Contact created successfully")
      setCreateContactOpen(false)
      contactForm.reset()
      setSelectedProjects([])
    } catch (error) {
      toast.error("Failed to create contact")
    }
  }

  const handleCreateExpense = async (data: ExpenseFormData) => {
    if (!user) return
    
    try {
      await createExpense({
        description: data.description,
        amount: data.amount,
        date: data.date.getTime(),
        vendor: data.vendor || undefined,
        category: data.category,
        paymentMethod: data.paymentMethod || undefined,
        vatRate: data.vatRate || 0,
        isVATInclusive: data.isVatIncluded || false,
        receiptUrl: data.receiptUrl || undefined,
        notes: data.notes || undefined,
        isRecurring: data.isRecurring || false,
        recurringPattern: data.recurringPattern || undefined,
        recurringEndDate: data.recurringEndDate ? data.recurringEndDate.getTime() : undefined,
        userId: user.id,
      })
      
      toast.success("Expense created successfully")
      setCreateExpenseOpen(false)
      expenseForm.reset()
    } catch (error) {
      toast.error("Failed to create expense")
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl gradient-cool p-6 text-white shadow-xl animate-fade-in">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold mb-2 animate-fade-in-up">
            Welcome back, {user?.name}! ✨
          </h1>
          <p className="text-blue-100 text-sm animate-fade-in-up animation-delay-100">
            Here's what's happening with your business today.
          </p>
          {/* Removed View Reports and Quick Actions buttons */}
        </div>
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse-glow" />
        <div className="absolute left-0 bottom-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-purple-400/20 blur-3xl animate-float" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          <>
            <div className="animate-fade-in-up">
              <StatCard
                title="Total Projects"
                value={stats.totalProjects}
                description={`${stats.openProjects} currently open`}
                icon={<FolderOpen className="h-5 w-5" />}
                color="indigo"
                trend={{ value: 12, isPositive: true }}
                href="/projects"
              />
            </div>
            <div className="animate-fade-in-up animation-delay-100">
              <StatCard
                title="Active Tasks"
                value={stats.activeTasks}
                description="Tasks in progress"
                icon={<CheckSquare className="h-5 w-5" />}
                color="pink"
                trend={{ value: 5, isPositive: true }}
                href="/tasks"
              />
            </div>
            <div className="animate-fade-in-up animation-delay-200">
              <StatCard
                title="Expected Revenue"
                value={formatCurrency(stats.totalRevenue)}
                description="Total pipeline value"
                icon={<TrendingUp className="h-5 w-5" />}
                color="green"
                trend={{ value: 8, isPositive: true }}
                href="/analytics"
              />
            </div>
            <div className="animate-fade-in-up animation-delay-300">
              <StatCard
                title="Recent Contacts"
                value={stats.recentContactsCount}
                description="Added in last 7 days"
                icon={<Users className="h-5 w-5" />}
                color="purple"
                trend={{ value: 18, isPositive: true }}
                href="/contacts"
              />
            </div>
          </>
        ) : (
          <>
            <StatCard
              title="Total Projects"
              value=""
              icon={<FolderOpen className="h-5 w-5" />}
              color="indigo"
              loading
            />
            <StatCard
              title="Active Tasks"
              value=""
              icon={<CheckSquare className="h-5 w-5" />}
              color="pink"
              loading
            />
            <StatCard
              title="Expected Revenue"
              value=""
              icon={<TrendingUp className="h-5 w-5" />}
              color="green"
              loading
            />
            <StatCard
              title="Recent Contacts"
              value=""
              icon={<Users className="h-5 w-5" />}
              color="purple"
              loading
            />
          </>
        )}
      </div>

      {/* Quick Actions - Admin Only */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-in-up animation-delay-100">
            <Card 
              variant="glow" 
              interactive 
              className="group cursor-pointer"
              onClick={() => setCreateProjectOpen(true)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg gradient-primary p-3 transition-transform duration-300 group-hover:scale-110">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Create Project</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a new project
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <Card 
              variant="glow" 
              interactive 
              className="group cursor-pointer"
              onClick={() => setCreateTaskOpen(true)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg gradient-secondary p-3 transition-transform duration-300 group-hover:scale-110">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Create Task</h3>
                  <p className="text-sm text-muted-foreground">
                    Add a new task
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="animate-fade-in-up animation-delay-300">
            <Card 
              variant="glow" 
              interactive 
              className="group cursor-pointer"
              onClick={() => setCreateContactOpen(true)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg gradient-accent p-3 transition-transform duration-300 group-hover:scale-110">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Create Contact</h3>
                  <p className="text-sm text-muted-foreground">
                    Add a new contact
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="animate-fade-in-up animation-delay-400">
            <Card 
              variant="glow" 
              interactive 
              className="group cursor-pointer"
              onClick={() => setCreateExpenseOpen(true)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg gradient-warning p-3 transition-transform duration-300 group-hover:scale-110">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Create Expense</h3>
                  <p className="text-sm text-muted-foreground">
                    Record a new expense
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card variant="gradient" className="animate-fade-in-up animation-delay-400">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity ? (
                recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const href = activity.entityType === 'project' 
                      ? `/projects/${activity.entityId}`
                      : activity.entityType === 'contact'
                      ? `/contacts/${activity.entityId}`
                      : activity.entityType === 'task'
                      ? `/tasks`
                      : null;
                    
                    const activityContent = (
                      <div className="flex items-start gap-4 group">
                        <div className="rounded-full bg-primary/10 p-2 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold text-foreground">{activity.userName}</span>{" "}
                            <span className="text-muted-foreground">{activity.action}</span>{" "}
                            <span className="font-medium text-foreground">{activity.entityType}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDateTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );

                    return href ? (
                      <Link 
                        key={activity._id} 
                        href={href}
                        className="block rounded-lg p-2 -m-2 hover:bg-muted/50 transition-colors"
                      >
                        {activityContent}
                      </Link>
                    ) : (
                      <div key={activity._id}>
                        {activityContent}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )
              ) : (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Contacts */}
        <Card variant="gradient" className="animate-fade-in-up animation-delay-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">Recent Contacts</CardTitle>
            <div className="p-2 rounded-lg bg-secondary/10">
              <Users className="h-5 w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContacts ? (
                recentContacts.length > 0 ? (
                  recentContacts.map((contact) => (
                    <div key={contact._id} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {contact.email}
                        </p>
                      </div>
                      {contact.company && (
                        <Badge variant="outline">{contact.company}</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contacts yet
                  </p>
                )
              ) : (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Project Dialog */}
      <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
        <DialogContent className="max-w-2xl glass border-0">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to track revenue and tasks
            </DialogDescription>
          </DialogHeader>
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit(handleCreateProject)} className="space-y-4">
              <FormField
                control={projectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter project description"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={projectForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="glass">
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
                  control={projectForm.control}
                  name="expectedRevenueGBP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Revenue (£)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00 (Free projects allowed)"
                          min="0"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={projectForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={projectForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Contact Association */}
              {contacts && contacts.length > 0 && (
                <div className="space-y-2">
                  <Label>Associate Contacts</Label>
                  <ScrollArea className="h-32 w-full rounded-md border p-4">
                    <div className="space-y-2">
                      {contacts.map((contact) => (
                        <div key={contact._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`contact-${contact._id}`}
                            checked={selectedContacts.includes(contact._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedContacts([...selectedContacts, contact._id])
                                // Auto-populate company field if empty
                                if (contact.company && !projectForm.getValues('company')) {
                                  projectForm.setValue('company', contact.company)
                                }
                              } else {
                                setSelectedContacts(selectedContacts.filter(id => id !== contact._id))
                              }
                            }}
                          />
                          <label
                            htmlFor={`contact-${contact._id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {contact.name} {contact.company && `(${contact.company})`}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {selectedContacts.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setCreateProjectOpen(false)
                  projectForm.reset()
                }}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={projectForm.formState.isSubmitting}>
                  Create Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
        <DialogContent className="max-w-lg glass border-0">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to track work
            </DialogDescription>
          </DialogHeader>
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit(handleCreateTask)} className="space-y-4">
              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter task description"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={taskForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects?.filter(p => p.status === "open").map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={taskForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={taskForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={taskForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={taskForm.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {user && (
                          <SelectItem value={user.id}>
                            {user.name} (Me)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Recurring Task Settings */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="recurring"
                    checked={taskForm.watch('isRecurring') || false}
                    onCheckedChange={(checked) => 
                      taskForm.setValue('isRecurring', !!checked)
                    }
                  />
                  <label 
                    htmlFor="recurring" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Make this a recurring task
                  </label>
                </div>
                
                {taskForm.watch('isRecurring') && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={taskForm.control}
                      name="recurringPattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repeat</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="glass">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taskForm.control}
                      name="recurringEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ? field.value.toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                              min={taskForm.watch('dueDate') ? taskForm.watch('dueDate')?.toISOString().split('T')[0] : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setCreateTaskOpen(false)
                  taskForm.reset()
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="gradient" 
                  disabled={taskForm.formState.isSubmitting || !taskForm.watch('title') || !taskForm.watch('projectId')}
                >
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Contact Dialog */}
      <Dialog open={createContactOpen} onOpenChange={setCreateContactOpen}>
        <DialogContent className="max-w-md glass border-0">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Create a new contact in your CRM
            </DialogDescription>
          </DialogHeader>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(handleCreateContact)} className="space-y-4">
              <FormField
                control={contactForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (UK) *</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+44 20 7123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this contact"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Project Association */}
              {projects && projects.filter(p => p.status === "open").length > 0 && (
                <div className="space-y-2">
                  <Label>Associate with Projects</Label>
                  <ScrollArea className="h-32 w-full rounded-md border p-4">
                    <div className="space-y-2">
                      {projects.filter(p => p.status === "open").map((project) => (
                        <div key={project._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${project._id}`}
                            checked={selectedProjects.includes(project._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProjects([...selectedProjects, project._id])
                              } else {
                                setSelectedProjects(selectedProjects.filter(id => id !== project._id))
                              }
                            }}
                          />
                          <label
                            htmlFor={`project-${project._id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            <div>
                              <div>{project.name}</div>
                              {project.expectedRevenueGBP > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  £{project.expectedRevenueGBP.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {selectedProjects.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setCreateContactOpen(false)
                  contactForm.reset()
                  setSelectedProjects([])
                }}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={contactForm.formState.isSubmitting}>
                  Add Contact
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Create Expense Dialog */}
      <Dialog open={createExpenseOpen} onOpenChange={setCreateExpenseOpen}>
        <DialogContent className="max-w-2xl glass border-0">
          <DialogHeader>
            <DialogTitle>Create New Expense</DialogTitle>
            <DialogDescription>
              Record a business expense
            </DialogDescription>
          </DialogHeader>
          <Form {...expenseForm}>
            <form onSubmit={expenseForm.handleSubmit(handleCreateExpense)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={expenseForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Input placeholder="Office supplies, travel, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={expenseForm.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <FormControl>
                        <Input placeholder="Supplier name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={expenseForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (£) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={expenseForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={expenseForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="office">Office Supplies</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="professional_services">Professional Services</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={expenseForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {projects?.filter(p => p.status === "open").map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={expenseForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="direct_debit">Direct Debit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={expenseForm.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* VAT Calculation */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>VAT Calculation</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vat-included"
                      checked={vatIncluded}
                      onCheckedChange={(checked) => setVatIncluded(!!checked)}
                    />
                    <label
                      htmlFor="vat-included"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Amount includes VAT
                    </label>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={expenseForm.control}
                    name="vatRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 20)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label>Net Amount</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                      <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
                      £{(() => {
                        const amount = expenseForm.watch('amount') || 0
                        const vatRate = expenseForm.watch('vatRate') || 20
                        return vatIncluded 
                          ? (amount / (1 + vatRate / 100)).toFixed(2)
                          : amount.toFixed(2)
                      })()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>VAT Amount</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                      <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
                      £{(() => {
                        const amount = expenseForm.watch('amount') || 0
                        const vatRate = expenseForm.watch('vatRate') || 20
                        if (vatIncluded) {
                          const netAmount = amount / (1 + vatRate / 100)
                          return (amount - netAmount).toFixed(2)
                        } else {
                          return (amount * (vatRate / 100)).toFixed(2)
                        }
                      })()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Gross Amount</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm font-medium">
                      <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
                      £{(() => {
                        const amount = expenseForm.watch('amount') || 0
                        const vatRate = expenseForm.watch('vatRate') || 20
                        return vatIncluded 
                          ? amount.toFixed(2)
                          : (amount * (1 + vatRate / 100)).toFixed(2)
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              <FormField
                control={expenseForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this expense"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Recurring Settings */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring-expense"
                    checked={expenseForm.watch('isRecurring') || false}
                    onCheckedChange={(checked) =>
                      expenseForm.setValue('isRecurring', !!checked)
                    }
                  />
                  <label
                    htmlFor="recurring-expense"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    This is a recurring expense
                  </label>
                </div>
                
                {expenseForm.watch('isRecurring') && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={expenseForm.control}
                      name="recurringPattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recurring Pattern</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="glass">
                                <SelectValue placeholder="Select pattern" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="recurringEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ? field.value.toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                              min={expenseForm.watch('date') ? expenseForm.watch('date').toISOString().split('T')[0] : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setCreateExpenseOpen(false)
                  expenseForm.reset()
                  setVatIncluded(true)
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="gradient" 
                  disabled={expenseForm.formState.isSubmitting}
                >
                  Create Expense
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}