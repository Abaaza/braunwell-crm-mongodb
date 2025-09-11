"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contactSchema, type ContactFormData } from "@/lib/validations"
import { CustomFieldsForm } from "@/components/custom-fields/custom-field-input"
import { VirtualGrid, VirtualList } from "@/components/shared/virtual-list"
import { LazyAvatar } from "@/components/ui/lazy-image"
import { PageHeader } from "@/components/shared/page-header"
import { EnhancedSearchBar } from "@/components/shared/enhanced-search-bar"
import { AdvancedSearch } from "@/components/shared/advanced-search"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuth } from "@/lib/auth"
import { getInitials, validateUKPhone, cn } from "@/lib/utils"
import { BulkActions, SelectAllCheckbox, type BulkAction } from "@/components/shared/bulk-actions"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "sonner"
import {
  Users,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Building,
  Edit,
  Trash2,
  Grid3X3,
  List,
  FileDown,
  FileUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react"

type SortField = "name" | "email" | "company" | "createdAt"
type SortOrder = "asc" | "desc"

export default function ContactsPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
  const [editCustomFieldValues, setEditCustomFieldValues] = useState<Record<string, string>>({})
  
  const createForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    },
  })
  
  const editForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    },
  })

  const contacts = useQuery(api.contacts.list, { search })
  const projects = useQuery(api.projects.list, { includeArchived: false })
  const customFields = useQuery(api.customFields.getCustomFields, {
    entityType: "contacts",
    activeOnly: true,
  })
  const projectContacts = useQuery(
    api.projectContacts.getProjectContacts, 
    projectFilter !== "all" ? { projectId: projectFilter as any } : "skip"
  )
  const createContact = useMutation(api.contacts.create)
  const updateContact = useMutation(api.contacts.update)
  const deleteContact = useMutation(api.contacts.remove)
  const deleteMultipleContacts = useMutation(api.contacts.removeMultiple)

  // Filter contacts by project if needed
  let filteredContacts = contacts || []
  if (projectFilter !== "all" && projectContacts) {
    const contactIds = new Set(projectContacts.filter(pc => pc !== null).map(pc => pc._id))
    filteredContacts = filteredContacts.filter(c => contactIds.has(c._id))
  }

  // Sort contacts
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]
    
    // Handle string comparison
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal?.toLowerCase() || ''
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

  const handleCreateContact = async (data: ContactFormData) => {
    if (!user) return

    try {
      // Prepare custom field values
      const customFieldsData = Object.entries(customFieldValues)
        .filter(([_, value]) => value.trim() !== "")
        .map(([fieldId, value]) => ({
          fieldId: fieldId as any,
          value,
        }))

      await createContact({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company || undefined,
        notes: data.notes || undefined,
        userId: user.id,
        customFields: customFieldsData.length > 0 ? customFieldsData : undefined,
      })
      
      toast.success("Contact created successfully")
      
      // TODO: Associate projects when projectContacts API is available
      if (selectedProjects.length > 0) {
        toast.info(`${selectedProjects.length} project${selectedProjects.length !== 1 ? 's' : ''} will be associated once the feature is enabled`)
      }
      
      setCreateDialogOpen(false)
      createForm.reset()
      setSelectedProjects([])
      setCustomFieldValues({})
    } catch (error) {
      toast.error((error as Error).message || "Failed to create contact")
    }
  }

  const handleUpdateContact = async (data: ContactFormData) => {
    if (!user || !selectedContact) return

    try {
      // Prepare custom field values
      const customFieldsData = Object.entries(editCustomFieldValues)
        .filter(([_, value]) => value.trim() !== "")
        .map(([fieldId, value]) => ({
          fieldId: fieldId as any,
          value,
        }))

      await updateContact({
        id: selectedContact._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company || undefined,
        notes: data.notes || undefined,
        userId: user.id,
        customFields: customFieldsData.length > 0 ? customFieldsData : undefined,
      })
      
      toast.success("Contact updated successfully")
      setEditDialogOpen(false)
      editForm.reset()
      setEditCustomFieldValues({})
    } catch (error) {
      toast.error((error as Error).message || "Failed to update contact")
    }
  }

  const handleDeleteContact = async () => {
    if (!user || !selectedContact) return

    try {
      await deleteContact({
        id: selectedContact._id,
        userId: user.id,
      })
      
      toast.success("Contact deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedContact(null)
    } catch (error) {
      toast.error("Failed to delete contact")
    }
  }

  const resetForm = () => {
    createForm.reset()
    editForm.reset()
    setSelectedContact(null)
    setCustomFieldValues({})
    setEditCustomFieldValues({})
  }

  const openEditDialog = (contact: any) => {
    setSelectedContact(contact)
    editForm.reset({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company || "",
      notes: contact.notes || "",
    })
    
    // Load custom field values
    const customFieldValuesMap: Record<string, string> = {}
    if (contact.customFieldValues) {
      contact.customFieldValues.forEach((cfv: any) => {
        customFieldValuesMap[cfv.fieldId] = cfv.value
      })
    }
    setEditCustomFieldValues(customFieldValuesMap)
    
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (contact: any) => {
    setSelectedContact(contact)
    setDeleteDialogOpen(true)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Bulk actions handlers
  const handleBulkDelete = async () => {
    if (!user || selectedContacts.size === 0) return

    try {
      await deleteMultipleContacts({
        ids: Array.from(selectedContacts) as any[],
        userId: user.id,
      })
      toast.success(`Deleted ${selectedContacts.size} contacts`)
      setSelectedContacts(new Set())
      setBulkDeleteOpen(false)
    } catch (error) {
      toast.error("Failed to delete contacts")
    }
  }

  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContacts)
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId)
    } else {
      newSelection.add(contactId)
    }
    setSelectedContacts(newSelection)
  }

  const toggleAllContacts = () => {
    if (selectedContacts.size === sortedContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(sortedContacts.map(c => c._id)))
    }
  }

  const bulkActions: BulkAction[] = [
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setBulkDeleteOpen(true),
      variant: "destructive",
      disabled: !isAdmin,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Manage your contacts and customer relationships"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled>
            <FileUp className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" disabled>
            <FileDown className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button onClick={() => setCreateDialogOpen(true)} variant="gradient" animation="shine">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Filters and Sort */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <EnhancedSearchBar
              placeholder="Search contacts by name, email, phone, or company..."
              value={search}
              onChange={setSearch}
              entityType="contacts"
              className="w-full sm:max-w-md"
              onSearch={(query) => {
                // You can add custom search logic here if needed
                console.log("Searching for:", query)
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={() => setAdvancedSearchOpen(true)}
                className="whitespace-nowrap"
              >
                <Filter className="mr-2 h-4 w-4" />
                Advanced Search
              </Button>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Contacts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  {projects && projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
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
          onClick={() => handleSort("email")}
          className={cn(
            "h-8",
            sortField === "email" && "text-foreground"
          )}
        >
          Email {getSortIcon("email")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSort("company")}
          className={cn(
            "h-8",
            sortField === "company" && "text-foreground"
          )}
        >
          Company {getSortIcon("company")}
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
      </div>
    </div>

      {/* Contacts Grid/List */}
      {contacts ? (
        sortedContacts.length > 0 ? (
          viewMode === "grid" ? (
            <VirtualGrid
              items={sortedContacts}
              height="calc(100vh - 400px)"
              columnCount={typeof window !== 'undefined' ? (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1) : 3}
              itemHeight={280}
              gap={16}
              renderItem={(contact) => (
                <Card
                  key={contact._id}
                  className={cn(
                    "transition-all hover:shadow-lg hover:scale-[1.02] relative h-full cursor-pointer",
                    selectedContacts.has(contact._id) && "ring-2 ring-primary"
                  )}
                  onClick={(e) => {
                    // Don't navigate if clicking on checkbox or dropdown menu
                    if ((e.target as HTMLElement).closest('input[type="checkbox"]') || 
                        (e.target as HTMLElement).closest('[role="menu"]') ||
                        (e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    router.push(`/contacts/${contact._id}`);
                  }}
                >
                  {isAdmin && (
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedContacts.has(contact._id)}
                        onChange={() => toggleContactSelection(contact._id)}
                      />
                    </div>
                  )}
                  <CardHeader className={cn("pb-3", isAdmin && "pl-12")}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <LazyAvatar
                          fallback={getInitials(contact.name)}
                          size="md"
                          className={`${getAvatarColor(contact.name)} text-white transition-transform duration-300 group-hover:scale-110`}
                        />
                        <div>
                          <h3 className="font-semibold">{contact.name}</h3>
                          {contact.company && (
                            <p className="text-sm text-muted-foreground">{contact.company}</p>
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
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="mr-2 h-4 w-4" />
                              Call
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteDialog(contact)}
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
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="hover:text-primary hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <a
                          href={`tel:${contact.phone}`}
                          className="hover:text-primary hover:underline"
                        >
                          {contact.phone}
                        </a>
                      </div>
                      {contact.notes && (
                        <p className="text-muted-foreground mt-3 line-clamp-2 transition-colors group-hover:text-foreground/70">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge variant="outline">
                        <Building className="mr-1 h-3 w-3" />
                        {contact.projectCount || 0} Project{contact.projectCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {isAdmin && (
                        <th className="p-4 w-12">
                          <SelectAllCheckbox
                            checked={selectedContacts.size === sortedContacts.length}
                            indeterminate={selectedContacts.size > 0 && selectedContacts.size < sortedContacts.length}
                            onCheckedChange={toggleAllContacts}
                          />
                        </th>
                      )}
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Phone</th>
                      <th className="text-left p-4 font-medium">Company</th>
                      <th className="text-left p-4 font-medium">Projects</th>
                      {isAdmin && <th className="text-right p-4 font-medium">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedContacts.map((contact) => (
                      <tr key={contact._id} className={cn(
                        "border-b hover:bg-muted/50 cursor-pointer",
                        selectedContacts.has(contact._id) && "bg-muted/50"
                      )}
                      onClick={(e) => {
                        // Don't navigate if clicking on checkbox or dropdown menu
                        if ((e.target as HTMLElement).closest('input[type="checkbox"]') || 
                            (e.target as HTMLElement).closest('[role="menu"]') ||
                            (e.target as HTMLElement).closest('button') ||
                            (e.target as HTMLElement).closest('a')) {
                          return;
                        }
                        router.push(`/contacts/${contact._id}`);
                      }}>
                        {isAdmin && (
                          <td className="p-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                              checked={selectedContacts.has(contact._id)}
                              onChange={() => toggleContactSelection(contact._id)}
                            />
                          </td>
                        )}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <LazyAvatar
                              fallback={getInitials(contact.name)}
                              size="sm"
                              className={`${getAvatarColor(contact.name)} text-white text-xs transition-transform duration-300 hover:scale-110`}
                            />
                            <span className="font-medium">{contact.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-sm hover:text-primary hover:underline"
                          >
                            {contact.email}
                          </a>
                        </td>
                        <td className="p-4">
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-sm hover:text-primary hover:underline"
                          >
                            {contact.phone}
                          </a>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{contact.company || "-"}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">2</Badge>
                        </td>
                        {isAdmin && (
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Email
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Phone className="mr-2 h-4 w-4" />
                                  Call
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => openDeleteDialog(contact)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        ) : (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No contacts found"
            description={
              search
                ? "Try adjusting your search terms"
                : "Add your first contact to get started"
            }
            action={
              isAdmin && !search
                ? {
                    label: "Add Contact",
                    onClick: () => setCreateDialogOpen(true),
                  }
                : undefined
            }
          />
        )
      ) : (
        // Loading skeletons
        viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full shimmer" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 shimmer animation-delay-100" />
                      <Skeleton className="h-3 w-24 shimmer animation-delay-200" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full shimmer animation-delay-300" />
                    <Skeleton className="h-4 w-3/4 shimmer animation-delay-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-8">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full shimmer" />
                    <Skeleton className="h-4 flex-1 shimmer animation-delay-100" />
                    <Skeleton className="h-4 w-32 shimmer animation-delay-200" />
                    <Skeleton className="h-4 w-24 shimmer animation-delay-300" />
                    <Skeleton className="h-4 w-20 shimmer animation-delay-400" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )
      )}

      {/* Create Contact Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Create a new contact in your CRM
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateContact)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (UK)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter phone number" {...field} />
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
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this contact..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Project Selection */}
              <div className="space-y-2">
                <Label>Associated Projects (Optional)</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Select projects to associate with this contact
                </div>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {projects ? (
                    projects.length > 0 ? (
                      projects.filter(p => p.status === "open").map((project) => (
                        <label
                          key={project._id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedProjects.includes(project._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjects([...selectedProjects, project._id])
                              } else {
                                setSelectedProjects(selectedProjects.filter(id => id !== project._id))
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{project.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {project.status} • £{project.expectedRevenueGBP.toLocaleString()}
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No projects available
                      </p>
                    )
                  ) : (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full shimmer" style={{animationDelay: `${i * 100}ms`}} />
                      ))}
                    </div>
                  )}
                </div>
                {selectedProjects.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Custom Fields */}
              {customFields && customFields.length > 0 && (
                <CustomFieldsForm
                  fields={customFields}
                  values={customFieldValues}
                  onChange={(fieldId, value) => 
                    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }))
                  }
                />
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setCreateDialogOpen(false)
                  setSelectedProjects([])
                  setCustomFieldValues({})
                }}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={createForm.formState.isSubmitting}>
                  Add Contact
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md glass border-0">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateContact)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (UK)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter phone number" {...field} />
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
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this contact..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Custom Fields */}
              {customFields && customFields.length > 0 && (
                <CustomFieldsForm
                  fields={customFields}
                  values={editCustomFieldValues}
                  onChange={(fieldId, value) => 
                    setEditCustomFieldValues(prev => ({ ...prev, [fieldId]: value }))
                  }
                />
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setEditDialogOpen(false)
                  setEditCustomFieldValues({})
                }}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={editForm.formState.isSubmitting}>
                  Update Contact
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass border-0">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedContact?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteContact}>
              Delete Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Selected Contacts"
        description={`Are you sure you want to delete ${selectedContacts.size} contact${selectedContacts.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete Contacts"
        onConfirm={handleBulkDelete}
        variant="destructive"
      />

      {/* Advanced Search Dialog */}
      <Dialog open={advancedSearchOpen} onOpenChange={setAdvancedSearchOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Search</DialogTitle>
            <DialogDescription>
              Search across all your data with advanced filters and options
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AdvancedSearch
              entityType="contacts"
              placeholder="Search contacts with advanced options..."
              onResultSelect={(result) => {
                // Handle result selection - could navigate to contact detail
                console.log("Selected result:", result)
                setAdvancedSearchOpen(false)
              }}
              showSuggestions={true}
              showFilters={true}
              showSavedSearches={true}
              className="w-full"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Toolbar */}
      <BulkActions
        selectedCount={selectedContacts.size}
        onClearSelection={() => setSelectedContacts(new Set())}
        actions={bulkActions}
      />
    </div>
  )
}