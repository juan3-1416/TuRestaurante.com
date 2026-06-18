"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowDownRight } from "lucide-react"

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
import { usePosStore } from "@/store/posStore"

const expenseSchema = z.object({
  reason: z.string().min(3, { message: "La razón debe tener al menos 3 caracteres." }),
  amount: z.number().min(0.1, { message: "El monto debe ser mayor a 0." }),
  description: z.string().optional(),
})

interface ExpenseModalProps {
  cashierName: string
}

export function ExpenseModal({ cashierName }: ExpenseModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const addTransaction = usePosStore((state) => state.addTransaction)

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
      // Simulación de delay de red para el botón de carga
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Combinamos la razón y la descripción opcional de manera limpia
      const finalDescription = values.description?.trim() 
        ? `${values.reason} (${values.description})` 
        : values.reason

      // Registramos el egreso en el store global
      addTransaction({
        type: "expense",
        description: finalDescription,
        amount: values.amount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        method: "Efectivo", // Los gastos menores de caja chica suelen ser en efectivo
        cashierName: cashierName
      })

      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error al registrar gasto:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex-1 md:flex-none bg-white/60 hover:bg-white text-red-500 border border-red-200 rounded-xl h-12 px-5 font-bold transition-all hover:-translate-y-1 flex items-center justify-center gap-2 shadow-sm cursor-pointer">
          <ArrowDownRight size={18} /> Registrar Gasto
        </button>
      </DialogTrigger>

      <DialogContent className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl sm:max-w-[425px] max-h-[95vh] overflow-hidden p-6">
        <DialogHeader className="border-b border-gray-100 pb-3 mb-3">
          <DialogTitle className="text-xl font-black text-restaurante-oscuro tracking-tight flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-red-500/10 text-red-500">
              <ArrowDownRight size={18} />
            </div>
            Salida de Dinero
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-0.5">Registra un gasto o pago a proveedor desde la caja chica.</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Razón / Concepto</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isSubmitting} 
                      className="h-11 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm transition-all focus:border-red-500 focus:ring-red-500/20 font-semibold"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] text-red-600 font-semibold" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Monto de Salida</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-red-500">Bs.</span>
                      <Input 
                        type="number" 
                        step="0.10"
                        disabled={isSubmitting} 
                        className="h-11 pl-12 pr-4 bg-red-50 border-2 border-red-100 rounded-xl text-lg font-black font-mono transition-all focus:border-red-500 focus:ring-red-500/20 text-red-600"
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px] text-red-600 font-semibold" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Descripción <span className="text-[10px] text-gray-400 font-bold">(Opcional)</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Detalles adicionales del movimiento" 
                      disabled={isSubmitting} 
                      className="h-11 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm transition-all focus:border-red-500 focus:ring-red-500/20 font-semibold"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] text-red-600 font-semibold" />
                </FormItem>
              )}
            />

            <div className="pt-2 flex gap-3 justify-end">
              <LoadingButton 
                type="submit" 
                isLoading={isSubmitting}
                loadingText="Registrando..."
                className="w-full bg-red-500 hover:bg-red-600 text-white font-black h-12 rounded-xl shadow-lg shadow-red-500/25 transition-all text-[15px]"
              >
                Confirmar Gasto
              </LoadingButton>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}