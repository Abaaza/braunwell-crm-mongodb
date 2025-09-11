"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { projectSchema, type ProjectFormData } from "@/lib/validations"
import { CustomFieldsForm } from "@/components/custom-fields/custom-field-input"
import { PageHeader } from "@/components/shared/page-header"
import { SearchBar } from "@/components/shared/search-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuth } from "@/lib/auth"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { toast } from "sonner"
import { useCachedProjects, useCachedContacts, useCachedProjectTemplates, invalidateProjectQueries } from "@/hooks/use-cached-queries"
import { LazyBulkActions as BulkActions } from "@/components/lazy/lazy-page-components"
import { SelectAllCheckbox, type BulkAction } from "@/components/shared/bulk-actions"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { LazyFilterBar as FilterBar } from "@/components/lazy/lazy-page-components"
import { type FilterConfig } from "@/components/shared/filter-bar"
import {
  FolderOpen,
  Plus,
  MoreVertical,
  Calendar,
  Users,
  CheckSquare,
  TrendingUp,
  Edit,
  Trash2,
  Archive,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

type SortField = "name" | "createdAt" | "expectedRevenueGBP" | "status"
type SortOrder = "asc" | "desc"

export default function ProjectsPage() {
  const { user, isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"projectTemplates"> | "">("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<"open" | "closed">("closed")
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({})
  const [showArchived, setShowArchived] = useState(false)
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
  const [editCustomFieldValues, setEditCustomFieldValues] = useState<Record<string, string>>({})
  
  const createForm = useForm<ProjectFormData>({
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
  
  const editForm = useForm<ProjectFormData>({
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

  const projects = useQuery(api.projects.list, { search, status: statusFilter, includeArchived: showArchived })
  const contacts = useCachedContacts()
  const allProjects = useQuery(api.projects.list, { includeArchived: true }) // For filter counts
  const templates = useCachedProjectTemplates()
  const customFields = useQuery(api.customFields.getCustomFields, {
    entityType: "projects",
    activeOnly: true,
  })
  const createProject = useMutation(api.projects.create)
  const updateProject = useMutation(api.projects.update)
  const deleteProject = useMutation(api.projects.remove)
  const deleteMultipleProjects = useMutation(api.projects.removeMultiple)
  const updateMultipleStatus = useMutation(api.projects.updateMultipleStatus)
  const createProjectFromTemplate = useMutation(api.projectTemplates.createProjectFromTemplate)
  const archiveProject = useMutation(api.projects.archive)
  const unarchiveProject = useMutation(api.projects.unarchive)

  // Apply filters
  let filteredProjects = projects || []
  
  // Filter by company
  if (filterValues.company?.length > 0) {
    filteredProjects = filteredProjects.filter(p => 
      p.company && filterValues.company.includes(p.company)
    )
  }
  
  // Filter by revenue range
  if (filterValues.revenue?.length > 0) {
    filteredProjects = filteredProjects.filter(p => {
      return filterValues.revenue.some(range => {
        if (range === 'low') return p.expectedRevenueGBP < 10000
        if (range === 'medium') return p.expectedRevenueGBP >= 10000 && p.expectedRevenueGBP < 50000
        if (range === 'high') return p.expectedRevenueGBP >= 50000
        return false
      })
    })
  }
  
  // Filter by date range
  if (filterValues.dateRange?.length > 0) {
    const now = Date.now()
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000
    const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000
    
    filteredProjects = filteredProjects.filter(p => {
      return filterValues.dateRange.some(range => {
        if (range === 'last30days') return p.createdAt >= oneMonthAgo
        if (range === 'last3months') return p.createdAt >= threeMonthsAgo
        if (range === 'last6months') return p.createdAt >= sixMonthsAgo
        if (range === 'older') return p.createdAt < sixMonthsAgo
        return false
      })
    })
  }

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]
    
    // Handle string comparison
    if (sortField === "name" || sortField === "status") {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortOrder === "asc" 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  const handleCreateProject = async (data: ProjectFormData) => {
    if (!user) return

    try {
      // Prepare custom field values
      const customFieldsData = Object.entries(customFieldValues)
        .filter(([_, value]) => value.trim() !== "")
        .map(([fieldId, value]) => ({
          fieldId: fieldId as any,
          value,
        }))

      await createProject({
        name: data.name,
        company: data.company || undefined,
        description: data.description || undefined,
        status: data.status,
        expectedRevenueGBP: data.expectedRevenueGBP,
        startDate: data.startDate ? data.startDate.getTime() : undefined,
        endDate: data.endDate ? data.endDate.getTime() : undefined,
        userId: user.id,
        customFields: customFieldsData.length > 0 ? customFieldsData : undefined,
      })
      
      toast.success("Project created successfully")
      
      // TODO: Associate contacts when projectContacts API is available
      if (selectedContacts.length > 0) {
        toast.info(`${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''} will be associated once the feature is enabled`)
      }
      
      setCreateDialogOpen(false)
      createForm.reset()
      setSelectedContacts([])
      setCustomFieldValues({})
    } catch (error) {
      toast.error("Failed to create project")
    }
  }

  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!user || !selectedProject) return

    try {
      // Prepare custom field values
      const customFieldsData = Object.entries(editCustomFieldValues)
        .filter(([_, value]) => value.trim() !== "")
        .map(([fieldId, value]) => ({
          fieldId: fieldId as any,
          value,
        }))

      await updateProject({
        id: selectedProject._id,
        name: data.name,
        company: data.company || undefined,
        description: data.description || undefined,
        status: data.status,
        expectedRevenueGBP: data.expectedRevenueGBP,
        startDate: data.startDate ? data.startDate.getTime() : undefined,
        endDate: data.endDate ? data.endDate.getTime() : undefined,
        userId: user.id,
        customFields: customFieldsData.length > 0 ? customFieldsData : undefined,
      })
      
      toast.success("Project updated successfully")
      setEditDialogOpen(false)
      editForm.reset()
      setEditCustomFieldValues({})
    } catch (error) {
      toast.error("Failed to update project")
    }
  }

  const handleDeleteProject = async () => {
    if (!user || !selectedProject) return

    try {
      await deleteProject({
        id: selectedProject._id,
        userId: user.id,
      })
      
      toast.success("Project deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedProject(null)
    } catch (error) {
      toast.error("Failed to delete project")
    }
  }

  const handleCreateFromTemplate = async (data: ProjectFormData) => {
    if (!user || !selectedTemplateId) return

    try {
      await createProjectFromTemplate({
        templateId: selectedTemplateId,
        name: data.name,
        company: data.company || undefined,
        description: data.description || undefined,
        startDate: data.startDate ? data.startDate.getTime() : undefined,
        userId: user.id,
      })
      
      toast.success("Project created from template successfully")
      setTemplateDialogOpen(false)
      createForm.reset()
      setSelectedTemplateId("")
    } catch (error) {
      toast.error("Failed to create project from template")
    }
  }

  const resetForm = () => {
    createForm.reset()
    editForm.reset()
    setSelectedProject(null)
  }

  const openEditDialog = (project: any) => {
    setSelectedProject(project)
    editForm.reset({
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

  const openDeleteDialog = (project: any) => {
    setSelectedProject(project)
    setDeleteDialogOpen(true)
  }

  // Bulk actions handlers
  const handleBulkDelete = async () => {
    if (!user || selectedProjects.size === 0) return

    try {
      await deleteMultipleProjects({
        ids: Array.from(selectedProjects) as any[],
        userId: user.id,
      })
      toast.success(`Deleted ${selectedProjects.size} projects`)
      setSelectedProjects(new Set())
      setBulkDeleteOpen(false)
    } catch (error) {
      toast.error("Failed to delete projects")
    }
  }

  const handleBulkStatusChange = async () => {
    if (!user || selectedProjects.size === 0) return

    try {
      await updateMultipleStatus({
        ids: Array.from(selectedProjects) as any[],
        status: bulkStatus,
        userId: user.id,
      })
      toast.success(`Updated ${selectedProjects.size} projects to ${bulkStatus}`)
      setSelectedProjects(new Set())
      setBulkStatusOpen(false)
    } catch (error) {
      toast.error("Failed to update projects")
    }
  }

  const toggleProjectSelection = (projectId: string) => {
    const newSelection = new Set(selectedProjects)
    if (newSelection.has(projectId)) {
      newSelection.delete(projectId)
    } else {
      newSelection.add(projectId)
    }
    setSelectedProjects(newSelection)
  }

  const toggleAllProjects = () => {
    if (selectedProjects.size === sortedProjects.length) {
      setSelectedProjects(new Set())
    } else {
      setSelectedProjects(new Set(sortedProjects.map(p => p._id)))
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

  // Generate filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: "company",
      label: "Company",
      options: (() => {
        const companies = new Map<string, number>()
        allProjects?.forEach(p => {
          if (p.company) {
            companies.set(p.company, (companies.get(p.company) || 0) + 1)
          }
        })
        return Array.from(companies.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([company, count]) => ({
            value: company,
            label: company,
            count
          }))
      })()
    },
    {
      key: "revenue",
      label: "Revenue Range",
      options: [
        { 
          value: "low", 
          label: "Under £10k",
          count: allProjects?.filter(p => p.expectedRevenueGBP < 10000).length || 0
        },
        { 
          value: "medium", 
          label: "£10k - £50k",
          count: allProjects?.filter(p => p.expectedRevenueGBP >= 10000 && p.expectedRevenueGBP < 50000).length || 0
        },
        { 
          value: "high", 
          label: "Over £50k",
          count: allProjects?.filter(p => p.expectedRevenueGBP >= 50000).length || 0
        },
      ]
    },
    {
      key: "dateRange",
      label: "Created Date",
      options: [
        { 
          value: "last30days", 
          label: "Last 30 days",
          count: allProjects?.filter(p => p.createdAt >= Date.now() - 30 * 24 * 60 * 60 * 1000).length || 0
        },
        { 
          value: "last3months", 
          label: "Last 3 months",
          count: allProjects?.filter(p => p.createdAt >= Date.now() - 90 * 24 * 60 * 60 * 1000).length || 0
        },
        { 
          value: "last6months", 
          label: "Last 6 months",
          count: allProjects?.filter(p => p.createdAt >= Date.now() - 180 * 24 * 60 * 60 * 1000).length || 0
        },
        { 
          value: "older", 
          label: "Older than 6 months",
          count: allProjects?.filter(p => p.createdAt < Date.now() - 180 * 24 * 60 * 60 * 1000).length || 0
        },
      ]
    },
  ]

  const handleFilterChange = (key: string, values: string[]) => {
    setFilterValues(prev => ({ ...prev, [key]: values }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your projects and track revenue"
      >
        {isAdmin && (
          <div className="flex gap-2">
            {templates && templates.length > 0 && (
              <Link href="/projects/templates">
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Templates
                </Button>
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Blank Project
                </DropdownMenuItem>
                {templates && templates.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-sm font-semibold">From Template</div>
                    {templates.map((template) => (
                      <DropdownMenuItem
                        key={template._id}
                        onClick={() => {
                          setSelectedTemplateId(template._id)
                          setTemplateDialogOpen(true)
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </PageHeader>

      {/* Advanced Filters */}
      {allProjects && allProjects.length > 0 && (
        <FilterBar
          filters={filterConfigs}
          values={filterValues}
          onChange={handleFilterChange}
        />
      )}

      {/* Filters and Sort */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            placeholder="Search projects..."
            value={search}
            onChange={setSearch}
            className="max-w-sm"
          />
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300 transition-all duration-200 hover:border-primary focus:ring-primary"
              />
              <span>Show archived</span>
            </label>
          </div>
        </div>
        
        {/* Sort buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("name")}
            className={cn(
              "h-8",
              sortField === "name" && "text-foreground"
            )}
          >
            Name {getSortIcon("name")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("createdAt")}
            className={cn(
              "h-8",
              sortField === "createdAt" && "text-foreground"
            )}
          >
            Date {getSortIcon("createdAt")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("expectedRevenueGBP")}
            className={cn(
              "h-8",
              sortField === "expectedRevenueGBP" && "text-foreground"
            )}
          >
            Revenue {getSortIcon("expectedRevenueGBP")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("status")}
            className={cn(
              "h-8",
              sortField === "status" && "text-foreground"
            )}
          >
            Status {getSortIcon("status")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Projects</h3>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortedProjects ? sortedProjects.length : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Open Projects</h3>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortedProjects ? sortedProjects.filter(p => p.status === "open").length : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Revenue</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortedProjects ? formatCurrency(sortedProjects.reduce((sum, p) => sum + p.expectedRevenueGBP, 0)) : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Avg. Project Value</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortedProjects && sortedProjects.length > 0
                ? formatCurrency(sortedProjects.reduce((sum, p) => sum + p.expectedRevenueGBP, 0) / sortedProjects.length)
                : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Select All Checkbox for Admin */}
      {isAdmin && sortedProjects && sortedProjects.length > 0 && (
        <div className="flex items-center gap-2">
          <SelectAllCheckbox
            checked={selectedProjects.size === sortedProjects.length}
            indeterminate={selectedProjects.size > 0 && selectedProjects.size < sortedProjects.length}
            onCheckedChange={toggleAllProjects}
          />
          <span className="text-sm text-muted-foreground">
            {selectedProjects.size > 0 ? `${selectedProjects.size} selected` : "Select all"}
          </span>
        </div>
      )}

      {/* Projects Grid */}
      {projects ? (
        sortedProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedProjects.map((project) => (
              <div key={project._id} className="relative">
                {isAdmin && (
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 transition-all duration-200 hover:border-primary focus:ring-primary"
                      checked={selectedProjects.has(project._id)}
                      onChange={() => toggleProjectSelection(project._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                <Link href={`/projects/${project._id}`} className="block">
                  <Card
                    className={cn(
                      "transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer",
                      project.status === "open"
                        ? "border-l-4 border-l-primary"
                        : "border-l-4 border-l-accent",
                      selectedProjects.has(project._id) && "ring-2 ring-primary"
                    )}
                  >
                    <CardHeader className={cn("pb-3", isAdmin && "pl-12")}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">
                          {project.name}
                          {project.company && (
                            <span className="text-muted-foreground text-sm ml-2">
                              - {project.company}
                            </span>
                          )}
                        </h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={project.status === "open" ? "default" : "success"}
                        >
                          {project.status}
                        </Badge>
                        {project.isArchived && (
                          <Badge variant="secondary">
                            <Archive className="mr-1 h-3 w-3" />
                            Archived
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(project)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!user) return
                              try {
                                if (project.isArchived) {
                                  await unarchiveProject({
                                    id: project._id,
                                    userId: user.id,
                                  })
                                  toast.success("Project unarchived successfully")
                                } else {
                                  await archiveProject({
                                    id: project._id,
                                    userId: user.id,
                                  })
                                  toast.success("Project archived successfully")
                                }
                              } catch (error) {
                                toast.error(`Failed to ${project.isArchived ? 'unarchive' : 'archive'} project`)
                              }
                            }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            {project.isArchived ? 'Unarchive' : 'Archive'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDeleteDialog(project)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Revenue
                      </span>
                      <span className="font-medium">
                        {formatCurrency(project.expectedRevenueGBP)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        Contacts
                      </span>
                      <span className="font-medium">{project.contactCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <CheckSquare className="mr-1 h-3 w-3" />
                        Tasks
                      </span>
                      <span className="font-medium">{project.taskCount}</span>
                    </div>
                    {project.startDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Start Date
                        </span>
                        <span className="font-medium">
                          {formatDate(project.startDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    Last updated {formatDate(project.updatedAt)}
                  </div>
                </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FolderOpen className="h-12 w-12" />}
            title="No projects found"
            description={
              search || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first project to get started"
            }
            action={
              isAdmin && !search && statusFilter === "all"
                ? {
                    label: "Create Project",
                    onClick: () => setCreateDialogOpen(true),
                  }
                : undefined
            }
          />
        )
      ) : (
        // Loading skeletons
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-l-4">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-20 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to track revenue and tasks
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateProject)} className="space-y-4">
              <FormField
                control={createForm.control}
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
                control={createForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={selectedContacts.length > 0 ? "Auto-populated from contacts (editable)" : "Enter company name"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {selectedContacts.length > 0 && field.value ? 
                        "Auto-populated from selected contacts. You can edit if needed." : 
                        "Will be auto-populated when you select contacts with a company."
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
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
                  control={createForm.control}
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
                  control={createForm.control}
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
                  control={createForm.control}
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
                  control={createForm.control}
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
              
              {/* Contact Selection */}
              <div className="space-y-2">
                <Label>Associated Contacts (Optional)</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Select contacts to associate with this project
                </div>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {contacts ? (
                    contacts.length > 0 ? (
                      contacts.map((contact) => (
                        <label
                          key={contact._id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 transition-all duration-200 hover:border-primary focus:ring-primary"
                            checked={selectedContacts.includes(contact._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedContacts([...selectedContacts, contact._id])
                                // Auto-populate company if contact has one and field is empty
                                if (contact.company && !createForm.getValues("company")) {
                                  createForm.setValue("company", contact.company)
                                }
                              } else {
                                setSelectedContacts(selectedContacts.filter(id => id !== contact._id))
                                // Clear company if it matches this contact's company and no other selected contacts have the same company
                                if (contact.company === createForm.getValues("company")) {
                                  const remainingContacts = contacts.filter(c => 
                                    selectedContacts.includes(c._id) && c._id !== contact._id
                                  )
                                  const hasOtherContactWithSameCompany = remainingContacts.some(c => c.company === contact.company)
                                  if (!hasOtherContactWithSameCompany) {
                                    createForm.setValue("company", "")
                                  }
                                }
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {contact.email} {contact.company && `• ${contact.company}`}
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No contacts available
                      </p>
                    )
                  ) : (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  )}
                </div>
                {selectedContacts.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setCreateDialogOpen(false)
                  setSelectedContacts([])
                }}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={createForm.formState.isSubmitting}>
                  Create Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateProject)} className="space-y-4">
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                  Update Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProject?.name}"? This action
              cannot be undone and will also delete all associated tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Selected Projects"
        description={`Are you sure you want to delete ${selectedProjects.size} project${selectedProjects.size !== 1 ? 's' : ''}? This action cannot be undone and will also delete all associated tasks.`}
        confirmText="Delete Projects"
        onConfirm={handleBulkDelete}
        variant="destructive"
      />

      {/* Bulk Status Change Dialog */}
      <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Project Status</DialogTitle>
            <DialogDescription>
              Change the status of {selectedProjects.size} selected project{selectedProjects.size !== 1 ? 's' : ''}
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
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

      {/* Create from Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Project from Template</DialogTitle>
            <DialogDescription>
              {selectedTemplateId && templates?.find(t => t._id === selectedTemplateId)?.description || "Create a new project based on this template"}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateFromTemplate)} className="space-y-4">
              <FormField
                control={createForm.control}
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
                control={createForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter company name" 
                        {...field} 
                        defaultValue={templates?.find(t => t._id === selectedTemplateId)?.company || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
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
              <FormField
                control={createForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ? field.value.toISOString().split('T')[0] : ''} />
                    </FormControl>
                    <FormDescription>
                      Tasks will be scheduled based on this date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedTemplateId && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm">Template Details</h4>
                  {(() => {
                    const template = templates?.find(t => t._id === selectedTemplateId)
                    if (!template) return null
                    return (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Expected Revenue: {formatCurrency(template.expectedRevenueGBP)}</p>
                        {template.durationDays && <p>Duration: {template.durationDays} days</p>}
                        <p>Tasks: {template.tasks.length} tasks will be created</p>
                      </div>
                    )
                  })()}
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setTemplateDialogOpen(false)
                  setSelectedTemplateId("")
                  createForm.reset()
                }}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={createForm.formState.isSubmitting}>
                  Create Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Toolbar */}
      <BulkActions
        selectedCount={selectedProjects.size}
        onClearSelection={() => setSelectedProjects(new Set())}
        actions={bulkActions}
      />
    </div>
  )
}