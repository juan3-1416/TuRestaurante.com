import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { apiClient } from "@/lib/axios"

export const variantFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  price: z.number().min(0.1, { message: "El precio debe ser mayor a 0." }),
  status: z.enum(["Disponible", "Agotado"]),
})

export type VariantFormValues = z.infer<typeof variantFormSchema>

interface UseVariantProps {
  subcategoryId: number | string
  subcategoryName?: string
  itemToEdit?: { id: number; name: string; price: string | number; status: string }
  onSuccess?: () => void
}

export function useVariant({ subcategoryId, subcategoryName, itemToEdit, onSuccess }: UseVariantProps) {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      name: itemToEdit?.name || "",
      price: itemToEdit ? Number(itemToEdit.price) : 0,
      status: (itemToEdit?.status as "Disponible" | "Agotado") || "Disponible",
    },
  })

  const { isSubmitting } = form.formState

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      form.reset()
    }
  }

  const onSubmit = async (values: VariantFormValues) => {
    try {
      if (itemToEdit) {
        console.log(`Editando variante ${itemToEdit.id}:`, values)
        await apiClient.put(`/inventory/products/${itemToEdit.id}/`, {
          ...values,
          subcategory: subcategoryId
        })
      } else {
        console.log(`Guardando variante en ${subcategoryName}:`, values)
        await apiClient.post('/inventory/products/', {
          ...values,
          subcategory: subcategoryId
        })
      }
      
      setIsOpen(false)
      form.reset()

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error al guardar variante:", error)
      setIsOpen(false)
      form.reset()
      if (onSuccess) onSuccess()
    }
  }

  return {
    isOpen,
    setIsOpen: handleOpenChange,
    form,
    isSubmitting,
    onSubmit
  }
}
