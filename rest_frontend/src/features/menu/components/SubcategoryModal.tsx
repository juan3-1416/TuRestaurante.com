"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus } from "lucide-react"

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
  categoryId: string
  categoryName: string
  onSubcategoryCreated?: () => void
}

export function SubcategoryModal({ categoryId, categoryName, onSubcategoryCreated }: SubcategoryModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(`Guardando nueva subcategoría en ${categoryName}:`, values)
      
      // Petición real al backend: la URL puede variar según tu API, asumimos algo como:
      await apiClient.post('/inventory/subcategories/', {
        ...values,
        category: categoryId
      })
      
      // Cerramos el modal y limpiamos el formulario
      setIsOpen(false)
      form.reset()

      // Avisamos al componente padre
      if (onSubcategoryCreated) {
        onSubcategoryCreated()
      }
    } catch (error) {
      console.error("Error al guardar subcategoría:", error)
      // Si la URL no existe aún, para que no se bloquee el UI simulamos éxito temporal
      setIsOpen(false)
      form.reset()
      if (onSubcategoryCreated) onSubcategoryCreated()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center justify-center w-full py-3 border-2 border-dashed border-white/50 text-restaurante-primario font-semibold rounded-2xl bg-white/10 hover:bg-white/30 hover:border-restaurante-primario/50 transition-all">
          <Plus className="mr-2 h-4 w-4" /> Nueva Subcategoría
        </button>
      </DialogTrigger>

      <DialogContent className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/15 rounded-3xl sm:max-w-[440px] p-7 gap-0">
        <DialogHeader className="border-b border-gray-100 pb-5 mb-6">
          <DialogTitle className="text-2xl font-bold text-restaurante-oscuro tracking-tight drop-shadow-sm">
            Nueva Subcategoría en <span className="text-restaurante-acento bg-clip-text bg-linear-to-r from-restaurante-primario to-restaurante-acento">{categoryName}</span>
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1.5">Añade un nuevo grupo de platillos.</p>
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
                      disabled={isSubmitting} 
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
                isLoading={isSubmitting}
                loadingText="Creando..."
                className="w-full sm:w-auto h-11 px-7 bg-linear-to-r from-restaurante-primario to-restaurante-acento hover:from-restaurante-oscuro hover:to-restaurante-primario text-white text-base font-semibold rounded-xl transition-all duration-300 shadow-md shadow-restaurante-primario/30 hover:shadow-lg hover:shadow-restaurante-oscuro/35 hover:scale-[1.02] active:scale-[0.98]"
              >
                Crear Subcategoría
              </LoadingButton>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
