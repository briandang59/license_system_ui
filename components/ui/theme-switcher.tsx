"use client";

import { Select } from "antd";
import { Monitor, Moon, Sun } from "lucide-react";
import { useAppearance } from "@/app/providers";
import { setThemePreference } from "@/lib/theme";

export default function ThemeSwitcher() {
  const preference = useAppearance();
  return <Select
    aria-label="Color theme" title="Color theme" value={preference}
    onChange={setThemePreference} style={{ width: 124 }}
    options={[
      { value: "light", label: <span className="inline-flex items-center gap-2"><Sun size={14} aria-hidden="true" />Light</span> },
      { value: "dark", label: <span className="inline-flex items-center gap-2"><Moon size={14} aria-hidden="true" />Dark</span> },
      { value: "system", label: <span className="inline-flex items-center gap-2"><Monitor size={14} aria-hidden="true" />System</span> },
    ]}
  />;
}
