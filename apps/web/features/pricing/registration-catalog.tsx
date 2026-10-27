"use client";
import Link from "next/link";
import { Alert, Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import RegistrationForm from "@/features/registrations/form";
import { matchingPrice } from "./presentation";
import { publicPricingService } from "./service";

function positiveId(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export default function RegistrationCatalog({ product, plan, currency, interval }: { product?: string; plan?: string; currency?: string; interval?: string }) {
  const productID = positiveId(product);
  const planID = positiveId(plan);
  const catalog = useQuery({ queryKey: ["public-catalog"], queryFn: ({ signal }) => publicPricingService.catalog(signal) });
  const pricing = useQuery({ queryKey: ["public-pricing"], queryFn: ({ signal }) => publicPricingService.prices(signal) });
  const shell = (content: React.ReactNode) => <main className="registration-page"><div className="registration-wrap"><Link className="registration-back" href="/#pricing">← Quay lại bảng giá</Link>{content}</div></main>;
  if (!productID || (plan !== undefined && !planID)) return shell(<Alert type="error" showIcon title="Không tìm thấy lựa chọn gói" description="Vui lòng quay lại bảng giá và chọn sản phẩm hoặc gói bạn muốn đăng ký." />);
  if (catalog.isPending || pricing.isPending) return shell(<p role="status">Đang tải thông tin gói dịch vụ...</p>);
  if (catalog.isError) return shell(<Alert type="error" showIcon title="Chưa tải được danh mục" description="Vui lòng thử tải lại để chọn cấu hình." action={<Button onClick={() => void catalog.refetch()}>Thử lại</Button>} />);
  const items = catalog.data.filter(item => item.product_id === productID);
  const plans = items.filter(item => item.kind === "plan");
  const selectedPlan = plans.find(item => item.owner_id === planID);
  if (!items.length || (planID !== null && !selectedPlan)) return shell(<Alert type="warning" showIcon title="Sản phẩm hoặc gói không còn trong danh mục" description="Vui lòng quay lại bảng giá để chọn lại." />);
  const selectedCurrency = currency && /^[A-Z]{3}$/.test(currency) ? currency : "VND";
  const selectedInterval = interval && ["month", "year", "one_time"].includes(interval) ? interval : "month";
  const offers = pricing.data ?? [];
  return <RegistrationForm selection={{
    product: { id: productID, name: items[0].product_name },
    planID,
    plans: plans.map(item => ({ id: item.owner_id, name: item.name, priceID: matchingPrice(item, offers, selectedCurrency, selectedInterval)?.price_id ?? null })),
    features: items.filter(item => item.kind === "feature").map(item => ({ id: item.owner_id, name: item.name, type: item.feature_type ?? "boolean" })),
    priceUnavailable: pricing.isError,
  }} />;
}
