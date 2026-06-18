"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { UserPlus } from "lucide-react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/shared/components/LoadingButton"
//import { Role } from "@/store/authStore"

// 1. Definimos las reglas estrictas de validación
const createUserSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  username: z.string()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .regex(/^\S+$/, "El nombre de usuario no puede contener espacios."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  role: z.enum(["Admin", "Cajero", "Mesero"], { error: "Debes seleccionar un rol." }),
  address: z.string().optional(),
  accountNumber: z.string().optional(),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  onUserCreated: (user: CreateUserFormValues) => void;
}

export function CreateUserModal({ onUserCreated }: CreateUserModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      role: "Cajero", // Por defecto será Cajero
      address: "",
      accountNumber: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: CreateUserFormValues) {
    try {
      // Simulación de conexión a la API
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      onUserCreated(values) // Enviamos los datos a la tabla principal
      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error al crear usuario:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) form.reset()
    }}>
      <DialogTrigger asChild>
        <button className="bg-restaurante-primario hover:bg-restaurante-oscuro text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-restaurante-primario/30 transition-all hover:-translate-y-1 flex items-center gap-2">
          <UserPlus size={20} /> Nuevo Usuario
        </button>
      </DialogTrigger>

      <DialogContent className="bg-white/95 backdrop-blur-2xl border-white/60 shadow-2xl rounded-[2rem] sm:max-w-[550px] p-8">
        <DialogHeader className="mb-4 border-b border-gray-100 pb-4">
          <DialogTitle className="text-2xl font-black text-restaurante-oscuro flex items-center gap-2 tracking-tight">
            <div className="p-2 rounded-xl bg-restaurante-primario/10 text-restaurante-primario">
              <UserPlus size={24} />
            </div>
            Crear Nuevo Acceso
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1 font-medium">Completa los datos para dar acceso a un nuevo empleado.</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-gray-700">Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Carlos Mendoza" className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Usuario (Login)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. carlos_m" className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Rol en el Sistema</FormLabel>
                    <FormControl>
                      <select 
                        disabled={isSubmitting}
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-restaurante-primario focus:bg-white disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="Admin">Administrador</option>
                        <option value="Cajero">Cajero</option>
                        <option value="Mesero">Mesero</option>
                      </select>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Nº de Cuenta <span className="text-gray-400 font-normal">(Opcional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Para pagos de sueldo" className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-gray-700">Dirección <span className="text-gray-400 font-normal">(Opcional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección de residencia" className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <LoadingButton 
                type="submit" 
                isLoading={isSubmitting}
                loadingText="Creando..."
                className="bg-restaurante-primario hover:bg-restaurante-oscuro text-white px-8 py-2.5 rounded-xl font-bold shadow-md shadow-restaurante-primario/20 transition-all"
              >
                Guardar Usuario
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}