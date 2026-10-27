# 2026-10-27 — Theme public, số tiền và ngày giờ Việt Nam

## Bối cảnh và quyết định đã xác nhận

Người dùng yêu cầu bộ chọn sáng/tối ở web public, dấu phẩy phân cách số tiền,
DatePicker thay input ISO và ngày giờ Việt Nam bằng Dayjs. Đây là thay đổi trình bày;
không đổi dữ liệu tiền, đơn vị amount_minor hay contract API/import/export.

Giữ bố cục và token hiện có: light xanh lá, dark tím; tái sử dụng controls Ant Design,
React Hook Form và dayjs đã cài. Không thêm dependency hoặc gộp hai app qua import nội bộ.

## Luồng đăng ký đã kiểm tra trong source

Admin /subscriptions có tạo đăng ký: chọn doanh nghiệp, Plan, ngày bắt đầu và giá Plan.
Chi tiết đăng ký có Tính năng bổ sung tùy chỉnh, chỉ sửa khi trạng thái pending và
có giá Plan. Feature thuộc cùng sản phẩm; giá phù hợp tiền tệ, chu kỳ và ngày bắt đầu.
Có số lượng mua và hạn mức riêng. Luồng này giữ Plan gốc, lưu custom trên đăng ký.
Đây là đăng ký dịch vụ, không phải luồng tạo/ký tài liệu hợp đồng pháp lý.
Web public / hiện có catalog, so sánh và liên hệ; chưa có khách tự đặt/đăng ký hợp đồng.
Chỉ kiểm tra source và unit tests, chưa chứng minh luồng đăng ký live với DB.

## Theme

- Header public có Sáng/Tối/Theo hệ thống, lưu preference trong localStorage của origin.
- apps/web/lib/theme.ts và app/providers.tsx tái sử dụng cách làm từ admin: external
  store, lắng nghe OS/storage và theme token Ant Design, đồng bộ data-theme với CSS.
- Bỏ media query dark áp vô điều kiện vì sẽ ghi đè lựa chọn Sáng tường minh.
- Script trước paint chỉ đổi data attributes theme; hydration bắt đầu với server snapshot,
  reveal controls khi client snapshot khớp. suppressHydrationWarning trên html giới hạn
  cho các attributes chủ động đổi bởi script, theo mẫu admin hiện có.
- Storage bị chặn vẫn đổi theme trong tab hiện tại; không đụng session/token.

## Tiền và số

- utils/functions/formatNumber.ts: grouping en-US, ví dụ 20,000,000 và 1,234.50.
- FormInputNumber format/parser giữ state number, bỏ dấu phẩy trước parse, giữ rỗng
  khác 0. Formatter hỗ trợ nhập tiếp chuỗi đã có dấu phân cách và giữ phần thập phân.
- Áp dụng ở giá Plan/Feature, danh sách chọn giá, giá chốt đăng ký và addon. Tổng addon
  vẫn nhân bằng BigInt rồi format để không mất chính xác.
- Public formatMoney giữ quy đổi amount_minor theo currency, dùng currency code rõ
  ràng; 20,000,000 minor VND hiển thị VND 20,000,000, 2,900 minor USD là USD 29.00.
- Không áp dụng grouping vào CSV/JSON hay thay đổi số đã lưu. Rule nằm trong AGENTS.md,
  skill repository và components/form/README.md.

## Ngày giờ

- utils/functions/formatDateTime.ts cấu hình dayjs utc/timezone, Asia/Ho_Chi_Minh.
- FormDatePicker dùng DD/MM/YYYY HH:mm khi showTime; picker wall time được hiểu là
  giờ Việt Nam dù máy ở UTC hoặc America/New_York. Dùng Dayjs/null trong form.
- parseDateTime mở timestamp ISO thành giờ Việt Nam nhưng giữ nguyên instant;
  vietnamNow dùng mặc định. Chỉ toISOString tại submit cho service hiện có.
- Áp dụng ở nhập giá inline, thêm/sửa lịch sử giá, bắt đầu/kết thúc đăng ký và hiển thị
  timestamps trong bảng/chi tiết. Danh tính/số tiền giá cũ vẫn bất biến theo API.
- Quyết định thay thế datetime-local theo timezone trình duyệt trong thiết kế nhập giá
  ban đầu; giữ ISO offset cho API/import/export để tương thích backend.

## Evidence QA và giới hạn

| ID | Kiểm tra | Kỳ vọng | Evidence |
| --- | --- | --- | --- |
| DISPLAY-01 | Tiền 0, 20 triệu, số thập phân, BigInt | Grouping đúng, parse về số cũ | tests/display.test.mjs |
| DISPLAY-02 | Gõ tiếp số có dấu phẩy, xóa ô | Không trùng dấu phẩy; rỗng khác 0 | tests/display.test.mjs |
| DISPLAY-03 | Mở ISO và submit picker 09:00 VN | Giữ 02:00Z, không lệch instant | tests/display.test.mjs chạy ở UTC và New York |
| DISPLAY-04 | Inline pricing controls thực + provider | DatePicker có giá trị VN và disabled khi pending | tests/form-controls.test.mjs |
| DISPLAY-05 | Theme explicit/system/blocked storage | Preference và prepaint đồng bộ | apps/web/tests/theme.test.mjs |
| DISPLAY-06 | VND/USD/JPY/KWD và currency lạ | Giữ đúng minor scale, có grouping | apps/web/tests/pricing.test.mjs |

Admin tests 100/100, web tests 12/12; TypeScript, ESLint và production build cả hai app
đạt. git diff --check đạt. Backend service tests subscription/subscriptionfeature/pricing
đạt; không sửa backend. Lệnh QA dùng Node chạy runner dependency trực tiếp vì pnpm shim
bị lỗi EPERM ở môi trường này.

Chưa chạy browser E2E/ảnh light-dark desktop-mobile hoặc ghi DB thật: workspace không
có Playwright dependency/phiên đăng nhập phục vụ test. Tests SSR/unit và build không
thay thế kiểm tra tương tác DatePicker, focus/caret InputNumber và layout trên trình duyệt.
