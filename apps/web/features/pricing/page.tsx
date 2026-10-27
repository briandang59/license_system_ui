"use client";
import { useState } from "react";
import { Select, Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import { pricingSchema, type Offer } from "./schema";
import { formatMoney } from "./money";
export default function PricingPage({ contactUrl }: {
    contactUrl?: string;
}) {
    const [product, setProduct] = useState("");
    const [currency, setCurrency] = useState("");
    const [interval, setInterval] = useState("");
    const { data: offers = [], isPending: loading, isError: error, refetch } = useQuery({ queryKey: ["public-pricing"], queryFn: async ({ signal }) => {
            const items: Offer[] = [];
            let offset = 0;
            while (true) {
                const res = await fetch(`/api/pricing?offset=${offset}`, { signal, cache: "no-store" });
                if (!res.ok)
                    throw new Error("Không thể tải bảng giá");
                const json = await res.json();
                if (json.success !== true)
                    throw new Error("Phản hồi không hợp lệ");
                const page = pricingSchema.parse(json.data);
                items.push(...page.items);
                if (page.items.length < page.limit)
                    break;
                offset += page.limit;
            }
            return items;
        } });
    const products = [...new Map(offers.map(o => [o.product_id, o.product_name])).entries()];
    const currencies = [...new Set(offers.map(o => o.currency))];
    const intervals = [...new Set(offers.map(o => o.billing_interval))];
    const filtered = offers.filter(o => (!product || String(o.product_id) === product) && (!currency || o.currency === currency) && (!interval || o.billing_interval === interval));
    function card(o: Offer) { return <article className="offer" key={`${o.kind}-${o.price_id}`}><h3>{o.name}</h3>{o.description && <p>{o.description}</p>}<div className="price">{formatMoney(o.amount_minor, o.currency)} <small>{o.billing_interval === "month" ? "/ tháng" : o.billing_interval === "year" ? "/ năm" : "một lần"}</small></div>{o.kind === "feature" && <p>Tính năng bổ sung tùy chọn. Tính phí theo số lượng mua.</p>}<ul>{o.benefits.map((b, i) => <li key={i}>{b.name}{b.feature_type === "quantity" && b.limit_value !== null ? ` - ${b.limit_value.toLocaleString("vi-VN")} ${b.unit ?? ""}` : b.feature_type === "unlimited" ? " - Không giới hạn" : ""}</li>)}</ul>{contactUrl && <a className="contact" href={contactUrl}>Liên hệ tư vấn</a>}</article>; }
    return <section id="pricing" aria-label="Gói dịch vụ và bảng giá"><h2 style={{ fontSize: 32, margin: 0 }}>Gói dịch vụ và bảng giá</h2><p className="muted">Chọn sản phẩm và so sánh các gói dịch vụ hiện có.</p><div className="pricing-toolbar"><label htmlFor="product-filter">Sản phẩm<Select id="product-filter" value={product} onChange={setProduct} options={[{ value: "", label: "Tất cả sản phẩm" }, ...products.map(([id, name]) => ({ value: String(id), label: name }))]}/></label><label htmlFor="currency-filter">Tiền tệ<Select id="currency-filter" value={currency} onChange={setCurrency} options={[{ value: "", label: "Tất cả tiền tệ" }, ...currencies.map(c => ({ value: c, label: c }))]}/></label><label htmlFor="billing-filter">Thanh toán<Select id="billing-filter" value={interval} onChange={setInterval} options={[{ value: "", label: "Tất cả chu kỳ thanh toán" }, ...intervals.map(i => ({ value: i, label: i === "month" ? "Hàng tháng" : i === "year" ? "Hàng năm" : "Một lần" }))]}/></label></div>{loading ? <p className="pricing-status" role="status">Đang tải bảng giá hiện tại...</p> : error ? <div className="pricing-status" role="alert"><p>Không thể tải bảng giá. Vui lòng thử lại.</p><Button onClick={() => void refetch()}>Thử lại</Button></div> : !filtered.length ? <p className="pricing-status">Chưa có giá công khai cho lựa chọn này. Vui lòng quay lại sau.</p> : products.filter(([id]) => filtered.some(o => o.product_id === id)).map(([id, name]) => <section key={id} aria-label={name}><h2 className="product-heading">{name}</h2><div className="plan-grid">{filtered.filter(o => o.product_id === id && o.kind === "plan").map(card)}</div>{filtered.some(o => o.product_id === id && o.kind === "feature") && <><h3 className="addon-heading">Tính năng bổ sung tùy chọn</h3><div className="plan-grid">{filtered.filter(o => o.product_id === id && o.kind === "feature").map(card)}</div></>}</section>)}<p className="muted" style={{ marginTop: 28 }}>Tính năng bổ sung mở rộng gói dịch vụ cơ bản. Giá theo từng tiền tệ và chu kỳ thanh toán được hiển thị riêng.</p></section>;
}
