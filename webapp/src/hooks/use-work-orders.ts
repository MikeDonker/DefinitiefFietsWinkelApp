import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ServiceWorkOrder,
  CreateWorkOrderData,
  WorkOrderStatus,
} from "@/lib/types";

export function useWorkOrders() {
  return useQuery({
    queryKey: ["work-orders"],
    queryFn: () => api.get<ServiceWorkOrder[]>("/api/work-orders?limit=200"),
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkOrderData) =>
      api.post<ServiceWorkOrder>("/api/work-orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status?: WorkOrderStatus; notes?: string } }) =>
      api.patch<ServiceWorkOrder>(`/api/work-orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
