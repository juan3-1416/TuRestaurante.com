import { useState } from "react"

export function useReportes() {
  const [filtroTiempo, setFiltroTiempo] = useState("hoy")
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerarNuevoAnalisis = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  return {
    filtroTiempo,
    setFiltroTiempo,
    isLoading,
    handleGenerarNuevoAnalisis,
    metricas: {
      ingresosTotales: 15000,
      pedidosCompletados: 120,
      ticketPromedio: 125,
      tiempoPromedioAtencion: "45m"
    },
    topProductos: [
      { id: 1, nombre: "Plato A", cantidad: 50, ingreso: 2500 },
      { id: 2, nombre: "Plato B", cantidad: 30, ingreso: 1500 }
    ],
    aiInsights: [
      { tipo: "exito", mensaje: "Las ventas han aumentado un 15% esta semana." },
      { tipo: "sugerencia", mensaje: "Se recomienda promocionar el Plato B los martes." }
    ],
    graficoIngresos: [
      { etiqueta: "Lun", valor: 1000 },
      { etiqueta: "Mar", valor: 1500 },
      { etiqueta: "Mie", valor: 1200 }
    ],
    horasPico: [
      { hora: "12:00", valor: 50 },
      { hora: "13:00", valor: 80 }
    ]
  }
}
