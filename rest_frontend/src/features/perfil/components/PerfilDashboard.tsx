"use client"

import { UserCircle, ShieldCheck, KeyRound, MapPin, CreditCard, Phone } from "lucide-react"
import { usePerfil } from "../hooks/usePerfil"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/shared/components/LoadingButton"

export function PerfilDashboard() {
  // Extraemos toda la magia desde el Hook
  const { user, form, isSubmitting, isSuccess, onSubmit } = usePerfil()

  // Si no hay usuario cargado en el Store global, mostramos un fallback
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 font-bold">
        Cargando información del perfil...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-5xl mx-auto">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-restaurante-oscuro tracking-tight drop-shadow-sm flex items-center gap-3">
            <div className="p-3 bg-restaurante-primario/10 text-restaurante-primario rounded-2xl">
              <UserCircle size={28} />
            </div>
            Mi Perfil
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tarjeta 1: Información del Usuario (Lado Izquierdo) */}
        <div className="lg:col-span-1 bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl shadow-gray-200/50 rounded-[2rem] p-6 h-fit">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-linear-to-tr from-restaurante-primario to-restaurante-acento rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-restaurante-primario/30 transform rotate-3 hover:rotate-0 transition-transform">
              <span className="text-3xl font-black text-white drop-shadow-md">
                {user.first_name ? user.first_name.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
            <div className="pt-1">
              <h2 className="text-xl font-black text-restaurante-oscuro tracking-tight">{user.first_name} {user.last_name}</h2>
              <p className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg inline-block mt-1 border border-gray-200 shadow-inner">
                @{user.username}
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-restaurante-primario/10 text-restaurante-primario text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={14} /> {user.role === "ADMIN" ? "Administrador" : user.role === "CASHIER" ? "Cajero" : "Mesero"}
            </span>
          </div>

          <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 p-2 rounded-xl border border-white shadow-sm hover:bg-white transition-colors">
              <div className="p-1.5 bg-gray-100 rounded-lg shrink-0"><Phone size={16} className="text-gray-500" /></div>
              <span className="font-medium wrap-break-word leading-tight">{user.phone_number || "Teléfono no registrado"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 p-2 rounded-xl border border-white shadow-sm hover:bg-white transition-colors">
              <div className="p-1.5 bg-gray-100 rounded-lg shrink-0"><MapPin size={16} className="text-gray-500" /></div>
              <span className="font-medium wrap-break-word leading-tight">{user.address || "Dirección no registrada"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 p-2 rounded-xl border border-white shadow-sm hover:bg-white transition-colors">
              <div className="p-1.5 bg-gray-100 rounded-lg shrink-0"><CreditCard size={16} className="text-gray-500" /></div>
              <span className="font-medium font-mono tracking-wider">{user.bank_account_number || "Sin cuenta bancaria"}</span>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Formulario de Seguridad (Lado Derecho) */}
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl shadow-gray-200/50 rounded-[2rem] p-6">
          <h3 className="text-xl font-black text-restaurante-oscuro flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2 bg-gray-100 rounded-xl text-gray-600">
              <KeyRound size={20} />
            </div>
            Cambiar Contraseña
          </h3>

          {isSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
              <ShieldCheck size={18} />
              Tu contraseña ha sido actualizada correctamente.
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-1">
                      <FormLabel className="font-bold text-gray-700 m-0">Contraseña Actual</FormLabel>
                      <button 
                        type="button" 
                        onClick={() => alert("Contactar con soporte o implementar flujo de recuperación alternativo.")} 
                        className="text-xs font-bold text-restaurante-primario hover:underline hover:text-restaurante-oscuro transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Ingresa tu contraseña actual" 
                        className="bg-white/60 h-11 rounded-xl focus:bg-white transition-all border-gray-200" 
                        disabled={isSubmitting} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-semibold" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Mínimo 5 caracteres" 
                          className="bg-white/60 h-11 rounded-xl focus:bg-white transition-all border-gray-200" 
                          disabled={isSubmitting} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 font-semibold" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">Confirmar Contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Repite la nueva contraseña" 
                          className="bg-white/60 h-11 rounded-xl focus:bg-white transition-all border-gray-200" 
                          disabled={isSubmitting} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 font-semibold" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 flex justify-end border-t border-gray-100">
                <LoadingButton 
                  type="submit" 
                  isLoading={isSubmitting}
                  loadingText="Actualizando..."
                  className="bg-restaurante-primario hover:bg-restaurante-oscuro text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-restaurante-primario/30 transition-all w-full sm:w-auto hover:-translate-y-1"
                >
                  <KeyRound className="mr-2" size={18} /> Actualizar Contraseña
                </LoadingButton>
              </div>
            </form>
          </Form>
        </div>
        
      </div>
    </div>
  )
}