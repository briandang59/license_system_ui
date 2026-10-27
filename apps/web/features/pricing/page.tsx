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
                    throw new Error("Pricing unavailable");
                const json = await res.json();
                if (json.success !== true)
                    throw new Error("Invalid response");
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
    function card(o: Offer) { return <article className="offer" key={`${o.kind}-${o.price_id}`}><h3>{o.name}</h3>{o.description && <p>{o.description}</p>}<div className="price">{formatMoney(o.amount_minor, o.currency)} <small>{o.billing_interval === "month" ? "/ month" : o.billing_interval === "year" ? "/ year" : "one-time"}</small></div>{o.kind === "feature" && <p>Optional add-on. Billed per purchased quantity.</p>}<ul>{o.benefits.map((b, i) => <li key={i}>{b.name}{b.feature_type === "quantity" && b.limit_value !== null ? ` - ${b.limit_value.toLocaleString()} ${b.unit ?? ""}` : b.feature_type === "unlimited" ? " - Unlimited" : ""}</li>)}</ul>{contactUrl && <a className="contact" href={contactUrl}>Contact sales</a>}</article>; }
    return <section id="pricing" aria-label="Plans and pricing"><h2 style={{ fontSize: 32, margin: 0 }}>Plans & pricing</h2><p className="muted">Choose your product and compare the plans available today.</p><div className="pricing-toolbar"><label htmlFor="product-filter">Product<Select id="product-filter" value={product} onChange={setProduct} options={[{ value: "", label: "All products" }, ...products.map(([id, name]) => ({ value: String(id), label: name }))]}/></label><label htmlFor="currency-filter">Currency<Select id="currency-filter" value={currency} onChange={setCurrency} options={[{ value: "", label: "All currencies" }, ...currencies.map(c => ({ value: c, label: c }))]}/></label><label htmlFor="billing-filter">Billing<Select id="billing-filter" value={interval} onChange={setInterval} options={[{ value: "", label: "All billing periods" }, ...intervals.map(i => ({ value: i, label: i === "month" ? "Monthly" : i === "year" ? "Yearly" : "One-time" }))]}/></label></div>{loading ? <p className="pricing-status" role="status">Loading current prices...</p> : error ? <div className="pricing-status" role="alert"><p>Prices could not be loaded. Please try again.</p><Button onClick={() => void refetch()}>Retry</Button></div> : !filtered.length ? <p className="pricing-status">No published prices are available for this selection. Please check back later.</p> : products.filter(([id]) => filtered.some(o => o.product_id === id)).map(([id, name]) => <section key={id} aria-label={name}><h2 className="product-heading">{name}</h2><div className="plan-grid">{filtered.filter(o => o.product_id === id && o.kind === "plan").map(card)}</div>{filtered.some(o => o.product_id === id && o.kind === "feature") && <><h3 className="addon-heading">Optional add-ons</h3><div className="plan-grid">{filtered.filter(o => o.product_id === id && o.kind === "feature").map(card)}</div></>}</section>)}<p className="muted" style={{ marginTop: 28 }}>Add-ons supplement a base plan. Prices in different currencies or billing periods are shown separately.</p></section>;
}
