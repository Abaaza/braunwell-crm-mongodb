"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contactSchema, type ContactFormData } from "@/lib/validations"
import { PageHeader } from "@/components/shared/page-header"
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
} from "@/components/ui/form"
import { useAuth } from "@/lib/auth"
import { formatDateTime, getInitials, validateUKPhone } from "@/lib/utils"
import { toast } from "sonner"
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Plus,
  FileDown,
  MessageSquare,
  Briefcase,
  StickyNote,
  Tag,
  Activity,
  AlertCircle,
  X,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"


export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [commDialogOpen, setCommDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [newComm, setNewComm] = useState({
    type: "email" as "email" | "call" | "meeting",
    subject: "",
    notes: "",
  })
  const [tagInput, setTagInput] = useState("")
  const [isAddingTag, setIsAddingTag] = useState(false)
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    },
  })

  const contactId = params.id as Id<"contacts">
  const contact = useQuery(api.contacts.get, { id: contactId })
  const projects = useQuery(api.projects.list, { includeArchived: false }) // In real app, would filter by contact
  const contactProjects = useQuery(api.projectContacts.getContactProjects, { contactId })
  const updateContact = useMutation(api.contacts.update)
  const deleteContact = useMutation(api.contacts.remove)
  const communications = useQuery(api.contactCommunications.list, { contactId })
  const createCommunication = useMutation(api.contactCommunications.create)
  const notes = useQuery(api.contactNotes.list, { contactId })
  const createNote = useMutation(api.contactNotes.create)
  
  // Check if the query has finished loading
  const isLoading = contact === undefined


  const handleEditContact = () => {
    if (!contact) return
    
    form.reset({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company || "",
      notes: contact.notes || "",
    })
    setEditDialogOpen(true)
  }

  const handleUpdateContact = async (data: ContactFormData) => {
    if (!user) return

    try {
      await updateContact({
        id: contactId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company || undefined,
        notes: data.notes || undefined,
        userId: user.id,
      })
      
      toast.success("Contact updated successfully")
      setEditDialogOpen(false)
    } catch (error) {
      toast.error((error as Error).message || "Failed to update contact")
    }
  }

  const handleDeleteContact = async () => {
    if (!user) return

    try {
      await deleteContact({
        id: contactId,
        userId: user.id,
      })
      
      toast.success("Contact deleted successfully")
      router.push("/contacts")
    } catch (error) {
      toast.error("Failed to delete contact")
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return

    try {
      await createNote({
        contactId,
        content: newNote,
        userId: user.id,
      })
      
      setNewNote("")
      setNoteDialogOpen(false)
      toast.success("Note added successfully")
    } catch (error) {
      toast.error("Failed to add note")
    }
  }

  const handleAddCommunication = async () => {
    if (!newComm.subject.trim() || !user) return

    try {
      await createCommunication({
        contactId,
        type: newComm.type,
        subject: newComm.subject,
        notes: newComm.notes || undefined,
        userId: user.id,
      })
      
      setNewComm({ type: "email", subject: "", notes: "" })
      setCommDialogOpen(false)
      toast.success("Communication logged successfully")
    } catch (error) {
      toast.error("Failed to log communication")
    }
  }

  const handleAddTag = async () => {
    if (!tagInput.trim() || !user || !contact) return

    const newTag = tagInput.trim()
    
    // Check if tag already exists
    if (contact.tags && contact.tags.includes(newTag)) {
      toast.error("Tag already exists")
      return
    }

    try {
      const updatedTags = [...(contact.tags || []), newTag]
      await updateContact({
        id: contactId,
        tags: updatedTags,
        userId: user.id,
      })
      
      setTagInput("")
      setIsAddingTag(false)
      toast.success("Tag added successfully")
    } catch (error) {
      toast.error("Failed to add tag")
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!user || !contact) return

    try {
      const updatedTags = (contact.tags || []).filter((tag: string) => tag !== tagToRemove)
      await updateContact({
        id: contactId,
        tags: updatedTags,
        userId: user.id,
      })
      
      toast.success("Tag removed successfully")
    } catch (error) {
      toast.error("Failed to remove tag")
    }
  }

  // Show loading skeleton while data is being fetched
  if (isLoading) {
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

  // Show error state if contact doesn't exist
  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Contact Not Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          The contact you're looking for doesn't exist or may have been deleted.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/contacts')} variant="default">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contacts
          </Button>
          <Button onClick={() => router.refresh()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/contacts" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Contacts
        </Link>
        <span>/</span>
        <span>{contact.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className={`${getAvatarColor(contact.name)} text-white text-xl`}>
              {getInitials(contact.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{contact.name}</h1>
            {contact.company && (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Building className="h-4 w-4" />
                {contact.company}
              </p>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEditContact}>
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
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export vCard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Contact Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <a
                href={`mailto:${contact.email}`}
                className="text-sm font-medium hover:text-primary hover:underline truncate block"
              >
                {contact.email}
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-accent/10 p-2">
              <Phone className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Phone</p>
              <a
                href={`tel:${contact.phone}`}
                className="text-sm font-medium hover:text-primary hover:underline"
              >
                {contact.phone}
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-warning/10 p-2">
              <Calendar className="h-4 w-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Added</p>
              <p className="text-sm font-medium">{formatDateTime(contact.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contact.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{contact.notes}</p>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created By</p>
                    <p className="text-sm">{contact.creatorName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{formatDateTime(contact.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tags</CardTitle>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingTag(true)}
                  disabled={isAddingTag}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Tag
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isAddingTag && (
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Enter tag name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingTag(false)
                        setTagInput("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {contact.tags && contact.tags.length > 0 ? (
                    contact.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="pr-1">
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags added yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Associated Projects</h3>
          </div>

          <div className="space-y-3">
            {contactProjects ? (
              contactProjects.length > 0 ? (
                contactProjects.filter((p): p is NonNullable<typeof p> => p !== null).map((project) => (
                  <Card key={project._id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="font-medium">{project.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge variant={project.status === "open" ? "default" : "success"}>
                            {project.status}
                          </Badge>
                          {project.role && (
                            <Badge variant="outline" className="text-xs">
                              {project.role}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Associated {formatDateTime(project.associatedAt)}
                        </p>
                      </div>
                      <Link href={`/projects/${project._id}`}>
                        <Button variant="ghost" size="sm">
                          View Project
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>No associated projects</p>
                  <p className="text-sm">This contact is not linked to any projects yet</p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Communication History</h3>
            {isAdmin && (
              <Button onClick={() => setCommDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Communication
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {communications ? (
              communications.length > 0 ? (
                communications.map((comm) => (
                  <Card key={comm.id}>
                    <CardContent className="flex gap-4 p-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        {comm.type === "email" && <Mail className="h-4 w-4 text-primary" />}
                        {comm.type === "call" && <Phone className="h-4 w-4 text-primary" />}
                        {comm.type === "meeting" && <Calendar className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{comm.subject}</p>
                        {comm.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{comm.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDateTime(comm.date)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>No communications logged</p>
                  <p className="text-sm">Start tracking your interactions with this contact</p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notes</h3>
            {isAdmin && (
              <Button onClick={() => setNoteDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {notes ? (
              notes.length > 0 ? (
                notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {note.createdByName} • {formatDateTime(note.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <StickyNote className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>No notes yet</p>
                  <p className="text-sm">Add notes to track important information</p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
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
                <p className="font-medium text-sm">Contact created</p>
                <p className="text-xs text-muted-foreground">
                  by {contact.creatorName} • {formatDateTime(contact.createdAt)}
                </p>
              </div>
            </div>
            
            {communications && communications.length > 0 && (
              communications.map((comm, index) => (
                <div key={comm.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary/10 p-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    {index < communications.length - 1 && (
                      <div className="w-px h-full bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="font-medium text-sm">
                      {comm.type.charAt(0).toUpperCase() + comm.type.slice(1)}: {comm.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(comm.date)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateContact)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (UK)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g. 07123 456789" {...field} />
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
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Update Contact
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contact"
        description={`Are you sure you want to delete ${contact.name}? This action cannot be undone.`}
        confirmText="Delete Contact"
        onConfirm={handleDeleteContact}
        variant="destructive"
      />

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note about this contact
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="note-content">Note</Label>
              <Textarea
                id="note-content"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Communication Dialog */}
      <Dialog open={commDialogOpen} onOpenChange={setCommDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Communication</DialogTitle>
            <DialogDescription>
              Record a communication with this contact
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comm-type">Type</Label>
              <select
                id="comm-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newComm.type}
                onChange={(e) => setNewComm({ ...newComm, type: e.target.value as any })}
              >
                <option value="email">Email</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comm-subject">Subject</Label>
              <Input
                id="comm-subject"
                value={newComm.subject}
                onChange={(e) => setNewComm({ ...newComm, subject: e.target.value })}
                placeholder="Brief description..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comm-notes">Notes (optional)</Label>
              <Textarea
                id="comm-notes"
                value={newComm.notes}
                onChange={(e) => setNewComm({ ...newComm, notes: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCommunication} disabled={!newComm.subject.trim()}>
              Log Communication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}