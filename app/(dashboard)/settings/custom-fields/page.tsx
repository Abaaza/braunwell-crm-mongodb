"use client"

import React, { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { customFieldSchema, type CustomFieldFormData } from "@/lib/validations"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Move,
  Eye,
  EyeOff,
  Users,
  FolderOpen,
  ListTodo,
  Settings,
  Type,
  Hash,
  Calendar,
  ChevronDown,
  Check,
  Mail,
  Phone,
  Globe,
  FileText,
} from "lucide-react"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { cn } from "@/lib/utils"

type EntityType = "contacts" | "projects" | "tasks"
type FieldType = "text" | "number" | "date" | "dropdown" | "checkbox" | "textarea" | "email" | "phone" | "url"

const entityTypeConfig = {
  contacts: {
    label: "Contacts",
    icon: Users,
    color: "bg-blue-500",
  },
  projects: {
    label: "Projects", 
    icon: FolderOpen,
    color: "bg-green-500",
  },
  tasks: {
    label: "Tasks",
    icon: ListTodo,
    color: "bg-purple-500",
  },
}

const fieldTypeConfig = {
  text: { label: "Text", icon: Type, description: "Single line text input" },
  textarea: { label: "Textarea", icon: FileText, description: "Multi-line text input" },
  number: { label: "Number", icon: Hash, description: "Numeric input" },
  date: { label: "Date", icon: Calendar, description: "Date picker" },
  dropdown: { label: "Dropdown", icon: ChevronDown, description: "Select from predefined options" },
  checkbox: { label: "Checkbox", icon: Check, description: "Yes/No or True/False" },
  email: { label: "Email", icon: Mail, description: "Email address input" },
  phone: { label: "Phone", icon: Phone, description: "Phone number input" },
  url: { label: "URL", icon: Globe, description: "Website URL input" },
}

export default function CustomFieldsPage() {
  const { user, isAdmin } = useAuth()
  const [selectedEntity, setSelectedEntity] = useState<EntityType>("contacts")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<any>(null)
  const [optionInputs, setOptionInputs] = useState<string[]>([])

  const form = useForm<CustomFieldFormData>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      name: "",
      fieldKey: "",
      entityType: selectedEntity,
      fieldType: "text",
      description: "",
      required: false,
      defaultValue: "",
      options: [],
    },
  })

  const customFields = useQuery(api.customFields.getCustomFields, {
    entityType: selectedEntity,
    activeOnly: false,
  })
  const createCustomField = useMutation(api.customFields.createCustomField)
  const updateCustomField = useMutation(api.customFields.updateCustomField)
  const deleteCustomField = useMutation(api.customFields.deleteCustomField)
  const reorderFields = useMutation(api.customFields.reorderCustomFields)

  const handleCreateField = async (data: CustomFieldFormData) => {
    if (!user || !isAdmin) return

    try {
      await createCustomField({
        ...data,
        options: data.fieldType === "dropdown" ? optionInputs.filter(Boolean) : undefined,
        userId: user.id,
      })
      
      toast.success("Custom field created successfully")
      setCreateDialogOpen(false)
      form.reset()
      setOptionInputs([])
    } catch (error) {
      toast.error((error as Error).message || "Failed to create custom field")
    }
  }

  const handleEditField = async (data: CustomFieldFormData) => {
    if (!user || !isAdmin || !selectedField) return

    try {
      await updateCustomField({
        id: selectedField._id,
        name: data.name,
        description: data.description,
        required: data.required,
        defaultValue: data.defaultValue,
        options: data.fieldType === "dropdown" ? optionInputs.filter(Boolean) : undefined,
        userId: user.id,
      })
      
      toast.success("Custom field updated successfully")
      setEditDialogOpen(false)
      form.reset()
      setOptionInputs([])
    } catch (error) {
      toast.error((error as Error).message || "Failed to update custom field")
    }
  }

  const handleDeleteField = async () => {
    if (!user || !isAdmin || !selectedField) return

    try {
      await deleteCustomField({
        id: selectedField._id,
        userId: user.id,
      })
      
      toast.success("Custom field deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedField(null)
    } catch (error) {
      toast.error("Failed to delete custom field")
    }
  }

  const handleToggleActive = async (field: any) => {
    if (!user || !isAdmin) return

    try {
      await updateCustomField({
        id: field._id,
        isActive: !field.isActive,
        userId: user.id,
      })
      
      toast.success(`Field ${field.isActive ? 'deactivated' : 'activated'} successfully`)
    } catch (error) {
      toast.error("Failed to update field status")
    }
  }

  const openCreateDialog = () => {
    form.reset({
      name: "",
      fieldKey: "",
      entityType: selectedEntity,
      fieldType: "text",
      description: "",
      required: false,
      defaultValue: "",
      options: [],
    })
    setOptionInputs([])
    setCreateDialogOpen(true)
  }

  const openEditDialog = (field: any) => {
    setSelectedField(field)
    form.reset({
      name: field.name,
      fieldKey: field.fieldKey,
      entityType: field.entityType,
      fieldType: field.fieldType,
      description: field.description || "",
      required: field.required,
      defaultValue: field.defaultValue || "",
      options: field.options || [],
    })
    setOptionInputs(field.options || [])
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (field: any) => {
    setSelectedField(field)
    setDeleteDialogOpen(true)
  }

  const addOption = () => {
    setOptionInputs([...optionInputs, ""])
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...optionInputs]
    newOptions[index] = value
    setOptionInputs(newOptions)
  }

  const removeOption = (index: number) => {
    const newOptions = optionInputs.filter((_, i) => i !== index)
    setOptionInputs(newOptions)
  }

  const generateFieldKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .replace(/^[^a-z]/, "field_")
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You need administrator privileges to manage custom fields.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Fields"
        description="Define custom fields for contacts, projects, and tasks"
      >
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Field
        </Button>
      </PageHeader>

      <Tabs value={selectedEntity} onValueChange={(value) => setSelectedEntity(value as EntityType)}>
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(entityTypeConfig).map(([key, config]) => {
            const Icon = config.icon
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {config.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.keys(entityTypeConfig).map((entityType) => (
          <TabsContent key={entityType} value={entityType} className="space-y-4">
            {customFields ? (
              customFields.length > 0 ? (
                <div className="grid gap-4">
                  {customFields.map((field) => (
                    <Card key={field._id} className={cn(
                      "transition-all",
                      !field.isActive && "opacity-60"
                    )}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              field.isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                              {React.createElement(fieldTypeConfig[field.fieldType as FieldType].icon, {
                                className: "h-4 w-4"
                              })}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{field.name}</h3>
                                <Badge variant="secondary">{field.fieldKey}</Badge>
                                <Badge variant={field.required ? "destructive" : "outline"}>
                                  {field.required ? "Required" : "Optional"}
                                </Badge>
                                {!field.isActive && (
                                  <Badge variant="secondary">
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {fieldTypeConfig[field.fieldType as FieldType].label}
                                {field.description && ` • ${field.description}`}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(field)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(field)}>
                                {field.isActive ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteDialog(field)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      {(field.defaultValue || (field.options && field.options.length > 0)) && (
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            {field.defaultValue && (
                              <div>
                                <span className="text-muted-foreground">Default:</span>{" "}
                                <span className="font-medium">{field.defaultValue}</span>
                              </div>
                            )}
                            {field.options && field.options.length > 0 && (
                              <div>
                                <span className="text-muted-foreground">Options:</span>{" "}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {field.options.map((option, index) => (
                                    <Badge key={index} variant="outline">{option}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Settings className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">No Custom Fields</h3>
                        <p className="text-sm text-muted-foreground">
                          Create your first custom field for {entityTypeConfig[selectedEntity].label.toLowerCase()}
                        </p>
                      </div>
                      <Button onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Custom Field
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Field Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Field</DialogTitle>
            <DialogDescription>
              Add a new custom field for {entityTypeConfig[selectedEntity].label.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateField)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Client Priority" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e)
                            form.setValue("fieldKey", generateFieldKey(e.target.value))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fieldKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Key</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., client_priority" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this field (auto-generated)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="fieldType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(fieldTypeConfig).map(([key, config]) => {
                          const Icon = config.icon
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{config.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {config.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Help text for this field..."
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Required Field</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Value (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Default value..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("fieldType") === "dropdown" && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {optionInputs.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addOption}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Create Field
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Custom Field</DialogTitle>
            <DialogDescription>
              Update the custom field settings
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditField)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Client Priority" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Help text for this field..."
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Required Field</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Value (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Default value..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedField?.fieldType === "dropdown" && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {optionInputs.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addOption}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Update Field
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Custom Field"
        description={`Are you sure you want to delete "${selectedField?.name}"? This will permanently remove the field definition and all associated data. This action cannot be undone.`}
        confirmText="Delete Field"
        onConfirm={handleDeleteField}
        variant="destructive"
      />
    </div>
  )
}