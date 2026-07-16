import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export interface EmployeeShift {
  id: number;
  user: number;
  username: string;
  full_name: string;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
  role?: string; // CASHIER, WAITER, etc.
  observations: string;
  generated_income: number;
  tables_served?: number;
  sold_dishes?: { name: string, quantity: number, price: number }[];
  
  // Nuevos campos solicitados (opcionales hasta que el backend los provea)
  login_time?: string;
  logout_time?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  shift_title?: string;
  orders_charged?: number;
  tickets_generated?: number;
  walkout_observations?: string[];
  walkouts_count?: number;
  walkouts_amount?: number;
}

export function useEmployeeShift() {
  const queryClient = useQueryClient();

  const {
    data: shifts = [],
    isLoading,
    refetch,
  } = useQuery<EmployeeShift[]>({
    queryKey: ["employeeShifts"],
    queryFn: async () => {
      const response = await apiClient.get("/users/shifts/");
      return response.data;
    },
  });

  // El turno activo es el que tiene is_active = true
  const activeShift = shifts.find(s => s.is_active) || null;

  const startShift = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/users/shifts/start/");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeShifts"] });
    },
  });

  const endShift = useMutation({
    mutationFn: async ({ observations }: { observations: string }) => {
      const response = await apiClient.post("/users/shifts/end/", { observations });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeShifts"] });
    },
  });

  return {
    shifts,
    activeShift,
    isLoading,
    refetch,
    startShift,
    endShift,
  };
}
