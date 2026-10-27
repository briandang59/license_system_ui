"use client";

import RegistrationDialog, { type RegistrationSelection } from "@/features/registrations/dialog";
import { useState } from "react";
import { Alert, Button, Segmented, Select } from "antd";
import { ArrowUpRight, Check, Info, Layers3, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicPricingService } from "./service";
import { benefitKey, benefitLimit, catalogWithPricedFallback, matchingPrice } from "./presentation";
import { formatMoney } from "./money";
import type { CatalogItem } from "./schema";

const periods = { month: "/ tháng", year: "/ năm", one_time: "một lần" };

export default function PricingPage({ contactUrl }: { contactUrl?: string }) {
  const [registration, setRegistration] = useState<RegistrationSelection | null>(null);
  const [product, setProduct] = useState("");
  const [currency, setCurrency] = useState("");
  const [interval, setInterval] = useState("");
  const catalog = useQuery({ queryKey: ["public-catalog"], queryFn: ({signal}) => publicPricingService.catalog(signal) });
  const pricing = useQuery({ queryKey: ["public-pricing"], queryFn: ({signal}) => publicPricingService.prices(signal) });
  const offers = pricing.data ?? [];
  const items = catalogWithPricedFallback(catalog.data ?? [], offers);
  const products = [...new Map(items.map(item => [String(item.product_id), item.product_name])).entries()].sort((a,b) => Number(a[0]) - Number(b[0]));
  const selectedProduct = products.some(([id]) => id === product) ? product : products[0]?.[0] ?? "";
  const productItems = items.filter(item => String(item.product_id) === selectedProduct);
  const productPrices = offers.filter(item => String(item.product_id) === selectedProduct);
  const currencies = [...new Set(productPrices.map(item => item.currency))];
  const selectedCurrency = currencies.includes(currency) ? currency : currencies.includes("VND") ? "VND" : currencies[0] ?? "VND";
  const intervals = [...new Set(productPrices.filter(item => item.currency === selectedCurrency).map(item => item.billing_interval))];
  const selectedInterval = intervals.includes(interval as "month") ? interval : intervals.includes("month") ? "month" : intervals[0] ?? "month";
  const intervalOptions = (intervals.length ? ["month", "year", "one_time"].filter(value => intervals.includes(value as "month")) : ["month", "year"])
    .map(value => ({value, label: value === "month" ? "Hàng tháng" : value === "year" ? "Hàng năm" : "Một lần"}));
  const plans = productItems.filter(item => item.kind === "plan");
  const features = productItems.filter(item => item.kind === "feature");
  const comparisons = [...new Map(plans.flatMap(plan => plan.benefits).map(benefit => [benefitKey(benefit), benefit])).values()];
  const loading = catalog.isPending && pricing.isPending;

  function register(planID: number | null) {
    setRegistration({ product: { id: Number(selectedProduct), name: products.find(([id]) => id === selectedProduct)?.[1] ?? "" }, planID,
      plans: plans.map(p => ({ id: p.owner_id, name: p.name, priceID: matchingPrice(p, offers, selectedCurrency, selectedInterval)?.price_id ?? null })),
      features: features.map(f => ({ id: f.owner_id, name: f.name, type: f.feature_type ?? "boolean" })) });
  }
  function planCard(plan: CatalogItem) {
    const price = matchingPrice(plan, offers, selectedCurrency, selectedInterval);
    return <article className="offer" key={plan.owner_id}>
      <h3>{plan.name}</h3>
      <p className="offer-description">{plan.description || "Gói dịch vụ với các quyền lợi được cấu hình theo nhu cầu sử dụng."}</p>
      <div className="price-block">
        {price ? <><div className="price">{formatMoney(price.amount_minor, price.currency)}<small>{periods[price.billing_interval]}</small></div><p className="price-note">Giá đang hiệu lực · Thanh toán {price.billing_interval === "month" ? "hàng tháng" : price.billing_interval === "year" ? "hàng năm" : "một lần"}</p></>
          : <><div className="price contact-price">{pricing.isPending ? "Đang tải giá..." : pricing.isError ? "Tạm chưa tải được giá" : "Liên hệ tư vấn"}</div><p className="price-note">{pricing.isError ? "Vui lòng tải lại bảng giá để xem mức phí hiện tại." : "Chưa có giá công khai cho chu kỳ và tiền tệ đang chọn."}</p></>}
      </div>
      <div className="benefit-title"><Layers3 size={15} aria-hidden /> Quyền lợi trong gói</div>
      {plan.benefits.length ? <ul className="benefit-list">{plan.benefits.map((benefit,index) => <li key={`${benefitKey(benefit)}-${index}`}><Check size={15} aria-hidden /><div>{benefit.name}{benefit.feature_type !== "boolean" && <small>{benefitLimit(benefit)}</small>}</div></li>)}</ul>
        : <p className="empty-benefits">Quyền lợi của gói đang được cập nhật.</p>}
      <div className="offer-action"><Button type="primary" onClick={() => register(plan.owner_id)}>Đăng ký / Tùy chỉnh</Button>{contactUrl ? <a href={contactUrl}>Tư vấn gói {plan.name}<ArrowUpRight size={15} aria-hidden /></a> : <a href="#comparison">So sánh quyền lợi<ArrowUpRight size={15} aria-hidden /></a>}</div>
    </article>;
  }

  return <section id="pricing" className="pricing-section" aria-label="Gói dịch vụ và bảng giá">
    <div className="section-heading"><div><h2>Một gói phù hợp.<br />Nhiều khả năng hơn.</h2><p>Chọn sản phẩm để khám phá gói dịch vụ, quyền lợi và chi phí. Những tính năng cần thiết, trong một cấu hình rõ ràng.</p></div></div>
    {catalog.isError && <Alert type="warning" showIcon title="Chưa tải được đầy đủ danh mục" description="Các gói có giá đã tải vẫn được hiển thị. Vui lòng thử lại để xem toàn bộ gói và tính năng." action={<Button onClick={() => void catalog.refetch()}>Tải lại danh mục</Button>} />}
    {pricing.isError && <Alert type="warning" showIcon className="mt-4" title="Chưa tải được bảng giá" description="Bạn vẫn có thể xem quyền lợi của các gói. Giá sẽ xuất hiện khi kết nối được khôi phục." action={<Button onClick={() => void pricing.refetch()}>Tải lại giá</Button>} />}
    {!!products.length && <div className="pricing-controls">
      <label className="product-control" htmlFor="product-filter">Giải pháp dành cho bạn<Select id="product-filter" size="large" value={selectedProduct} onChange={value => {setProduct(value);setCurrency("");setInterval("");}} options={products.map(([value,label]) => ({value,label}))} /></label>
      <div className="price-options"><label className="currency-control" htmlFor="currency-filter">Tiền tệ<Select id="currency-filter" value={selectedCurrency} onChange={setCurrency} disabled={!currencies.length} options={(currencies.length ? currencies : ["VND"]).map(value => ({value,label:value}))} /></label>
        <label>Chu kỳ thanh toán<Segmented aria-label="Chu kỳ thanh toán" value={selectedInterval} onChange={value => setInterval(String(value))} disabled={!intervals.length} options={intervalOptions} /></label>
      </div>
    </div>}
    {loading ? <div role="status" aria-label="Đang tải gói dịch vụ" className="loading-grid">{[0,1,2].map(index => <div className="loading-card" key={index} />)}<span className="sr-only">Đang tải gói dịch vụ...</span></div>
      : !items.length ? <div className="pricing-status"><h3>{catalog.isError || pricing.isError ? "Chưa thể tải các gói dịch vụ" : "Danh mục đang được cập nhật"}</h3><p>{catalog.isError || pricing.isError ? "Vui lòng thử tải lại sau ít phút." : "Các gói và tính năng sẽ xuất hiện tại đây khi được công bố."}</p>{(catalog.isError || pricing.isError) && <Button onClick={() => {void catalog.refetch();void pricing.refetch();}}>Thử lại</Button>}</div>
        : <><h3 className="product-caption"><Package size={19} aria-hidden />{products.find(([id]) => id === selectedProduct)?.[1]}</h3><div className="plan-grid">{plans.map(planCard)}</div>{!plans.length && <p className="pricing-status">Chưa có gói dịch vụ cho sản phẩm này. Bạn có thể xem các tính năng bên dưới.</p>}</>}
    {!!plans.length && <p className="pricing-footnote"><Info size={15} aria-hidden />Chỉ hiển thị quyền lợi đang bật. Hạn mức chưa thiết lập được tư vấn riêng; giá chưa công bố không được hiểu là miễn phí.</p>}
    {!!features.length && <section className="addons-section" aria-label="Danh mục tính năng"><h3>Linh hoạt đến từng tính năng.</h3><p className="section-subtitle">Khám phá các tính năng của sản phẩm. Tính năng có giá riêng có thể được mua bổ sung theo cấu hình phù hợp.</p><div className="addon-grid">{features.map(feature => {
      const price = matchingPrice(feature,offers,selectedCurrency,selectedInterval);
      return <article className="addon" key={feature.owner_id}><h4>{feature.name}</h4>{feature.description && <p>{feature.description}</p>}<p className="addon-price">{price ? formatMoney(price.amount_minor,price.currency) : pricing.isPending ? "Đang tải giá..." : pricing.isError ? "Tạm chưa tải được giá" : "Liên hệ tư vấn"}</p>{price && <p>{periods[price.billing_interval]}{feature.feature_type === "quantity" ? ` · Theo ${feature.unit || "đơn vị mua"}` : ""}</p>}</article>;
    })}</div></section>}
    {!!products.length && <article className="offer" style={{ marginTop: 24 }}><h3>Gói tùy chỉnh</h3><p>Chọn tính năng, hạn mức và gửi nhu cầu để nhận báo giá riêng cho doanh nghiệp.</p><Button type="primary" onClick={() => register(null)}>Tùy chỉnh & đăng ký</Button></article>}
    {registration && <RegistrationDialog selection={registration} onClose={() => setRegistration(null)} />}
    <section id="comparison" className="comparison-section" aria-label="So sánh tính năng"><h3>Khác biệt nằm ở quyền lợi.</h3><p className="section-subtitle">Đối chiếu tính năng và hạn mức để chọn gói phù hợp với quy mô vận hành.</p>
      {plans.length && comparisons.length ? <div className="comparison-scroll" tabIndex={0} role="region" aria-label="Bảng so sánh quyền lợi có thể cuộn"><table className="comparison-table"><caption>Quyền lợi của các gói thuộc sản phẩm đang chọn</caption><thead><tr><th scope="col">Tính năng</th>{plans.map(plan => <th scope="col" key={plan.owner_id}>{plan.name}</th>)}</tr></thead><tbody>{comparisons.map(benefit => <tr key={benefitKey(benefit)}><th scope="row">{benefit.name}</th>{plans.map(plan => {const included=plan.benefits.find(item => benefitKey(item) === benefitKey(benefit));return <td key={plan.owner_id}>{included ? included.feature_type === "boolean" ? <><Check size={16} aria-hidden /> Đã bao gồm</> : benefitLimit(included) : <span className="muted">Không bao gồm</span>}</td>;})}</tr>)}</tbody></table></div>
        : <p className="pricing-status">Bảng so sánh sẽ xuất hiện khi các gói có quyền lợi được công bố.</p>}
    </section>
  </section>;
}
