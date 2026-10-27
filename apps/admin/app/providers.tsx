"use client";

import { createContext, useContext, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App, ConfigProvider, theme } from "antd";
import { getThemeSnapshot, getServerThemeSnapshot, subscribeTheme, type ThemePreference } from "@/lib/theme";

const AppearanceContext = createContext<ThemePreference>("system");
export const useAppearance = () => useContext(AppearanceContext);

export default function Providers({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const preference = snapshot.split(":")[0] as ThemePreference;
  const dark = snapshot.endsWith(":dark");
  useLayoutEffect(() => {
    // Hydration starts with the server snapshot; reveal only after it matches the browser.
    if (snapshot !== getThemeSnapshot()) return;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    delete document.documentElement.dataset.themePending;
  }, [snapshot, dark]);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <ConfigProvider theme={{
      algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: dark ? "#c4a0f2" : "#167047",
        colorPrimaryActive: dark ? "#9b7cbd" : "#0b4a30",
        colorPrimaryBg: dark ? "#3a294d" : "#e3f2e8",
        colorPrimaryBgHover: dark ? "#49335f" : "#d5eadd",
        controlItemBgActive: dark ? "#3a294d" : "#e3f2e8",
        controlItemBgActiveHover: dark ? "#49335f" : "#d5eadd",
        controlItemBgHover: dark ? "#2b2238" : "#edf5ef",
        colorBgBase: dark ? "#17121f" : "#ffffff",
        colorBgLayout: dark ? "#17121f" : "#f3f8f4",
        colorBgContainer: dark ? "#211a2c" : "#ffffff",
        colorBgElevated: dark ? "#2b2238" : "#ffffff",
        colorText: dark ? "#f0eaf7" : "#182c23",
        colorTextSecondary: dark ? "#b8abc9" : "#52695c",
        colorTextTertiary: dark ? "#b8abc9" : "#52695c",
        colorBorder: dark ? "#493a5b" : "#d7e5db",
        colorBorderSecondary: dark ? "#392e48" : "#e5eee7",
        fontFamily: "var(--font-geist-sans), sans-serif",
        borderRadius: 8,
        controlHeight: 36,
      },
      components: {
        Button: { primaryShadow: "none", defaultShadow: "none", primaryColor: dark ? "#17121f" : "#ffffff" },
        Table: { cellPaddingBlock: 16, cellPaddingInline: 16, headerBg: dark ? "#2b2238" : "#edf5ef", headerSplitColor: "transparent" },
        Menu: { itemMarginInline: 12, itemBorderRadius: 6 },
      },
    }}>
      <AppearanceContext.Provider value={preference}>
        <App message={{ duration: 3, maxCount: 3, top: 24 }}>
          <QueryClientProvider client={queryClient}><div className="themed-app">{children}</div></QueryClientProvider>
        </App>
      </AppearanceContext.Provider>
    </ConfigProvider>
  );
}
