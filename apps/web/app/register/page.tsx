import RegistrationCatalog from "@/features/pricing/registration-catalog";
import "./register.css";

export const metadata = { title: "Đăng ký gói dịch vụ" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ product?: string | string[]; plan?: string | string[]; currency?: string | string[]; interval?: string | string[] }> }) {
  const params = await searchParams;
  return <RegistrationCatalog product={typeof params.product === "string" ? params.product : undefined} plan={typeof params.plan === "string" ? params.plan : params.plan ? "invalid" : undefined} currency={typeof params.currency === "string" ? params.currency : undefined} interval={typeof params.interval === "string" ? params.interval : undefined} />;
}
