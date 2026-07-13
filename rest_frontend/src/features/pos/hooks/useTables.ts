import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { Table, TableStatus, OrderItem } from "@/store/posStore";
import { isAxiosError } from "axios";

export function useTables() {
  const queryClient = useQueryClient();

  const {
    data: tables = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await apiClient.get<Table[]>("/tables/");
      const fetchedTables = response.data;
      return fetchedTables.map((t) => ({
        ...t,
        activeOrderId: t.activeOrderId ?? null,
        activeOrderIds: (t as { activeOrderIds?: (number | string)[] }).activeOrderIds ?? [],
        observationNote: (t as { observationNote?: string }).observationNote ?? null,
        currentTotal: t.currentTotal !== undefined 
          ? t.currentTotal 
          : (t.orders || []).reduce((acc: number, item: OrderItem) => acc + (Number(item.price) || 0), 0)
      }));
    },
  });

  const createTable = useMutation({
    mutationFn: async ({ number, capacity }: { number: number; capacity: number }) => {
      const response = await apiClient.post("/tables/", { number: String(number), table_number: String(number), capacity, status: "Libre" });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (error: unknown) => {
      console.error("Error al crear mesa:", error);
      if (isAxiosError(error) && error.response && error.response.data) {
        console.error("Detalles del backend:", error.response.data);
        alert("Error de validación del backend: " + JSON.stringify(error.response.data, null, 2));
      }
    }
  });

  const editTable = useMutation({
    mutationFn: async ({ id, number, capacity }: { id: string | number; number: number; capacity: number }) => {
      const response = await apiClient.put(`/tables/${id}/`, { number: String(number), table_number: String(number), capacity });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  const deleteTable = useMutation({
    mutationFn: async (id: string | number) => {
      const response = await apiClient.delete(`/tables/${id}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  const updateTableStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      customerName,
      orders,
      activeTime,
      orderId,
      note,
    }: {
      id: string | number;
      status: TableStatus;
      customerName?: string;
      orders?: OrderItem[];
      activeTime?: string;
      orderId?: number | string;  // Si viene, edita esa orden específica del backend
      note?: string;              // Descripción del pedido
    }) => {
      const response = await apiClient.patch(`/tables/${id}/update_status/`, {
        status,
        customerName,
        orders,
        activeTime,
        ...(orderId !== undefined ? { order_id: orderId } : {}),
        ...(note !== undefined ? { note } : {}),
      });
      return response.data;
    },
    // Después de actualizar, usamos setQueryData en lugar de invalidateQueries.
    // Razón: invalidateQueries hace refetch del backend, que devuelve los items SIN orderId,
    // perdiendo la agrupación de pedidos independientes.
    // Con setQueryData actualizamos el caché manualmente preservando el orderId de cada pedido.
    onSuccess: (responseData, variables) => {
      queryClient.setQueryData<Table[]>(["tables"], (oldTables) => {
        if (!oldTables) return oldTables;

        // El backend devuelve { status: "...", table: { currentTotal, activeOrderId, activeOrderIds, ... } }
        const backendTable = responseData?.table;

        return oldTables.map((t: Table) => {
          if (String(t.id) === String(variables.id)) {
            let updatedOrders: OrderItem[] | undefined;

            if (variables.orderId !== undefined && variables.orders !== undefined) {
              // Edición de un ticket específico del backend:
              // Reemplazar solo los ítems de ese orderId, mantener el resto
              const otherItems = (t.orders || []).filter(
                o => String(o.orderId) !== String(variables.orderId)
              );
              const newItems = variables.orders.map(o => ({
                ...o,
                orderId: variables.orderId !== undefined ? String(variables.orderId) : o.orderId,
              }));
              updatedOrders = [...otherItems, ...newItems];
            } else {
              // Comportamiento normal: reemplazar todos los orders o preservar los locales
              updatedOrders = variables.orders !== undefined ? variables.orders : t.orders;
            }

            return {
              ...t,
              status: variables.status,
              customerName: variables.customerName ?? t.customerName,
              activeTime: variables.activeTime ?? t.activeTime,
              orders: updatedOrders,
              // Los totales e IDs reales los calculó el backend correctamente
              currentTotal: backendTable?.currentTotal ?? t.currentTotal,
              activeOrderId: backendTable?.activeOrderId ?? t.activeOrderId,
              activeOrderIds: backendTable?.activeOrderIds ?? t.activeOrderIds,
            };
          }
          return t;
        });
      });
    },
  });

  // Mutación para AGREGAR UN NUEVO PEDIDO independiente a la mesa.
  // Llama a update_status con new_order=true para que el backend cree una Order nueva.
  const addNewOrder = useMutation({
    mutationFn: async ({
      id,
      status,
      customerName,
      orders,
      activeTime,
      note,
    }: {
      id: string | number;
      status: TableStatus;
      customerName?: string;
      orders: OrderItem[];  // Solo los ítems del NUEVO pedido
      activeTime?: string;
      note?: string;        // Descripción del pedido
    }) => {
      const response = await apiClient.patch(`/tables/${id}/update_status/`, {
        status,
        customerName,
        orders,
        activeTime,
        new_order: true,  // Le dice al backend que cree una Order nueva
        ...(note !== undefined ? { note } : {}),
      });
      return response.data;
    },
    // Después de crear la nueva orden, hacemos refetch completo desde el backend.
    // El backend ya tiene los orderId reales de todas las órdenes, así podemos
    // reemplazar el caché con datos frescos que incluyen los nuevos orderId numéricos.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  const reportWalkout = useMutation({
    mutationFn: async ({ id, note }: { id: string | number; note: string }) => {
      const response = await apiClient.patch(`/tables/${id}/report_walkout/`, { note });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  const resolveWalkout = useMutation({
    mutationFn: async (id: string | number) => {
      const response = await apiClient.patch(`/tables/${id}/resolve_walkout/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  return {
    tables,
    isLoading,
    isError,
    refetch,
    createTable,
    editTable,
    deleteTable,
    updateTableStatus,
    addNewOrder,
    reportWalkout,
    resolveWalkout,
  };
}
