import { useState } from "react"
import { Table } from "@/store/posStore"
import { useTables } from "@/features/pos/hooks/useTables"
import { useShift } from "./useShift"
import { useAuthStore } from "@/store/authStore"
import { ReceiptData } from "../components/ReceiptModal"
import { apiClient } from "@/lib/axios"

export const EXCHANGE_RATE = 7.52; // Tasa de cambio

export function useCaja() {
  const user = useAuthStore((state) => state.user) 
  const cashierName = user?.first_name || user?.username || "Cajero Principal"

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
  const income = shift ? Number(shift.total_income || 0) : 0;
  const expenses = shift ? Number(shift.total_expenses || 0) : 0;
  const currentTotal = shift ? Number(shift.current_balance || 0) : 0;
  const pendingTables = tables.filter(t => t.status === "Ocupada" && (t.currentTotal || 0) > 0)

  // Cálculos Específicos del Modal de Cobro
  const tableTotalBs = selectedTableForPayment?.currentTotal || 0;
  const tableTotalUSD = tableTotalBs / EXCHANGE_RATE;
  
  const changeBs = paymentMethod === "Efectivo" 
    ? (paymentCurrency === "Bs" 
        ? (Number(amountReceived) || 0) - tableTotalBs 
        : ((Number(amountReceived) || 0) * EXCHANGE_RATE) - tableTotalBs)
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
      // 1. Petición al Backend para cobrar la orden
      const orderId = selectedTableForPayment.orders?.[0]?.orderId || selectedTableForPayment.id;
      
      await apiClient.post(`/orders/${orderId}/pay/`, {
        payment_method: paymentMethod,
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
    handleOpenPaymentModal,
    handleConfirmPayment
  }
}
