"use client";
import { useState } from "react";
import { Button, Input } from "antd";
import { Search } from "lucide-react";

export default function SearchField({ label, placeholder, onSearch, disabled = false }: { label: string; placeholder: string; onSearch: (value: string) => void; disabled?: boolean }) {
 const [draft, setDraft] = useState("");
 return <Input.Search aria-label={label} placeholder={placeholder} value={draft} onChange={e => { setDraft(e.target.value); if (!e.target.value) onSearch(""); }} onSearch={value => onSearch(value.trim())} allowClear disabled={disabled} maxLength={200} className="w-full sm:max-w-md" enterButton={<Button aria-label={label} icon={<Search size={16} aria-hidden />}>Tìm kiếm</Button>} />;
}
