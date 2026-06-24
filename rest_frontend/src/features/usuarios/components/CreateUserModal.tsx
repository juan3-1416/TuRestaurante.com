"use client"

import { UserPlus } from "lucide-react"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/shared/components/LoadingButton"
import { useCreateUser, CreateUserFormValues } from "../hooks/useCreateUser"

export type { CreateUserFormValues }

export function CreateUserModal() {
  const {
    isOpen,
    setIsOpen,
    form,
    onSubmit,
    handleOpenChange,
    isSubmitting
  } = useCreateUser()

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="bg-restaurante-primario hover:bg-restaurante-oscuro text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-restaurante-primario/30 transition-all hover:-translate-y-1 flex items-center gap-2">
          <UserPlus size={20} /> Nuevo Usuario
        </button>
      </DialogTrigger>

      <DialogContent className="bg-white/95 backdrop-blur-2xl border-white/60 shadow-2xl rounded-[2rem] sm:max-w-[550px] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Nombre(s)</FormLabel>
                    <FormControl>
                      <Input className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}/>
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Apellidos <span className="text-gray-400 font-normal">(Opcional)</span></FormLabel>
                    <FormControl>
                      <Input className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}/>
            </div>

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
                )}/>
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
                )}/> 
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Correo Electrónico <span className="text-gray-400 font-normal">(Opcional)</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="correo@ejemplo.com" className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}/>
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
                        onChange={field.onChange}>
                        <option value="ADMIN">Administrador</option>
                        <option value="CASHIER">Cajero</option>
                        <option value="WAITER">Mesero</option>
                      </select>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}/>
              <FormField
                control={form.control}
                name="bank_account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Nº de Cuenta <span className="text-gray-400 font-normal">(Opcional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Para pagos de sueldo" className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                )}/>
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Teléfono <span className="text-gray-400 font-normal">(Opcional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Número telefónico" className="bg-gray-50/50 h-11 rounded-xl focus:bg-white" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}/>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
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