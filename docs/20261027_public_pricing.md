# Tách frontend khách hàng và admin — 20261027

Ngày quyết định: 2026-10-27. Yêu cầu đã xác nhận: landing page pricing khách hàng
tại domain chính (ví dụ brian.com), quản trị tại admin.brian.com; hai frontend độc
lập trong cùng repository, backend Go dùng chung.

## Cấu trúc và vận hành

- apps/web: Next.js public, local 3000, không có proxy login hoặc import admin.
- apps/admin: ứng dụng quản trị chuyển từ root, local 3001; giữ kiến trúc feature.
- pnpm workspace; pnpm dev:web và pnpm dev:admin chạy độc lập.
- Docker argument APP chọn web/admin, standalone output và image riêng. Compose
  có hai service. Chưa deploy, sửa DNS hoặc TLS.
- Cấu hình .env local cũ được chuyển sang apps/admin, không đọc/in credential.
  APP_ORIGIN phải khớp URL admin. Các .env.example chứa giá trị mẫu.

Chọn hai app thay vì host-based rewrite để routing/layout/build và xác thực độc
lập. Đánh đổi là phải build/test cả hai. Chưa tạo shared UI package khi chưa cần
chia sẻ nghiệp vụ. Không import xuyên app.

Reverse proxy định tuyến domain chính vào web, subdomain admin vào admin. Cookies
admin host-only, HttpOnly; không dùng Domain=.brian.com. API_BASE_URL chỉ ở server.

## Public pricing

/ và /pricing không yêu cầu đăng nhập. Browser gọi GET /api/pricing; server gọi
GET /api/v1/public/pricing không gửi cookie hoặc Authorization. Proxy validate
response bằng Zod, che chi tiết lỗi upstream. TanStack Query tải đủ các trang với
AbortSignal; hỗ trợ loading, empty, error/retry và lọc Product/currency/chu kỳ.

Giá Plan và add-on tách riêng; không tự cộng quantity vào limit. Chưa cấu hình giá
không bị hiểu là miễn phí; amount_minor=0 là miễn phí hợp lệ. Intl định dạng theo
minor-unit scale của currency được hỗ trợ; currency lạ hiển thị minor units rõ
ràng. Frontend từ chối số vượt MAX_SAFE_INTEGER, không âm thầm làm tròn BIGINT.

SALES_CONTACT_URL optional, chỉ https:// hoặc mailto:, bỏ trống thì ẩn CTA. Không
checkout/signup/payment/renewal tự động. Light/dark theo hệ điều hành; controls
Ant Design và palette/font hiện có. Nội dung UI giữ tiếng Anh.

## Admin

- Units CRUD; Feature chọn unit_id, hiển thị Unit qua component sở hữu domain;
  giữ chuỗi legacy fallback, không tự chuyển dữ liệu.
- View Plan/Feature mở Price history: tạo giá, sửa effective_to/status, xóa giá chưa
  dùng. Không PATCH amount/currency/interval/effective_from.
- Subscription list/status filter, tạo với Company/Plan/giá, xem snapshot; cập nhật
  status/end_date/auto_renew. Không có thao tác xóa Subscription.
- Add-on cùng Product/currency/chu kỳ, hiệu lực tại start_date; chỉ sửa khi pending.
  Quantity tính tiền, limit_value riêng cho entitlement. Đổi giá phải xóa/thêm lại.
- Proxy giữ cookie/origin validation, params/body/response, timeout, no-store, error
  code và 204; không thêm refresh tự động. Backend kiểm tra cuối cùng cho race.

## Kế hoạch QA và evidence

| ID | Điều kiện | Thao tác | Kỳ vọng |
| --- | --- | --- | --- |
| PUB-01 | Không có session, QA có giá | GET proxy public | 200, giá hiện hành, không forward credential |
| PUB-02 | Upstream lỗi/sai schema | GET proxy | 502, không lộ lỗi nội bộ |
| PUB-03 | USD/JPY/KWD/currency lạ | Format tiền | Đúng scale hoặc minor units rõ ràng |
| ADM-01 | Thiếu session/sai origin/ID | Request quản trị | 401/403/400 trước khi gọi upstream |
| ADM-02 | Giá 0, nullable fields | Create/PATCH | Giữ 0/null/false, chặn immutable fields |
| UNIT-01 | Feature có Unit | PATCH omitted rồi null | Giữ rồi xóa FK, không ghi đè legacy |
| SUB-01 | Pending có snapshot | Thêm/sửa add-on | Đúng Product/currency/chu kỳ |
| SUB-02 | Active | Sửa add-on | Backend chặn; UI khóa thao tác |

Test mới: apps/web/tests/pricing.test.mjs và
apps/admin/tests/pricing-subscriptions.test.mjs. Cập nhật harness cũ theo đường dẫn
và component tích hợp mới. Backend TestPublicPricingAndUnitsPostgres cùng test
pricing/concurrency chạy trên PostgreSQL 16 QA riêng.

HTTP local public → backend → QA database trả 3 offer; landing 200, admin anonymous
307 sang login, POST pricing public 405. Lệnh khởi chạy kiểm tra trình duyệt bị hệ
thống chặn; chưa xác minh screenshots, desktop/mobile, light/dark hoặc CRUD admin
end-to-end qua browser. DNS/TLS và Docker runtime production chưa kiểm tra.
