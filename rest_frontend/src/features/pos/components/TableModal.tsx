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

// Esquema de validación para la mesa
const formSchema = z.object({
  number: z.string().min(1, { message: "El número de mesa es requerido." }),
  capacity: z.string().min(1, { message: "La capacidad es requerida." }),
})

interface TableModalProps {
  onTableCreated?: () => void
  tableToEdit?: { id: string; number: number; capacity: number }
  trigger?: React.ReactNode
}

export function TableModal({ onTableCreated, tableToEdit, trigger }: TableModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: tableToEdit?.number?.toString() || "1",
      capacity: tableToEdit?.capacity?.toString() || "2",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        number: parseInt(values.number) || 1,
        capacity: parseInt(values.capacity) || 1
      }
      
      if (tableToEdit) {
        console.log("Actualizando mesa:", payload)
        await apiClient.put(`/tables/tables/${tableToEdit.id}/`, payload)
      } else {
        console.log("Guardando nueva mesa:", payload)
        await apiClient.post('/tables/tables/', payload)
      }
      
      setIsOpen(false)
      if (!tableToEdit) {
        form.reset()
      }

      if (onTableCreated) {
        onTableCreated()
      }
    } catch (error) {
      console.error("Error al guardar:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button className="flex items-center bg-restaurante-primario hover:bg-restaurante-acento text-white rounded-2xl px-6 py-2 transition-colors font-medium">
            <Plus className="mr-2 h-4 w-4" /> Agregar Mesa
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/15 rounded-3xl sm:max-w-[440px] p-7 gap-0">
        <DialogHeader className="border-b border-gray-100 pb-5 mb-6">
          <DialogTitle className="text-2xl font-bold text-restaurante-oscuro tracking-tight drop-shadow-sm">
            {tableToEdit ? "Editar Mesa" : "Nueva Mesa"}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1.5">
            {tableToEdit ? "Modifica los detalles de la mesa." : "Añade una nueva mesa al restaurante."}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-restaurante-oscuro/90">Número de Mesa</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Ej. 1, 2, 3..." 
                      disabled={isSubmitting} 
                      className="h-11 px-4 bg-white/60 border border-gray-200/70 rounded-xl text-base transition-all duration-200 focus:bg-white focus:border-restaurante-acento focus:ring-2 focus:ring-restaurante-acento/15 disabled:cursor-not-allowed disabled:opacity-60"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 pt-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-restaurante-oscuro/90">Capacidad (Personas)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Ej. 2, 4, 6..." 
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
                loadingText={tableToEdit ? "Guardando..." : "Creando..."}
                className="w-full sm:w-auto h-11 px-7 bg-linear-to-r from-restaurante-primario to-restaurante-acento hover:from-restaurante-oscuro hover:to-restaurante-primario text-white text-base font-semibold rounded-xl transition-all duration-300 shadow-md shadow-restaurante-primario/30 hover:shadow-lg hover:shadow-restaurante-oscuro/35 hover:scale-[1.02] active:scale-[0.98]"
              >
                {tableToEdit ? "Guardar Cambios" : "Agregar Mesa"}
              </LoadingButton>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
