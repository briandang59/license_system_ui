import Link from "next/link";
import PricingPage from "@/features/pricing/page";
export const dynamic = "force-dynamic";
export default function Home() {
    const raw = process.env.SALES_CONTACT_URL;
    const contact = raw && /^(https:\/\/|mailto:)/.test(raw) ? raw : undefined;
    return <div className="site"><a href="#pricing" className="sr-only focus:not-sr-only">Chuyển đến bảng giá</a><header className="site-header"><Link className="brand" href="/">Hệ thống bản quyền</Link><nav aria-label="Điều hướng chính"><a href="#pricing">Bảng giá</a>{contact && <a href={contact}>Liên hệ tư vấn</a>}</nav></header><main><section className="hero"><h1>Tính năng phù hợp.<br />Chi phí rõ ràng.</h1><p>So sánh gói dịch vụ và các tính năng đi kèm. Bổ sung tính năng theo nhu cầu với bảng giá công khai cho từng lựa chọn.</p></section><PricingPage contactUrl={contact}/></main><footer className="site-footer">Hệ thống bản quyền - Gói dịch vụ, tính năng và các tùy chọn bổ sung.</footer></div>;
}
