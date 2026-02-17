import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AIStatus,
  SmartSearchResponse,
  PhotoRecognitionResult,
  InvoiceParseResult,
  AISignal,
} from "@/lib/types";

export function useAIStatus() {
  return useQuery({
    queryKey: ["ai-status"],
    queryFn: () => api.get<AIStatus>("/api/ai/status"),
  });
}

export function useSmartSearch() {
  return useMutation({
    mutationFn: (query: string) =>
      api.post<SmartSearchResponse>("/api/ai/smart-search", { query }),
  });
}

export function usePhotoRecognition() {
  return useMutation({
    mutationFn: (imageBase64: string) =>
      api.post<PhotoRecognitionResult>("/api/ai/recognize-photo", { image: imageBase64 }),
  });
}

export function useInvoiceParser() {
  return useMutation({
    mutationFn: (text: string) =>
      api.post<InvoiceParseResult>("/api/ai/parse-invoice", { text }),
  });
}

export function useAISignals() {
  return useQuery({
    queryKey: ["ai-signals"],
    queryFn: () => api.get<AISignal[]>("/api/ai/signals"),
  });
}
