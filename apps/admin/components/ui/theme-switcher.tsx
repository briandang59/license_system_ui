"use client";

import { Select } from "antd";
import { Monitor, Moon, Sun } from "lucide-react";
import { useAppearance } from "@/app/providers";
import { setThemePreference } from "@/lib/theme";

export default function ThemeSwitcher() {
  const preference = useAppearance();
  return <Select
    aria-label="Giao diện màu" title="Giao diện màu" value={preference}
    onChange={setThemePreference} style={{ width: 165 }}
    options={[
      { value: "light", label: <span className="inline-flex items-center gap-2"><Sun size={14} aria-hidden="true" />Sáng</span> },
      { value: "dark", label: <span className="inline-flex items-center gap-2"><Moon size={14} aria-hidden="true" />Tối</span> },
      { value: "system", label: <span className="inline-flex items-center gap-2"><Monitor size={14} aria-hidden="true" />Theo hệ thống</span> },
    ]}
  />;
}
