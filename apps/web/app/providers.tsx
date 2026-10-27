"use client";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme } from "antd";
dayjs.locale("vi");

function subscribe(onChange: () => void) { const media = window.matchMedia("(prefers-color-scheme: dark)"); media.addEventListener("change", onChange); return () => media.removeEventListener("change", onChange); }
export default function Providers({ children }: {
    children: ReactNode;
}) {
    const dark = useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-color-scheme: dark)").matches, () => false);
    const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30000 } } }));
    return <ConfigProvider locale={viVN} theme={{ algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm, token: { colorPrimary: dark ? "#C4A0F2" : "#167047", colorBgContainer: dark ? "#211A2C" : "#FFFFFF", colorBgElevated: dark ? "#211A2C" : "#FFFFFF", colorText: dark ? "#F0EAF7" : "#182C23", colorTextSecondary: dark ? "#B8ABC9" : "#52695C", colorBorder: dark ? "#493A5B" : "#D7E5DB", fontFamily: "var(--font-geist-sans), sans-serif" } }}><QueryClientProvider client={client}>{children}</QueryClientProvider></ConfigProvider>;
}
