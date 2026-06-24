import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ExchangeRateResponse } from "../types/cashier";

/**
 * Tasa de cambio de respaldo hardcodeada.
 * Se usa cuando el endpoint del backend aún no está implementado.
 * Una vez que el backend implemente GET /cashier/exchange-rate/,
 * este valor se ignorará automáticamente y se usará el dato real.
 */
const FALLBACK_RATE = 7.52;

/**
 * Hook para obtener la tasa de cambio USD → BOB desde el backend.
 *
 * - Si el endpoint /cashier/exchange-rate/ existe → usa el valor real
 * - Si el endpoint no existe aún → usa FALLBACK_RATE silenciosamente (sin error)
 *
 * La tasa se refresca cada 30 minutos para mantener datos actualizados.
 */
export function useExchangeRate(): number {
  const { data } = useQuery<ExchangeRateResponse>({
    queryKey: ["exchangeRate"],
    queryFn: async () => {
      const response = await apiClient.get("/cashier/exchange-rate/");
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // Refrescar cada 30 minutos
    retry: false,               // Si el endpoint no existe, no reintentar
  });

  // Retorna la tasa del backend si existe, sino el fallback
  return data?.USD_TO_BOB ?? FALLBACK_RATE;
}
