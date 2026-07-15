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

  const { tables, refetch: refetchTables, resolveWalkout } = useTables()
  const { shift, isShiftOpen, refetch: refetchShift, registerIncome } = useShift()

  const shiftInitialBalance = shift ? Number(shift.initial_balance) : 0
  const transactions = shift?.transactions || []

  // Estados del Modal Principal y Recibo
  const [selectedTableForPayment, setSelectedTableForPayment] = useState<Table | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [isWalkoutMode, setIsWalkoutMode] = useState(false)

  // Estados interactivos para el Modal de Cobro
  const [paymentMethod, setPaymentMethod] = useState<"Efectivo" | "QR" | "Tarjeta">("Efectivo")
  const [paymentCurrency, setPaymentCurrency] = useState<"Bs" | "USD">("Bs")
  const [amountReceived, setAmountReceived] = useState<number | "">("")

  // Cálculos Financieros Generales
  const income = transactions.reduce((acc: number, t: { transaction_type: string, amount: string | number }) => t.transaction_type === 'income' ? acc + Number(t.amount) : acc, 0);
  const expenses = transactions.reduce((acc: number, t: { transaction_type: string, amount: string | number }) => t.transaction_type === 'expense' ? acc + Number(t.amount) : acc, 0);
  const currentTotal = shiftInitialBalance + income - expenses;
  const pendingTables = tables.filter(t => t.status === "Ocupada" && (t.currentTotal || 0) > 0)
  const observedTables = tables.filter(t => t.status === "Observada")

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
    setIsWalkoutMode(false);
    setPaymentMethod("Efectivo");
    setPaymentCurrency("Bs");
    setAmountReceived("");
  }

  const handleOpenWalkoutModal = (table: Table) => {
    setSelectedTableForPayment(table);
    setIsWalkoutMode(true);
    setPaymentMethod("Efectivo");
    setPaymentCurrency("Bs");
    setAmountReceived("");
  }

  const handleResolveWalkout = async () => {
    if (!selectedTableForPayment) return
    setIsProcessingPayment(true)
    try {
      await resolveWalkout.mutateAsync(selectedTableForPayment.id)
      
      // Registrar la fuga como un ingreso esperado que no se recibió (así suma al Total Esperado)
      try {
        const obsText = selectedTableForPayment.observationNote ? ` (${selectedTableForPayment.observationNote})` : ""
        await registerIncome.mutateAsync({
          amount: tableTotalBs,
          description: `Fuga - Mesa ${selectedTableForPayment.number}${obsText}`
        })
      } catch (incomeError) {
        console.warn("Backend no soporta registro manual de ingresos para la fuga.", incomeError)
      }

      await Promise.all([refetchTables(), refetchShift()])
      setSelectedTableForPayment(null)
      setIsWalkoutMode(false)
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || "Error al resolver la fuga.")
    }
    setIsProcessingPayment(false)
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

    const orderIds: (number | string)[] = 
      selectedTableForPayment.activeOrderIds && selectedTableForPayment.activeOrderIds.length > 0
        ? selectedTableForPayment.activeOrderIds
        : selectedTableForPayment.activeOrderId
          ? [selectedTableForPayment.activeOrderId]
          : [];

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
      changeBs: changeBs,
      orderIds: orderIds
    };

    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      // Opción A: Pagar TODAS las órdenes activas de la mesa en una sola confirmación.
      // Usamos activeOrderIds si está disponible, con fallback a activeOrderId (1 sola orden).
      
      if (orderIds.length === 0) {
        alert("No se encontró una orden activa para esta mesa. Verifica que se hayan enviado productos a cocina.");
        setIsProcessingPayment(false);
        return;
      }

      // Pagar cada orden activa de la mesa
      await Promise.all(
        orderIds.map(orderId =>
          apiClient.post(`/orders/orders/${orderId}/pay/`, {
            payment_method: paymentMethod,
            currency: paymentCurrency === "USD" ? "USD" : "BOB",
            exchange_rate: exchangeRate,
            amount_foreign: paymentCurrency === "USD" ? (Number(amountReceived) || null) : null,
          })
        )
      );

      await apiClient.patch(`/tables/${selectedTableForPayment.id}/update_status/`, {
        status: "Libre"
      });

      await Promise.all([refetchTables(), refetchShift()]);

      setSelectedTableForPayment(null)
      setIsProcessingPayment(false)
      setReceiptData(newReceipt)

    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      console.error("Error al procesar el cobro:", err);
      alert(err.response?.data?.error || "Error al procesar el cobro. Asegúrate de tener un turno abierto.");
      setIsProcessingPayment(false);
    }
  }

  return {
    cashierName,
    isShiftOpen,
    shift,
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
    observedTables,
    tableTotalBs,
    tableTotalUSD,
    changeBs,
    exchangeRate,
    isWalkoutMode,
    handleOpenPaymentModal,
    handleOpenWalkoutModal,
    handleResolveWalkout,
    handleConfirmPayment
  }
}
