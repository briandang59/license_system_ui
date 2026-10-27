import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { themeInitScript } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Hệ thống bản quyền",
  description: "Quản lý bản quyền, sản phẩm và khách hàng trong cùng một hệ thống.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The pre-paint script only changes theme data attributes on this element.
      suppressHydrationWarning
    >
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<p role="status">Đang tải...</p>}>
          <AntdRegistry>
            <Providers>{children}</Providers>
          </AntdRegistry>
        </Suspense>
      </body>
    </html>
  );
}
