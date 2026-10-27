"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/features/auth/service";
import { App } from "antd";
import { getApiErrorMessage } from "@/lib/api-errors";

export function useLogout() {
  const { message } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    retry: false,
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      void message.success("Signed out.");
      router.replace("/auth/login");
      router.refresh();
    },
  });
}
