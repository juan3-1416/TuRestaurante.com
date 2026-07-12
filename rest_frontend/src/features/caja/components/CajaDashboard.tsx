"use client"

import { useCaja } from "../hooks/useCaja"
import { CajaTopPanel } from "./CajaTopPanel"
import { CajaSummaryCards } from "./CajaSummaryCards"
import { CajaPendingTables } from "./CajaPendingTables"
import { CajaTransactionHistory } from "./CajaTransactionHistory"
import { CajaPaymentModal } from "./CajaPaymentModal"
import { ReceiptModal } from "./ReceiptModal"

export function CajaDashboard() {
  const cajaState = useCaja()

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Panel Superior */}
      <CajaTopPanel 
        isShiftOpen={cajaState.isShiftOpen} 
        cashierName={cajaState.cashierName} 
        shift={cajaState.shift}
      />

      {/* Tarjetas de Resumen Financiero Dinámicas */}
      <CajaSummaryCards 
        isShiftOpen={cajaState.isShiftOpen}
        shiftInitialBalance={cajaState.shiftInitialBalance}
        income={cajaState.income}
        expenses={cajaState.expenses}
        currentTotal={cajaState.currentTotal}
        exchangeRate={cajaState.exchangeRate}
      />

      {/* Mesas Pendientes de Cobro + Mesas Observadas */}
      <CajaPendingTables 
        isShiftOpen={cajaState.isShiftOpen}
        pendingTables={cajaState.pendingTables}
        observedTables={cajaState.observedTables}
        handleOpenPaymentModal={cajaState.handleOpenPaymentModal}
        handleOpenWalkoutModal={cajaState.handleOpenWalkoutModal}
      />

      {/* Historial de Movimientos */}
      <CajaTransactionHistory 
        isShiftOpen={cajaState.isShiftOpen}
        transactions={cajaState.transactions}
      />

      {/* MODAL DE COBRO + DETALLE DE PEDIDO */}
      <CajaPaymentModal 
        selectedTableForPayment={cajaState.selectedTableForPayment}
        setSelectedTableForPayment={cajaState.setSelectedTableForPayment}
        isProcessingPayment={cajaState.isProcessingPayment}
        paymentMethod={cajaState.paymentMethod}
        setPaymentMethod={cajaState.setPaymentMethod}
        paymentCurrency={cajaState.paymentCurrency}
        setPaymentCurrency={cajaState.setPaymentCurrency}
        amountReceived={cajaState.amountReceived}
        setAmountReceived={cajaState.setAmountReceived}
        tableTotalBs={cajaState.tableTotalBs}
        tableTotalUSD={cajaState.tableTotalUSD}
        changeBs={cajaState.changeBs}
        exchangeRate={cajaState.exchangeRate}
        handleConfirmPayment={cajaState.handleConfirmPayment}
        isWalkoutMode={cajaState.isWalkoutMode}
        handleResolveWalkout={cajaState.handleResolveWalkout}
      />

      <ReceiptModal 
        isOpen={!!cajaState.receiptData} 
        onClose={() => cajaState.setReceiptData(null)} 
        data={cajaState.receiptData} 
      />
    </div>
  )
}