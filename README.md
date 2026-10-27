# License System frontend

Toàn bộ giao diện admin và website khách hàng dùng tiếng Việt (HTML vi, Ant Design
vi_VN, Zod tiếng Việt, số/tiền vi-VN). Nhãn trạng thái/chu kỳ được dịch khi hiển thị;
API, enum, mã nghiệp vụ và dữ liệu do người dùng nhập giữ nguyên. Quy tắc bắt buộc
được ghi trong AGENTS.md và skill của repository.

Plans tải `include=features,product`, hiển thị Product và số Feature enabled/configured.
Mở rộng dòng để xem trạng thái, hạn mức và đơn vị; cấu hình cũng hiển thị Feature đã có.
Backend cần trả unit_id nullable cho Feature được include trong Plan.
Nút Edit trong bảng Feature đã cấu hình cho phép sửa enabled và limit (quantity),
gọi PATCH theo cả planId/featureId; ô limit trống gửi null, giữ nguyên giá trị 0.

Configure plan features gọi API Feature list với `product_id` của Plan; backend
lọc trước phân trang. Cần backend có hỗ trợ query này khi triển khai FE.

Admin có nút Import/Export CSV ngay tại các trang catalog, Plan Features và bảng giá.
Subscription/add-on chỉ export; trang Licenses cung cấp export License và các dữ liệu
liên quan. Không có trang import/export riêng. Xem [Data transfer — 20261027](docs/20261027_data_transfer.md).

Hai Next.js app độc lập trong pnpm workspace:

| App | Local | Production ví dụ |
| --- | --- | --- |
| apps/web | http://localhost:3000 | https://brian.com |
| apps/admin | http://localhost:3001 | https://admin.brian.com |

Chạy `pnpm install --frozen-lockfile`, sau đó `pnpm dev:web` và `pnpm dev:admin`
trong hai terminal. Mỗi app có `.env.example`; API_BASE_URL chỉ dùng server.
File `.env` local cũ đã chuyển sang apps/admin; nếu APP_ORIGIN còn dùng port 3000,
cần đổi thành origin admin thực tế (mặc định 3001) trước khi gửi mutation.

Admin quản lý Products, Companies, Plans, Features, Units, giá và Subscription/add-on.
Mở View trên Plan/Feature để quản lý Price history. Web có landing page `/` và
`/pricing`, lấy giá qua API public, không cần cookie/token admin. SALES_CONTACT_URL
optional; để trống sẽ ẩn CTA liên hệ. Chưa có checkout/payment/renewal tự động.

Kiểm tra cả hai app: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

## Kiến trúc và xác thực admin

Trong apps/admin, app/ giữ routes/layout/providers; features/<domain>/ giữ UI,
schema, service, urls và handler server. components/ chứa form controls/layouts;
lib/ chứa HTTP/response/error helpers; tests/ dùng node:test. Quy tắc đầy đủ tại
[AGENTS.md](AGENTS.md) và [skill repository](.agents/skills/license-system-ui/SKILL.md).

Luồng browser → feature service → API route same-origin → feature handler → backend.
Không import handler vào client. Catalog phân trang offset, không suy ra total;
giữ quyền PATCH riêng theo Swagger. Plan Features có endpoint riêng. ID kỹ thuật
dùng nội bộ; bảng hiển thị số thứ tự, selection và actions có accessible labels.

Admin `/auth/login` gửi tới `/api/auth/login`. Server lưu access_token và
license_refresh bằng HttpOnly cookies, không trả token cho JavaScript. proxy.ts
chỉ redirect theo sự hiện diện cookie; backend xác minh token. Refresh tường minh,
không tự retry khi 401. Logout thành công thu hồi phiên, xóa cookies/cache;
lỗi logout giữ phiên để thử lại. Production dùng HTTPS vì cookies có cờ Secure.

## Deploy độc lập

`docker compose build admin web` tạo hai image; `docker compose up -d admin web`
chỉ chạy khi đã được phép triển khai. Docker argument APP chọn admin/web và dùng
standalone output riêng. Compose config dùng `.env.example` tại root.

Nếu đang chạy service `ui` của cấu hình Compose cũ, cần dừng service/container cũ
trong lần chuyển đổi trước khi dùng port 3000 cho web. Không chạy đồng thời hai
container cùng chiếm port này; cấu hình mới không tự dừng service cũ.

DNS A/CNAME của domain chính và subdomain admin trỏ reverse proxy. Proxy đưa
brian.com vào web:3000 và admin.brian.com vào admin:3000, bật TLS cho cả hai.
Đặt ADMIN_ORIGIN=https://admin.brian.com và API_BASE_URL tới backend nội bộ.
Cookies admin host-only; không chia sẻ sang website public.

Trong Docker, localhost là container hiện tại; host.docker.internal dành cho
backend trên host. Cấu hình APP_ORIGIN phải khớp scheme/host/port công khai, không
có dấu `/` cuối. Backend cần lắng nghe interface mà container truy cập được.

Thiết kế, contract và evidence: [public pricing — 20261027](docs/20261027_public_pricing.md).
