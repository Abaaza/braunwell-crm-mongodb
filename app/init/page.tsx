"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { CheckCircle, Database, Loader2, Users } from "lucide-react"
import Link from "next/link"

export default function InitPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  
  const initializeUsers = useMutation(api.auth.initializeUsers)
  const seedDatabase = useMutation(api.seed.seedDatabase)

  const handleInitialize = async () => {
    setLoading(true)
    
    try {
      // Step 1: Initialize users
      setStep(1)
      await initializeUsers()
      toast.success("Users initialized successfully")
      
      // Step 2: Seed database
      setStep(2)
      const result = await seedDatabase()
      toast.success(`Database seeded: ${result.contacts} contacts, ${result.projects} projects, ${result.tasks} tasks`)
      
      setStep(3)
    } catch (error) {
      toast.error("Initialization failed: " + (error as Error).message)
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Initialize Braunwell CRM</CardTitle>
          <CardDescription className="text-center">
            Set up your database with sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 && (
            <>
              <div className="text-center space-y-4">
                <Database className="h-16 w-16 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  This will create default users and populate your database with sample projects,
                  contacts, and tasks for testing.
                </p>
              </div>
              <Button
                onClick={handleInitialize}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Initialize Database
              </Button>
            </>
          )}

          {step > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle
                  className={`h-5 w-5 ${
                    step >= 1 ? "text-green-500" : "text-gray-300"
                  }`}
                />
                <span className={step >= 1 ? "text-green-700" : "text-gray-500"}>
                  Users initialized
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle
                  className={`h-5 w-5 ${
                    step >= 2 ? "text-green-500" : "text-gray-300"
                  }`}
                />
                <span className={step >= 2 ? "text-green-700" : "text-gray-500"}>
                  Sample data created
                </span>
              </div>
              {step >= 2 && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">Database ready!</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Database initialized successfully!</p>
                <p className="text-sm text-muted-foreground">
                  You can now log in with your credentials.
                </p>
              </div>
              <Link href="/login" className="block">
                <Button className="w-full" size="lg">
                  <Users className="mr-2 h-4 w-4" />
                  Go to Login
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}