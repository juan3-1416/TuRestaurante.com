"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { UserCog } from "lucide-react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { Empleado } from "../hooks/useUsuarios"

// La contraseña es opcional al editar. Si se deja en blanco, el backend sabrá que no debe cambiarla.
const editUserSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  username: z.string()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .regex(/^\S+$/, "El nombre de usuario no puede contener espacios."),
  password: z.string().optional(),
  role: z.enum(["Admin", "Cajero", "Mesero"], { error: "Debes seleccionar un rol." }),
  address: z.string().optional(),
  accountNumber: z.string().optional(),
})

export type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  userToEdit: Empleado | null;
  isOpen: boolean;
  onClose: () => void;
  onUserEdited: (id: string, values: EditUserFormValues) => void;
}

export function EditUserModal({ userToEdit, isOpen, onClose, onUserEdited }: EditUserModalProps) {
  
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      role: "Cajero",
      address: "",
      accountNumber: "",
    },
  })

  // Precargar los datos cuando el modal se abre con un usuario seleccionado
  useEffect(() => {
    if (userToEdit && isOpen) {
      form.reset({
        name: userToEdit.name,
        username: userToEdit.username,
        password: "", // Lo dejamos en blanco por seguridad
        role: userToEdit.role,
        accountNumber: userToEdit.accountNumber !== "N/A" ? userToEdit.accountNumber : "",
        address: userToEdit.address || "",
      })
    }
  }, [userToEdit, isOpen, form])

  const { isSubmitting } = form.formState

  async function onSubmit(values: EditUserFormValues) {
    if (!userToEdit) return;
    
    try {
      // Simulación de conexión a la API (PUT / PATCH)
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      onUserEdited(userToEdit.id, values) 
      onClose()
    } catch (error) {
      console.error("Error al editar usuario:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white/95 backdrop-blur-2xl border-white/60 shadow-2xl rounded-[2rem] sm:max-w-[550px] p-8">
        <DialogHeader className="mb-4 border-b border-gray-100 pb-4">
          <DialogTitle className="text-2xl font-black text-restaurante-oscuro flex items-center gap-2 tracking-tight">
            <div className="p-2 rounded-xl bg-restaurante-primario/10 text-restaurante-primario">
              <UserCog size={24} />
            </div>
            Editar Usuario
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Modifica la información o resetea la contraseña de {userToEdit?.name}.
          </p>
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
                    <Input className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
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
                      <Input className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
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
                    <FormLabel className="font-bold text-gray-700">Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
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
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <LoadingButton 
                type="submit" 
                isLoading={isSubmitting}
                loadingText="Guardando..."
                className="bg-restaurante-primario hover:bg-restaurante-oscuro text-white px-8 py-2.5 rounded-xl font-bold shadow-md shadow-restaurante-primario/20 transition-all"
              >
                Guardar Cambios
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}