import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient, useSession as useBetterAuthSession } from "@/lib/auth-client";

export function useSession() {
  return useBetterAuthSession();
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });
}
