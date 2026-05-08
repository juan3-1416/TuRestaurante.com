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

// Esquema de validación para el nuevo platillo/variante
const formSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  price: z.coerce.number().min(0.1, { message: "El precio debe ser mayor a 0." }),
  status: z.enum(["Disponible", "Agotado"]),
})

export function VariantModal({ subcategoryName }: { subcategoryName: string }) {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      price: 0,
      status: "Disponible",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(`Guardando variante en ${subcategoryName}:`, values)
      
      // Simulamos la petición POST al backend
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Cerramos el modal y limpiamos el formulario si fue exitoso
      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error al guardar:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Botón que dispara el modal con una pequeña transición al pasar el mouse */}
      <DialogTrigger asChild>
        <button className="text-[11px] font-bold text-restaurante-primario hover:underline flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95">
          <Plus size={13} /> Añadir Variante
        </button>
      </DialogTrigger>

      {/* Contenedor del Modal con un efecto de Glassmorphism más profundo y bordes redondeados */}
      <DialogContent className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/15 rounded-3xl sm:max-w-[440px] p-7 gap-0">
        <DialogHeader className="border-b border-gray-100 pb-5 mb-6">
          <DialogTitle className="text-2xl font-bold text-restaurante-oscuro tracking-tight drop-shadow-sm">
            Nueva variante en <span className="text-restaurante-acento bg-clip-text bg-linear-to-r from-restaurante-primario to-restaurante-acento">{subcategoryName}</span>
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1.5">Completa los datos del nuevo platillo o bebida.</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Campo: Nombre con estilos refinados */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-restaurante-oscuro/90">Nombre de la variante</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nombre del producto" 
                      disabled={isSubmitting} 
                      className="h-11 px-4 bg-white/60 border border-gray-200/70 rounded-xl text-base transition-all duration-200 focus:bg-white focus:border-restaurante-acento focus:ring-2 focus:ring-restaurante-acento/15 disabled:cursor-not-allowed disabled:opacity-60"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 pt-1" />
                </FormItem>
              )}
            />

            {/* Campo: Precio con estilos refinados y tipo número */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-restaurante-oscuro/90">Precio (Bs.)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.10"
                      disabled={isSubmitting} 
                      className="h-11 px-4 bg-white/60 border border-gray-200/70 rounded-xl text-base font-mono transition-all duration-200 focus:bg-white focus:border-restaurante-acento focus:ring-2 focus:ring-restaurante-acento/15 disabled:cursor-not-allowed disabled:opacity-60"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 pt-1" />
                </FormItem>
              )}
            />

            {/* Campo: Estado con estilos refinados y select nativo */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-restaurante-oscuro/90">Disponibilidad inicial</FormLabel>
                  <FormControl>
                    <select 
                      disabled={isSubmitting}
                      className="flex h-11 w-full rounded-xl border border-gray-200/70 bg-white/60 px-4 py-2 text-base transition-all duration-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-restaurante-acento/15 focus-visible:border-restaurante-acento focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      {...field}
                    >
                      <option value="Disponible" className="text-green-700">Disponible</option>
                      <option value="Agotado" className="text-red-700">Agotado</option>
                    </select>
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 pt-1" />
                </FormItem>
              )}
            />

            {/* Botón de envío usando nuestra protección de estados y un degradado suave */}
            <div className="pt-6 flex justify-end">
              <LoadingButton 
                type="submit" 
                isLoading={isSubmitting}
                loadingText="Guardando..."
                className="w-full sm:w-auto h-11 px-7 bg-linear-to-r from-restaurante-primario to-restaurante-acento hover:from-restaurante-oscuro hover:to-restaurante-primario text-white text-base font-semibold rounded-xl transition-all duration-300 shadow-md shadow-restaurante-primario/30 hover:shadow-lg hover:shadow-restaurante-oscuro/35 hover:scale-[1.02] active:scale-[0.98]"
              >
                Guardar Variante
              </LoadingButton>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}