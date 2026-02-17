import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Bike,
  Brand,
  BikeModel,
  CreateBikeData,
} from "@/lib/types";

export function useBikes() {
  return useQuery({
    queryKey: ["bikes"],
    queryFn: () => api.get<Bike[]>("/api/bikes"),
  });
}

export function useBike(id: string | number | undefined) {
  return useQuery({
    queryKey: ["bike", id],
    queryFn: () => api.get<Bike>(`/api/bikes/${id}`),
    enabled: !!id,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: () => api.get<Brand[]>("/api/bikes/brands"),
  });
}

export function useModels(brandId: string | undefined) {
  return useQuery({
    queryKey: ["models", brandId],
    queryFn: () => api.get<BikeModel[]>(`/api/bikes/models?brandId=${brandId}`),
    enabled: !!brandId,
  });
}

export function useCreateBike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBikeData) => api.post<Bike>("/api/bikes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateBike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Bike> }) =>
      api.patch<Bike>(`/api/bikes/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
      queryClient.invalidateQueries({ queryKey: ["bike", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCheckoutBike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bikeId: number) => api.post<Bike>(`/api/bikes/${bikeId}/checkout`, {}),
    onSuccess: (_, bikeId) => {
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
      queryClient.invalidateQueries({ queryKey: ["bike", bikeId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
