# Plan: Sección de Reportes

## Lo que vamos a construir

Un dashboard de reportes administrativo, rico en datos visuales y completamente funcional, con datos reales del backend filtrados por período de tiempo.

---

## Contenido del Dashboard (Lo que se mostrará)

### Tarjetas de KPI Principales (Siempre visibles)
| Tarjeta | Descripción |
|---|---|
| **Ingresos Totales** | Suma de todas las órdenes pagadas en el período |
| **Tickets Generados** | Conteo total de órdenes creadas |
| **Ticket Promedio** | Ingreso total / tickets generados |
| **Mesas Atendidas** | Número de mesas únicas que estuvieron ocupadas |
| **Platillos Servidos** | Conteo total de items de órdenes pagadas |
| **Fugas Reportadas** | Cantidad de órdenes en estado "Cancelada" por fuga |

### Gráficos

| Gráfico | Tipo | Descripción |
|---|---|---|
| **Ingresos por Período** | Barras Verticales | Ingresos por hora (filtro=hoy) o por día (filtro=semana/mes) |
| **Horas Pico** | Barras Horizontales | Distribución de órdenes agrupadas por hora del día |
| **Top 10 Platillos** | Barras Horizontales | Los platillos más vendidos en cantidad y en ingreso |
| **Distribución de Métodos de Pago** | Donut/Pie | % de Efectivo vs QR vs Tarjeta |

### Sugerencias Adicionales Incluidas
- **Tabla de Turnos Resumida:** Resumen por empleado: nombre, ingresos generados, tickets atendidos, mesas atendidas. Útil para recursos humanos.

---

## Biblioteca de Gráficos: **Recharts** ✅

**¿Por qué Recharts?**
- La más usada en el ecosistema React/Next.js.
- Basada en SVG nativo, se ve nítida en cualquier pantalla.
- Altamente customizable.
- Liviana y tiene todos los tipos de gráficos que necesitamos.

---

## Lo que le falta al Backend (Para integración futura)

> [!IMPORTANT]
> Actualmente no existe ningún endpoint de reportes. El frontend se construirá con datos mock realistas idénticos en estructura a los que enviará el backend, para que la integración futura sea solo cambiar una función.

### Endpoints a solicitar al equipo de Backend

```
GET /api/reports/summary/?period=today|week|month|year
GET /api/reports/income-over-time/?period=...
GET /api/reports/top-products/?period=...
GET /api/reports/payment-methods/?period=...
GET /api/reports/peak-hours/?period=...
```

---

## Plan de Implementación (Frontend)

### Fase 1 — Instalación
- `npm install recharts`

### Fase 2 — Hook `useReportes.ts`
- Reescribir completamente con datos mock realistas para cada filtro (hoy/semana/mes/año).

### Fase 3 — Componentes de Gráficos (Nuevos)
- `KpiCard.tsx` — Tarjeta de métrica individual.
- `IngresosPorTiempoChart.tsx` — Gráfico de barras: ingresos por hora o por día.
- `HorasPicoChart.tsx` — Barras horizontales de tráfico por hora.
- `TopProductosChart.tsx` — Barras horizontales Top 10 platillos.
- `MetodosPagoChart.tsx` — Gráfico Donut de distribución de pagos.
- `ResumenEmpleadosTable.tsx` — Tabla resumen de empleados del período.

### Fase 4 — Rediseño `ReportesDashboard.tsx`
- Ensamblar todos los componentes.
- Filtro de período: **Hoy / Semana / Mes / Año**.
- Layout responsivo en 2 columnas para gráficos.

### Verificación
- `npx tsc --noEmit` sin errores.
- Revisar visualmente todos los gráficos.
- Confirmar que cambiar el filtro actualiza todos los datos.
