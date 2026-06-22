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
        currentTotal: t.currentTotal !== undefined 
          ? t.currentTotal 
          : (t.orders || []).reduce((acc: number, item: OrderItem) => acc + (Number(item.price) || 0), 0)
      }));
    },
  });

  const createTable = useMutation({
    mutationFn: async ({ number, capacity }: { number: number; capacity: number }) => {
      const response = await apiClient.post("/tables/", { number, capacity, status: "Libre" });
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
      const response = await apiClient.put(`/tables/${id}/`, { number, capacity });
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
  };
}
