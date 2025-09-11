"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { formatDate } from "@/lib/utils"
import { Id } from "@/convex/_generated/dataModel"
import { 
  Plus,
  FileText,
  Eye,
  Edit3,
  Trash2,
  Copy,
  MoreVertical,
  Star,
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  DollarSign,
  FolderOpen,
  CheckSquare,
  Filter,
  Search
} from "lucide-react"

const TEMPLATE_CATEGORIES = [
  "All",
  "Executive",
  "Sales",
  "Project Management",
  "Financial",
  "Marketing",
  "Operations",
  "Custom"
]

const CATEGORY_ICONS = {
  "Executive": TrendingUp,
  "Sales": DollarSign,
  "Project Management": FolderOpen,
  "Financial": BarChart3,
  "Marketing": Users,
  "Operations": Activity,
  "Custom": FileText,
}

export default function DashboardTemplatesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateFromTemplateOpen, setIsCreateFromTemplateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [dashboardName, setDashboardName] = useState("")
  const [dashboardDescription, setDashboardDescription] = useState("")

  // API calls
  const templates = useQuery(api.dashboardTemplates.list, {
    category: selectedCategory === "All" ? undefined : selectedCategory,
    includeBuiltIn: true,
  })
  const categories = useQuery(api.dashboardTemplates.getCategories)
  const createFromTemplate = useMutation(api.dashboardTemplates.createFromTemplate)
  const deleteTemplate = useMutation(api.dashboardTemplates.remove)

  const filteredTemplates = templates?.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleCreateFromTemplate = async () => {
    if (!user || !selectedTemplate || !dashboardName) {
      toast.error("Please provide a dashboard name")
      return
    }

    try {
      const dashboardId = await createFromTemplate({
        templateId: selectedTemplate._id,
        name: dashboardName,
        description: dashboardDescription || undefined,
        userId: user.id,
      })
      
      toast.success("Dashboard created from template successfully")
      router.push(`/analytics/builder?id=${dashboardId}`)
    } catch (error) {
      toast.error("Failed to create dashboard from template")
    }
  }

  const handleDeleteTemplate = async (templateId: Id<"dashboardTemplates">) => {
    if (!user) return

    try {
      await deleteTemplate({
        id: templateId,
        userId: user.id,
      })
      toast.success("Template deleted successfully")
    } catch (error) {
      toast.error("Failed to delete template")
    }
  }

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template)
    setDashboardName(`${template.name} - ${new Date().toLocaleDateString()}`)
    setDashboardDescription(template.description || "")
    setIsCreateFromTemplateOpen(true)
  }

  const handlePreviewTemplate = (template: any) => {
    // In a real implementation, this would open a preview modal
    toast.info("Preview functionality coming soon")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Templates"
        description="Choose from pre-built templates or create your own"
      >
        <Button 
          onClick={() => router.push('/analytics/builder')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Custom Dashboard
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates === undefined ? (
          // Loading state
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search criteria" : "No templates available in this category"}
            </p>
            <Button onClick={() => router.push('/analytics/builder')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Dashboard
            </Button>
          </div>
        ) : (
          filteredTemplates.map(template => {
            const CategoryIcon = CATEGORY_ICONS[template.category as keyof typeof CATEGORY_ICONS] || FileText
            const widgetCount = template.layout?.length || 0
            
            return (
              <Card key={template._id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.isBuiltIn && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Built-in
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Use Template
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        {!template.isBuiltIn && template.createdBy === user?.id && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/analytics/builder?template=${template._id}`)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Template
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTemplate(template._id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>{widgetCount} widgets</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{template.usageCount || 0} uses</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(template.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create from Template Dialog */}
      <Dialog open={isCreateFromTemplateOpen} onOpenChange={setIsCreateFromTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Dashboard from Template</DialogTitle>
            <DialogDescription>
              Create a new dashboard based on "{selectedTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Dashboard Name</Label>
              <Input
                id="dashboard-name"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="My Dashboard"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-description">Description (Optional)</Label>
              <Textarea
                id="dashboard-description"
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
                placeholder="Dashboard description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFromTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFromTemplate} disabled={!dashboardName}>
              Create Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}