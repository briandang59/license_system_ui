"use client";

import { useRouter } from "next/navigation";
import { Alert, Button } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormInput from "@/components/form/form-input";
import { loginSchema, type LoginInput } from "@/features/auth/schema";
import { getApiErrorMessage } from "@/lib/api-errors";
import { authService } from "@/features/auth/service";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { control, handleSubmit, resetField } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const login = useMutation({
    mutationFn: authService.login,
    retry: false,
    gcTime: 0,
    onSuccess: () => {
      queryClient.clear();
      resetField("password");
      router.replace("/");
      router.refresh();
    },
  });

  return (
    <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your licenses.
          </p>
          <form
            className="mt-8"
            noValidate
            onSubmit={handleSubmit((data) => {
              if (!login.isPending) login.mutate(data);
            })}
          >
            <FormInput
              control={control}
              name="email"
              label="Email address"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              size="large"
            />
            <FormInput
              control={control}
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              size="large"
            />
            {login.isError && (
              <div role="alert" className="mb-5">
                <Alert
                  title={getApiErrorMessage(login.error)}
                  type="error"
                  showIcon
                />
              </div>
            )}
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={login.isPending}
            >
              {login.isPending ? "Signing in..." : "Sign in"}
            </Button>
            <p role="status" className="sr-only">
              {login.isPending ? "Signing in. Please wait." : ""}
            </p>
          </form>
    </div>
  );
}
