"use client";

import { useRouter } from "next/navigation";
import { App, Button } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormInput from "@/components/form/form-input";
import { loginSchema, type LoginInput } from "@/features/auth/schema";
import { getApiErrorMessage } from "@/lib/api-errors";
import { authService } from "@/features/auth/service";

export default function LoginPage() {
  const { message } = App.useApp();
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
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: () => {
      void message.success("Đăng nhập thành công.");
      queryClient.clear();
      resetField("password");
      router.replace("/");
      router.refresh();
    },
  });

  return (
    <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Chào mừng trở lại
          </h1>
          <p className="mt-2 text-sm text-muted">
            Đăng nhập để quản lý bản quyền của bạn.
          </p>
          <form
            className="mt-8"
            noValidate
            onSubmit={handleSubmit((data) => {
              if (!login.isPending) login.mutate(data);
            })}
          >
            <FormInput
              required control={control}
              name="email"
              label="Địa chỉ email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              size="large"
            />
            <FormInput
              required control={control}
              name="password"
              label="Mật khẩu"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              size="large"
            />
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={login.isPending}
            >
              {login.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
            <p role="status" className="sr-only">
              {login.isPending ? "Đang đăng nhập. Vui lòng chờ." : ""}
            </p>
          </form>
    </div>
  );
}
