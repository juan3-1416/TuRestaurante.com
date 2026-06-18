"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Unlock, Wallet, Coins } from "lucide-react"

import {
  Dialog, DialogContent, DialogTitle, DialogTrigger,
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
      
      <DialogContent className="bg-white/90 backdrop-blur-2xl border-white/60 shadow-2xl rounded-[2rem] sm:max-w-[420px] p-0 overflow-hidden">
        
        {/* Header con diseño premium y Glassmorphism */}
        <div className="bg-linear-to-br from-green-500/10 to-green-600/5 p-8 text-center relative border-b border-green-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -z-10 blur-2xl"></div>
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm border border-green-100 flex items-center justify-center text-green-600 mb-4 transform rotate-3 hover:rotate-0 transition-transform">
            <Wallet size={32} />
          </div>
          <DialogTitle className="text-2xl font-black text-restaurante-oscuro tracking-tight">
            Apertura de Caja
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2 font-medium px-4">
            Verifica el efectivo e ingresa el monto inicial para tu turno.
          </p>
        </div>

        <div className="p-8 pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="initialBalance"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <Coins size={16} className="text-green-500" /> Fondo Inicial (Efectivo)
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        {/* Indicador de Moneda Fijo */}
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">Bs.</span>
                        <Input 
                          type="number" 
                          step="0.10"
                          disabled={isSubmitting} 
                          className="h-16 pl-14 pr-5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-3xl font-black text-restaurante-oscuro transition-all focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 hover:border-gray-200"
                          {...field} 
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          onFocus={(e) => e.target.select()} // Selecciona el "0" al hacer click
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs font-semibold text-red-500" />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <LoadingButton 
                  type="submit" 
                  isLoading={isSubmitting}
                  loadingText="Iniciando turno..."
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-black text-lg h-14 rounded-2xl shadow-lg shadow-green-500/25 transition-all hover:-translate-y-1"
                >
                  <Unlock className="mr-2" size={20} /> Iniciar Turno
                </LoadingButton>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}