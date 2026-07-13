"use client"

import React, { useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { useEmployeeShift } from "@/features/turnos/hooks/useEmployeeShift"
import { PlayCircle, Loader2 } from "lucide-react"

interface RequireShiftProps {
  children: React.ReactNode
}

export function RequireShift({ children }: RequireShiftProps) {
  const { user } = useAuthStore()
  const { activeShift, isLoading, startShift } = useEmployeeShift()
  const [isStarting, setIsStarting] = useState(false)

  // El ADMIN está exento de iniciar turno para operar.
  if (user?.role === "ADMIN") {
    return <>{children}</>
  }

  // Prevenir parpadeo durante la carga inicial del turno
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-restaurante-acento mb-4" />
        <p className="text-gray-500 font-medium">Verificando turno...</p>
      </div>
    )
  }

  // Si no tiene turno activo, bloqueamos la pantalla
  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-4">
        <div className="bg-white/80 backdrop-blur-3xl border border-white/60 p-10 sm:p-14 rounded-[3rem] shadow-2xl text-center max-w-lg w-full relative overflow-hidden">
          {/* Decoración */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-restaurante-primario/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-restaurante-acento/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="w-24 h-24 bg-linear-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100/50">
              <PlayCircle className="text-blue-500 w-12 h-12" />
            </div>
            
            <h1 className="text-3xl font-black text-restaurante-oscuro mb-3 tracking-tight">
              Turno Cerrado
            </h1>
            
            <p className="text-gray-500 mb-8 font-medium leading-relaxed">
              Debes registrar tu inicio de turno para poder acceder a los módulos de operación y atención.
            </p>
            
            <button
              onClick={async () => {
                setIsStarting(true)
                try {
                  await startShift.mutateAsync()
                } finally {
                  setIsStarting(false)
                }
              }}
              disabled={isStarting}
              className="w-full h-14 bg-linear-to-r from-restaurante-primario to-restaurante-acento hover:from-restaurante-oscuro hover:to-restaurante-primario text-white rounded-2xl font-bold text-lg shadow-lg shadow-restaurante-primario/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Abriendo Turno...
                </>
              ) : (
                "Iniciar Mi Turno"
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Si tiene turno activo, mostramos los children (el módulo de trabajo normal)
  return <>{children}</>
}
