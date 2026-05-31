"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Unlock } from "lucide-react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { usePosStore } from "@/store/posStore"

const openShiftSchema = z.object({
  initialBalance: z.number().min(0, { message: "El fondo no puede ser negativo." }),
})

export function OpenShiftModal() {
  const [isOpen, setIsOpen] = useState(false)
  const toggleShift = usePosStore((state) => state.toggleShift)

  const form = useForm<z.infer<typeof openShiftSchema>>({
    resolver: zodResolver(openShiftSchema),
    defaultValues: { initialBalance: 0 },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: z.infer<typeof openShiftSchema>) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      // Abrimos el turno pasándole el monto ingresado
      toggleShift(true, values.initialBalance)
      
      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error al abrir caja:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <LoadingButton
          className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-green-500/20 transition-all hover:-translate-y-1"
        >
          <Unlock className="mr-2" size={18} /> Abrir Caja
        </LoadingButton>
      </DialogTrigger>

      <DialogContent className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl sm:max-w-[400px] p-7">
        <DialogHeader className="border-b border-gray-100 pb-4 mb-4">
          <DialogTitle className="text-2xl font-black text-restaurante-oscuro tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-xl bg-green-500/10 text-green-600">
              <Unlock size={20} />
            </div>
            Apertura de Caja
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Ingresa el monto base (efectivo) con el que inicias el turno.</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold text-restaurante-oscuro/90">Fondo Inicial en Gaveta (Bs.)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.10"
                      disabled={isSubmitting} 
                      className="h-12 px-4 bg-white/60 border border-gray-200 rounded-xl text-lg font-mono font-bold transition-all focus:bg-white text-restaurante-primario"
                      {...field} 
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      onFocus={(e) => e.target.select()} // Selecciona el "0" al hacer click
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            <div className="pt-4 flex gap-3 justify-end">
              <LoadingButton 
                type="submit" 
                isLoading={isSubmitting}
                loadingText="Abriendo..."
                className="w-full bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold h-12 rounded-xl shadow-md shadow-green-500/10"
              >
                Confirmar y Abrir Turno
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}