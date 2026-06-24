import { useState } from "react"
import { Table } from "@/store/posStore"
import { useTables } from "@/features/pos/hooks/useTables"
import { useShift } from "./useShift"
import { useExchangeRate } from "./useExchangeRate"
import { useAuthStore } from "@/store/authStore"
import { ReceiptData } from "../components/ReceiptModal"
import { apiClient } from "@/lib/axios"

export function useCaja() {
  const user = useAuthStore((state) => state.user)
  const cashierName = user?.first_name || user?.username || "Cajero Principal"

  // Tasa de cambio dinámica desde el backend (con fallback a 7.52)
  const exchangeRate = useExchangeRate()

  const { tables, refetch: refetchTables } = useTables()
  const { shift, isShiftOpen, refetch: refetchShift } = useShift()

  const shiftInitialBalance = shift ? Number(shift.initial_balance) : 0
  const transactions = shift?.transactions || []

  // Estados del Modal Principal y Recibo
  const [selectedTableForPayment, setSelectedTableForPayment] = useState<Table | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  // Estados interactivos para el Modal de Cobro
  const [paymentMethod, setPaymentMethod] = useState<"Efectivo" | "QR" | "Tarjeta">("Efectivo")
  const [paymentCurrency, setPaymentCurrency] = useState<"Bs" | "USD">("Bs")
  const [amountReceived, setAmountReceived] = useState<number | "">("")

  // Cálculos Financieros Generales - Consumiendo API
  // Nota: el backend devuelve "total_expense" (sin 's') y no tiene "current_balance"
  const income = shift ? Number(shift.total_income || 0) : 0;
  const expenses = shift ? Number(shift.total_expense || 0) : 0;  // OJO: total_expense (sin 's')
  const currentTotal = shiftInitialBalance + income - expenses;    // Calculado en frontend (final_balance es null mientras está abierto)
  const pendingTables = tables.filter(t => t.status === "Ocupada" && (t.currentTotal || 0) > 0)

  // Cálculos Específicos del Modal de Cobro
  const tableTotalBs = selectedTableForPayment?.currentTotal || 0;
  const tableTotalUSD = tableTotalBs / exchangeRate;

  const changeBs = paymentMethod === "Efectivo"
    ? (paymentCurrency === "Bs"
      ? (Number(amountReceived) || 0) - tableTotalBs
      : ((Number(amountReceived) || 0) * exchangeRate) - tableTotalBs)
    : 0;

  const handleOpenPaymentModal = (table: Table) => {
    setSelectedTableForPayment(table);
    setPaymentMethod("Efectivo");
    setPaymentCurrency("Bs");
    setAmountReceived("");
  }

  const handleConfirmPayment = async () => {
    if (!selectedTableForPayment) return

    if (paymentMethod === "Efectivo" && changeBs < 0) {
      alert("El monto recibido es menor al total a pagar.");
      return;
    }

    setIsProcessingPayment(true)

    const orderItems = selectedTableForPayment.orders || [];
    const groupedOrders = orderItems.reduce((acc, product) => {
      const existing = acc.find(item => item.name === product.name);
      if (existing) {
        existing.qty += 1;
        existing.subtotal += product.price;
      } else {
        acc.push({ name: product.name, qty: 1, subtotal: product.price });
      }
      return acc;
    }, [] as ReceiptData["items"]);

    const newReceipt = {
      tableNumber: selectedTableForPayment.number,
      cashierName: cashierName,
      method: paymentMethod,
      items: groupedOrders,
      total: tableTotalBs,
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    };

    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      // 1. Usar el ID real de la orden del backend para cobrar
      const orderId = selectedTableForPayment.activeOrderId;

      if (!orderId) {
        alert("No se encontró una orden activa para esta mesa. Verifica que se hayan enviado productos a cocina.");
        setIsProcessingPayment(false);
        return;
      }

      await apiClient.post(`/orders/${orderId}/pay/`, {
        payment_method: paymentMethod,
        // Campos preparados para cuando el backend los acepte (actualmente los ignora sin error):
        currency: paymentCurrency === "USD" ? "USD" : "BOB",
        exchange_rate: exchangeRate,
        amount_foreign: paymentCurrency === "USD" ? (Number(amountReceived) || null) : null,
      });

      // 2. Petición para liberar la mesa
      await apiClient.patch(`/tables/${selectedTableForPayment.id}/update_status/`, {
        status: "Libre"
      });

      // 3. (Refetch) Invalida caché de React Query para actualizar mesas y caja
      await Promise.all([refetchTables(), refetchShift()]);

    } catch (error) {
      console.error("Error al procesar el cobro:", error);
    }

    setSelectedTableForPayment(null)
    setIsProcessingPayment(false)
    setReceiptData(newReceipt)
  }

  return {
    cashierName,
    isShiftOpen,
    shiftInitialBalance,
    transactions,
    selectedTableForPayment,
    setSelectedTableForPayment,
    isProcessingPayment,
    receiptData,
    setReceiptData,
    paymentMethod,
    setPaymentMethod,
    paymentCurrency,
    setPaymentCurrency,
    amountReceived,
    setAmountReceived,
    income,
    expenses,
    currentTotal,
    pendingTables,
    tableTotalBs,
    tableTotalUSD,
    changeBs,
    exchangeRate,
    handleOpenPaymentModal,
    handleConfirmPayment
  }
}
