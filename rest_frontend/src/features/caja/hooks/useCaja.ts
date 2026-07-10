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

  // Cálculos Financieros Generales - Calculados dinámicamente en el frontend
  const income = transactions.reduce((acc: number, t: any) => t.transaction_type === 'income' ? acc + Number(t.amount) : acc, 0);
  const expenses = transactions.reduce((acc: number, t: any) => t.transaction_type === 'expense' ? acc + Number(t.amount) : acc, 0);
  const currentTotal = shiftInitialBalance + income - expenses;
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

    const newReceipt: ReceiptData = {
      tableNumber: selectedTableForPayment.number,
      cashierName: cashierName,
      method: paymentMethod,
      items: groupedOrders,
      total: tableTotalBs,
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      currency: paymentCurrency,
      exchangeRate: exchangeRate,
      amountReceived: Number(amountReceived) || 0,
      changeBs: changeBs
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

      await apiClient.post(`/orders/orders/${orderId}/pay/`, {
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

      setSelectedTableForPayment(null)
      setIsProcessingPayment(false)
      setReceiptData(newReceipt)

    } catch (error: any) {
      console.error("Error al procesar el cobro:", error);
      alert(error.response?.data?.error || "Error al procesar el cobro. Asegúrate de tener un turno abierto.");
      setIsProcessingPayment(false);
    }
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
