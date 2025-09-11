"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth"
import { formatUKPostcode, validateUKPostcode, validateUKPhone } from "@/lib/utils"
import { toast } from "sonner"
import { Building, MapPin, Phone, Mail, Globe, CreditCard, FileText, Save } from "lucide-react"

const companySettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  tradingName: z.string().optional(),
  companyNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    postcode: z.string().min(1, "Postcode is required").refine(validateUKPostcode, "Invalid UK postcode"),
    country: z.string().default("United Kingdom"),
  }),
  phone: z.string().optional().refine((val) => !val || validateUKPhone(val), "Invalid UK phone number"),
  email: z.string().email("Invalid email address").optional(),
  website: z.string().url("Invalid website URL").optional(),
  bankDetails: z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    sortCode: z.string().optional(),
    bankName: z.string().optional(),
  }).optional(),
  invoiceSettings: z.object({
    invoicePrefix: z.string().default("INV-"),
    nextInvoiceNumber: z.number().min(1).default(1),
    defaultPaymentTerms: z.string().default("Net 30"),
    defaultVATRate: z.number().min(0).max(1).default(0.20),
    footerText: z.string().optional(),
  }),
})

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>

export default function CompanySettingsPage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const companySettings = useQuery(api.companySettings.get, {})
  const createSettings = useMutation(api.companySettings.create)
  const updateSettings = useMutation(api.companySettings.update)

  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      companyName: "",
      tradingName: "",
      companyNumber: "",
      vatNumber: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        postcode: "",
        country: "United Kingdom",
      },
      phone: "",
      email: "",
      website: "",
      bankDetails: {
        accountName: "",
        accountNumber: "",
        sortCode: "",
        bankName: "",
      },
      invoiceSettings: {
        invoicePrefix: "INV-",
        nextInvoiceNumber: 1,
        defaultPaymentTerms: "Net 30",
        defaultVATRate: 0.20,
        footerText: "",
      },
    },
  })

  // Populate form when settings load
  useState(() => {
    if (companySettings) {
      form.reset({
        companyName: companySettings.companyName,
        tradingName: companySettings.tradingName || "",
        companyNumber: companySettings.companyNumber || "",
        vatNumber: companySettings.vatNumber || "",
        address: {
          line1: companySettings.address.line1,
          line2: companySettings.address.line2 || "",
          city: companySettings.address.city,
          postcode: companySettings.address.postcode,
          country: companySettings.address.country,
        },
        phone: companySettings.phone || "",
        email: companySettings.email || "",
        website: companySettings.website || "",
        bankDetails: companySettings.bankDetails || {
          accountName: "",
          accountNumber: "",
          sortCode: "",
          bankName: "",
        },
        invoiceSettings: companySettings.invoiceSettings,
      })
    }
  })

  const handleSave = async (data: CompanySettingsFormData) => {
    if (!user) return

    try {
      // Format postcode
      if (data.address.postcode) {
        data.address.postcode = formatUKPostcode(data.address.postcode)
      }

      // Create the update payload with proper typing
      const updatePayload: any = {
        companyName: data.companyName,
        tradingName: data.tradingName,
        companyNumber: data.companyNumber,
        vatNumber: data.vatNumber,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        invoiceSettings: data.invoiceSettings,
        userId: user.id,
      }

      // Only include bankDetails if all fields are provided
      if (data.bankDetails && data.bankDetails.accountName && data.bankDetails.accountNumber && data.bankDetails.sortCode && data.bankDetails.bankName) {
        updatePayload.bankDetails = {
          accountName: data.bankDetails.accountName,
          accountNumber: data.bankDetails.accountNumber,
          sortCode: data.bankDetails.sortCode,
          bankName: data.bankDetails.bankName,
        }
      }

      if (companySettings) {
        await updateSettings(updatePayload)
        toast.success("Company settings updated successfully")
      } else {
        await createSettings(updatePayload)
        toast.success("Company settings created successfully")
      }
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to save company settings")
    }
  }

  if (!companySettings && !isEditing) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <PageHeader
          title="Company Settings"
          description="Configure your company information for invoices and branding"
        />
        
        <Card>
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Company Settings Found</h3>
            <p className="text-muted-foreground mb-4">
              Set up your company information to enable invoice generation and branding.
            </p>
            <Button onClick={() => setIsEditing(true)}>
              <Building className="mr-2 h-4 w-4" />
              Setup Company Information
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader
        title="Company Settings"
        description="Configure your company information for invoices and branding"
      >
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "outline" : "default"}
        >
          {isEditing ? "Cancel" : "Edit Settings"}
        </Button>
      </PageHeader>

      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  {...form.register("companyName")}
                  disabled={!isEditing}
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.companyName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="tradingName">Trading Name</Label>
                <Input
                  id="tradingName"
                  {...form.register("tradingName")}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyNumber">Company Number</Label>
                <Input
                  id="companyNumber"
                  {...form.register("companyNumber")}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="vatNumber">VAT Number</Label>
                <Input
                  id="vatNumber"
                  {...form.register("vatNumber")}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address.line1">Address Line 1 *</Label>
              <Input
                id="address.line1"
                {...form.register("address.line1")}
                disabled={!isEditing}
              />
              {form.formState.errors.address?.line1 && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.address.line1.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="address.line2">Address Line 2</Label>
              <Input
                id="address.line2"
                {...form.register("address.line2")}
                disabled={!isEditing}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="address.city">City *</Label>
                <Input
                  id="address.city"
                  {...form.register("address.city")}
                  disabled={!isEditing}
                />
                {form.formState.errors.address?.city && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.address.city.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="address.postcode">Postcode *</Label>
                <Input
                  id="address.postcode"
                  {...form.register("address.postcode")}
                  disabled={!isEditing}
                />
                {form.formState.errors.address?.postcode && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.address.postcode.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="address.country">Country *</Label>
                <Input
                  id="address.country"
                  {...form.register("address.country")}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  disabled={!isEditing}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  disabled={!isEditing}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...form.register("website")}
                  disabled={!isEditing}
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banking Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Banking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankDetails.accountName">Account Name</Label>
                <Input
                  id="bankDetails.accountName"
                  {...form.register("bankDetails.accountName")}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="bankDetails.bankName">Bank Name</Label>
                <Input
                  id="bankDetails.bankName"
                  {...form.register("bankDetails.bankName")}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankDetails.accountNumber">Account Number</Label>
                <Input
                  id="bankDetails.accountNumber"
                  {...form.register("bankDetails.accountNumber")}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="bankDetails.sortCode">Sort Code</Label>
                <Input
                  id="bankDetails.sortCode"
                  {...form.register("bankDetails.sortCode")}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="invoiceSettings.invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoiceSettings.invoicePrefix"
                  {...form.register("invoiceSettings.invoicePrefix")}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="invoiceSettings.nextInvoiceNumber">Next Invoice Number</Label>
                <Input
                  id="invoiceSettings.nextInvoiceNumber"
                  type="number"
                  {...form.register("invoiceSettings.nextInvoiceNumber", { valueAsNumber: true })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="invoiceSettings.defaultVATRate">Default VAT Rate (%)</Label>
                <Input
                  id="invoiceSettings.defaultVATRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...form.register("invoiceSettings.defaultVATRate", { 
                    valueAsNumber: true,
                    setValueAs: (value) => value / 100 // Convert percentage to decimal
                  })}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="invoiceSettings.defaultPaymentTerms">Default Payment Terms</Label>
              <Input
                id="invoiceSettings.defaultPaymentTerms"
                {...form.register("invoiceSettings.defaultPaymentTerms")}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="invoiceSettings.footerText">Footer Text</Label>
              <Textarea
                id="invoiceSettings.footerText"
                {...form.register("invoiceSettings.footerText")}
                disabled={!isEditing}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}