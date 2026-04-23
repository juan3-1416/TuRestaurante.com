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

// Esquema de validación para la nueva categoría
const formSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  icon: z.enum(["Utensils", "Coffee", "Drumstick", "LayoutGrid"]),
})

interface CategoryModalProps {
  onCategoryCreated?: () => void
}

export function CategoryModal({ onCategoryCreated }: CategoryModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      icon: "Utensils",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log("Guardando nueva categoría:", values)
      
      // Petición real al backend
      await apiClient.post('/inventory/categories/', values)
      
      // Cerramos el modal y limpiamos el formulario si fue exitoso
      setIsOpen(false)
      form.reset()

      // Avisamos al componente padre que recargue las categorías
      if (onCategoryCreated) {
        onCategoryCreated()
      }
    } catch (error) {
      console.error("Error al guardar:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center bg-restaurante-primario hover:bg-restaurante-acento text-white rounded-2xl px-6 py-2 transition-colors font-medium">
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </button>
      </DialogTrigger>

      <DialogContent className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/15 rounded-3xl sm:max-w-[440px] p-7 gap-0">
        <DialogHeader className="border-b border-gray-100 pb-5 mb-6">
          <DialogTitle className="text-2xl font-bold text-restaurante-oscuro tracking-tight drop-shadow-sm">
            Nueva Categoría
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1.5">Añade una nueva sección a tu menú.</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Campo: Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-restaurante-oscuro/90">Nombre de la categoría</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej. Bebidas, Postres..." 
                      disabled={isSubmitting} 
                      className="h-11 px-4 bg-white/60 border border-gray-200/70 rounded-xl text-base transition-all duration-200 focus:bg-white focus:border-restaurante-acento focus:ring-2 focus:ring-restaurante-acento/15 disabled:cursor-not-allowed disabled:opacity-60"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 pt-1" />
                </FormItem>
              )}
            />

            {/* Campo: Icono */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-restaurante-oscuro/90">Icono representativo</FormLabel>
                  <FormControl>
                    <select 
                      disabled={isSubmitting}
                      className="flex h-11 w-full rounded-xl border border-gray-200/70 bg-white/60 px-4 py-2 text-base transition-all duration-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-restaurante-acento/15 focus-visible:border-restaurante-acento focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      {...field}
                    >
                      <option value="Utensils">Utensilios (Comida general)</option>
                      <option value="Coffee">Taza de Café (Bebidas/Desayunos)</option>
                      <option value="Drumstick">Pierna de Pollo (Carnes)</option>
                      <option value="LayoutGrid">Cuadrícula (Otros)</option>
                    </select>
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
                Crear Categoría
              </LoadingButton>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
