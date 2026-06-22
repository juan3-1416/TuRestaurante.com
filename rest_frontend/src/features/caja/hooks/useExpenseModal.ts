import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useShift } from "./useShift"

export const expenseSchema = z.object({
  reason: z.string().min(3, { message: "La razón debe tener al menos 3 caracteres." }),
  amount: z.number().min(0.1, { message: "El monto debe ser mayor a 0." }),
  description: z.string().optional(),
})

export function useExpenseModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { registerExpense } = useShift()

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      reason: "",
      amount: 0,
      description: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: z.infer<typeof expenseSchema>) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      const finalDescription = values.description?.trim() 
        ? `${values.reason} (${values.description})` 
        : values.reason

      await registerExpense.mutateAsync({
        amount: values.amount,
        description: finalDescription,
      })

      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error al registrar gasto:", error)
    }
  }

  return {
    isOpen,
    setIsOpen,
    form,
    isSubmitting,
    onSubmit
  }
}
