"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { apiClient } from "@/lib/axios"

// Esquema de validación para la nueva subcategoría
const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
})

interface SubcategoryModalProps {
  categoryId?: string
  categoryName?: string
  subcategoryToEdit?: { id: number; name: string }
  trigger?: React.ReactNode
}

export function SubcategoryModal({ categoryId, categoryName, subcategoryToEdit, trigger }: SubcategoryModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subcategoryToEdit?.name || "",
    },
  })

  const saveSubcategoryMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (subcategoryToEdit) {
        const response = await apiClient.put(`/inventory/subcategories/${subcategoryToEdit.id}/`, values)
        return response.data
      } else {
        const response = await apiClient.post('/inventory/subcategories/', {
          ...values,
          category: categoryId
        })
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      setIsOpen(false)
      if (!subcategoryToEdit) {
        form.reset()
      }
    },
    onError: (error) => {
      console.error("Error al guardar subcategoría:", error)
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await saveSubcategoryMutation.mutateAsync(values)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open && !subcategoryToEdit) {
      form.reset()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button className="flex items-center justify-center w-full py-3 border-2 border-dashed border-white/50 text-restaurante-primario font-semibold rounded-2xl bg-white/10 hover:bg-white/30 hover:border-restaurante-primario/50 transition-all">
            <Plus className="mr-2 h-4 w-4" /> Nueva Subcategoría
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/15 rounded-3xl sm:max-w-[440px] p-7 gap-0">
        <DialogHeader className="border-b border-gray-100 pb-5 mb-6">
          <DialogTitle className="text-2xl font-bold text-restaurante-oscuro tracking-tight drop-shadow-sm">
            {subcategoryToEdit ? (
              "Editar Subcategoría"
            ) : (
              <>Nueva Subcategoría en <span className="text-restaurante-acento bg-clip-text bg-linear-to-r from-restaurante-primario to-restaurante-acento">{categoryName}</span></>
            )}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1.5">
            {subcategoryToEdit ? "Modifica los detalles de la subcategoría." : "Añade un nuevo grupo de platillos."}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-restaurante-oscuro/90">Nombre de la subcategoría</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej. Platos Principales, Sopas..." 
                      disabled={saveSubcategoryMutation.isPending} 
                      className="h-11 px-4 bg-white/60 border border-gray-200/70 rounded-xl text-base transition-all duration-200 focus:bg-white focus:border-restaurante-acento focus:ring-2 focus:ring-restaurante-acento/15 disabled:cursor-not-allowed disabled:opacity-60"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 pt-1" />
                </FormItem>
              )}
            />

            <div className="pt-6 flex justify-end">
              <LoadingButton 
                type="submit" 
                isLoading={saveSubcategoryMutation.isPending}
                loadingText={subcategoryToEdit ? "Guardando..." : "Creando..."}
                className="w-full sm:w-auto h-11 px-7 bg-linear-to-r from-restaurante-primario to-restaurante-acento hover:from-restaurante-oscuro hover:to-restaurante-primario text-white text-base font-semibold rounded-xl transition-all duration-300 shadow-md shadow-restaurante-primario/30 hover:shadow-lg hover:shadow-restaurante-oscuro/35 hover:scale-[1.02] active:scale-[0.98]"
              >
                {subcategoryToEdit ? "Guardar Cambios" : "Crear Subcategoría"}
              </LoadingButton>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
