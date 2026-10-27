import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { AntdRegistry } from "@ant-design/nextjs-registry";
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
export const metadata: Metadata = { title: "License System | Plans & pricing", description: "Compare license plans, included features and optional add-ons." };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="en" className={geist.variable}><body><AntdRegistry><Providers>{children}</Providers></AntdRegistry></body></html>; }
