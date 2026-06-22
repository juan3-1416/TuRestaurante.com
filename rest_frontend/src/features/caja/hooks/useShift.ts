import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { isAxiosError } from "axios";

export function useShift() {
  const queryClient = useQueryClient();

  const {
    data: shift = null,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["currentShift"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/cashier/shift/current/");
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null; // La caja está cerrada
        }
        throw error;
      }
    },
    retry: false, // Evitamos reintentar si el error es 404
  });

  const openShift = useMutation({
    mutationFn: async ({ initial_balance }: { initial_balance: number }) => {
      const response = await apiClient.post("/cashier/shift/open_shift/", {
        initial_balance,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentShift"] });
    },
  });

  const closeShift = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/cashier/shift/close_shift/");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentShift"] });
    },
  });

  const registerExpense = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      const response = await apiClient.post("/cashier/transactions/expense/", {
        amount,
        description,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentShift"] });
    },
  });

  return {
    shift,
    isLoading,
    isError,
    refetch,
    isShiftOpen: !!shift,
    openShift,
    closeShift,
    registerExpense,
  };
}
