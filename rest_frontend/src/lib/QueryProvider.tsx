"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Inicializamos el cliente dentro de un estado para evitar
  // que se comparta información entre usuarios si se usa SSR (Server-Side Rendering)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Los datos se consideran frescos por 1 minuto
            refetchOnWindowFocus: false, // Evita recargar datos solo por cambiar de pestaña
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}