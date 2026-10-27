import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { AntdRegistry } from "@ant-design/nextjs-registry";
const geist = Geist({ subsets: ["latin", "vietnamese"], variable: "--font-geist-sans" });
export const metadata: Metadata = { title: "Hệ thống bản quyền | Gói dịch vụ và bảng giá", description: "So sánh gói dịch vụ, tính năng đi kèm và các tính năng bổ sung." };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="vi" className={geist.variable}><body><AntdRegistry><Providers>{children}</Providers></AntdRegistry></body></html>; }
