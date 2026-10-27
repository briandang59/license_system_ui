import Link from "next/link";
import ThemeSwitcher from "@/components/ui/theme-switcher";
import { ArrowDown, ArrowUpRight, Check, Layers3, Package, ShieldCheck } from "lucide-react";
import PricingPage from "@/features/pricing/page";
export const dynamic = "force-dynamic";
export default function Home() {
    const raw = process.env.SALES_CONTACT_URL;
    const contact = raw && /^(https:\/\/|mailto:)/.test(raw) ? raw : undefined;
    return <div className="site">
      <a href="#pricing" className="skip-link">Chuyển đến bảng giá</a>
      <header className="site-header">
        <Link className="brand" href="/"><span className="brand-mark"><ShieldCheck size={22} aria-hidden /></span><span>Hệ thống<br /><strong>bản quyền</strong></span></Link>
        <nav aria-label="Điều hướng chính"><a href="#pricing">Gói dịch vụ</a><a href="#comparison">So sánh tính năng</a>{contact && <a className="nav-contact" href={contact}>Nhận tư vấn <ArrowUpRight size={15} aria-hidden /></a>}<ThemeSwitcher /></nav>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hero-intro"><span /> Linh hoạt theo nhu cầu của bạn</p>
            <h1 id="hero-title">Đúng tính năng.<br />Đúng quy mô.<br />Rõ chi phí.</h1>
            <p className="hero-description">Một nơi để tìm giải pháp phù hợp. Khám phá các gói dịch vụ, xem từng quyền lợi và chọn những gì doanh nghiệp bạn cần.</p>
            <div className="hero-actions"><a className="primary-link" href="#pricing">Khám phá gói dịch vụ <ArrowDown size={17} aria-hidden /></a>{contact && <a className="text-link" href={contact}>Trao đổi với chúng tôi <ArrowUpRight size={16} aria-hidden /></a>}</div>
            <p className="hero-note"><ShieldCheck size={16} aria-hidden /> Quyền lợi và giá được cập nhật từ hệ thống.</p>
          </div>
          <div className="capability-visual" aria-label="Mô hình sản phẩm, gói dịch vụ và quyền lợi">
            <div className="visual-topline"><span>Cấu hình theo nhu cầu</span><span className="visual-dot" aria-hidden /></div>
            <div className="visual-product"><span className="visual-icon"><Package size={26} aria-hidden /></span><div><small>Bắt đầu từ giải pháp</small><h2>Sản phẩm của bạn</h2></div></div>
            <div className="visual-connector" aria-hidden><span /></div>
            <div className="visual-plan"><div className="visual-plan-title"><Layers3 size={19} aria-hidden /><span>Gói dịch vụ phù hợp</span></div>
              <ul><li><Check size={16} aria-hidden /><span>Tính năng cần thiết</span><span className="visual-check" /></li><li><Check size={16} aria-hidden /><span>Hạn mức theo quy mô</span><span className="visual-check" /></li><li><Check size={16} aria-hidden /><span>Chu kỳ thanh toán linh hoạt</span><span className="visual-check" /></li></ul>
            </div>
            <div className="visual-footer"><ShieldCheck size={17} aria-hidden /><span>Quản lý tập trung. Dễ dàng mở rộng.</span></div>
          </div>
        </section>
        <div className="value-strip" aria-label="Lợi ích khi chọn gói"><span><Check size={16} aria-hidden /> Quyền lợi được liệt kê rõ ràng</span><span><Check size={16} aria-hidden /> So sánh theo nhu cầu thực tế</span><span><Check size={16} aria-hidden /> Bổ sung tính năng khi cần</span></div>
        <PricingPage contactUrl={contact} />
        <section className="closing-section"><div><h2>Giải pháp phù hợp bắt đầu<br />từ nhu cầu của bạn.</h2><p>Chọn một gói làm nền tảng, sau đó mở rộng cùng doanh nghiệp.</p></div>{contact ? <a className="primary-link" href={contact}>Liên hệ tư vấn <ArrowUpRight size={18} aria-hidden /></a> : <a className="primary-link" href="#pricing">Xem lại các gói <ArrowUpRight size={18} aria-hidden /></a>}</section>
      </main>
      <footer className="site-footer"><span className="footer-brand"><ShieldCheck size={18} aria-hidden /> Hệ thống bản quyền</span><span>Sản phẩm phù hợp. Quyền lợi rõ ràng.</span><a href="#pricing">Gói dịch vụ</a></footer>
    </div>;
}
