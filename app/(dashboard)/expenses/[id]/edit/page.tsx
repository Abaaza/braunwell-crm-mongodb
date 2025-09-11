"use client"

import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  return <EditExpenseContent id={id} />
}

function EditExpenseContent({ id }: { id: string }) {
  const router = useRouter()
  const expense = useQuery(api.expenses.get, {
    id: id as Id<"expenses">,
  })

  if (!expense) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/expenses")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit Expense</h2>
      </div>

      <div className="max-w-2xl">
        <ExpenseForm
          expense={expense}
          onSuccess={() => router.push(`/expenses/${expense._id}`)}
          onCancel={() => router.push(`/expenses/${expense._id}`)}
        />
      </div>
    </div>
  )
}