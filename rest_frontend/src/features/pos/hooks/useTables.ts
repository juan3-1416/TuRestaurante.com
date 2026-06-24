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
        currentTotal: t.currentTotal !== undefined 
          ? t.currentTotal 
          : (t.orders || []).reduce((acc: number, item: OrderItem) => acc + (Number(item.price) || 0), 0)
      }));
    },
  });

  const createTable = useMutation({
    mutationFn: async ({ number, capacity }: { number: number; capacity: number }) => {
      const response = await apiClient.post("/tables/", { table_number: number, capacity, status: "Libre" });
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
      const response = await apiClient.put(`/tables/${id}/`, { table_number: number, capacity });
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
    }: {
      id: string | number;
      status: TableStatus;
      customerName?: string;
      orders?: OrderItem[];
      activeTime?: string;
    }) => {
      const response = await apiClient.patch(`/tables/${id}/update_status/`, {
        status,
        customerName,
        orders,
        activeTime,
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

        // El backend devuelve { status: "...", table: { currentTotal, activeOrderId, ... } }
        const backendTable = responseData?.table;

        return oldTables.map((t: Table) => {
          if (String(t.id) === String(variables.id)) {
            return {
              ...t,
              status: variables.status,
              customerName: variables.customerName ?? t.customerName,
              activeTime: variables.activeTime ?? t.activeTime,
              // Usamos los orders LOCALES (con orderId intacto) en lugar de los del backend
              orders: variables.orders !== undefined ? variables.orders : t.orders,
              // Los totales e IDs reales los calculó el backend correctamente
              currentTotal: backendTable?.currentTotal ?? t.currentTotal,
              activeOrderId: backendTable?.activeOrderId ?? t.activeOrderId,
            };
          }
          return t;
        });
      });
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
  };
}
