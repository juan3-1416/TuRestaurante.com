import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/axios"

export const variantFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  price: z.number().min(0.1, { message: "El precio debe ser mayor a 0." }),
  status: z.enum(["Disponible", "Agotado"]),
})

export type VariantFormValues = z.infer<typeof variantFormSchema>

interface UseVariantProps {
  subcategoryId: number | string
  itemToEdit?: { id: number; name: string; price: string | number; status: string }
}

export function useVariant({ subcategoryId, itemToEdit }: UseVariantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      name: itemToEdit?.name || "",
      price: itemToEdit ? Number(itemToEdit.price) : 0,
      status: (itemToEdit?.status as "Disponible" | "Agotado") || "Disponible",
    },
  })

  const saveVariantMutation = useMutation({
    mutationFn: async (values: VariantFormValues) => {
      if (itemToEdit) {
        const response = await apiClient.put(`/inventory/products/${itemToEdit.id}/`, {
          ...values,
          subcategory: subcategoryId
        })
        return response.data
      } else {
        const response = await apiClient.post('/inventory/products/', {
          ...values,
          subcategory: subcategoryId
        })
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      setIsOpen(false)
      if (!itemToEdit) {
        form.reset()
      }
    },
    onError: (error) => {
      console.error("Error al guardar variante:", error)
    }
  })

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open && !itemToEdit) {
      form.reset()
    }
  }

  const onSubmit = async (values: VariantFormValues) => {
    await saveVariantMutation.mutateAsync(values)
  }

  return {
    isOpen,
    setIsOpen: handleOpenChange,
    form,
    isSubmitting: saveVariantMutation.isPending,
    onSubmit
  }
}
