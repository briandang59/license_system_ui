import Link from "next/link";
import PricingPage from "@/features/pricing/page";
export const dynamic = "force-dynamic";
export default function Home() {
    const raw = process.env.SALES_CONTACT_URL;
    const contact = raw && /^(https:\/\/|mailto:)/.test(raw) ? raw : undefined;
    return <div className="site"><a href="#pricing" className="sr-only focus:not-sr-only">Skip to pricing</a><header className="site-header"><Link className="brand" href="/">License System</Link><nav aria-label="Main navigation"><a href="#pricing">Pricing</a>{contact && <a href={contact}>Contact sales</a>}</nav></header><main><section className="hero"><h1>The right capabilities.<br />A clear price.</h1><p>Compare license plans and the features included in each. Add the capabilities your team needs, with published pricing for every option.</p></section><PricingPage contactUrl={contact}/></main><footer className="site-footer">License System - Plans, features and optional add-ons.</footer></div>;
}
