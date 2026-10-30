# 2026-10-30 — Tìm kiếm, khoảng cách, biểu mẫu và tổng quan quản trị

## Yêu cầu và lựa chọn ngày 2026-10-30

Người dùng yêu cầu xử lý gap giao diện, tìm kiếm nhiều cột trên các trang, dấu * đỏ cho trường bắt buộc, chia menu và hiển thị doanh thu thật. Giữ Geist, token màu xanh chế độ sáng/tím chế độ tối, Ant Design và layout hiện hữu. Không thêm thư viện biểu đồ hay thay thiết kế thương hiệu. Dùng header/toolbar có wrap và gap 12–16px, các section cách nhau24px, card padding16/24px, field cách20px. Menu mobile dùng Drawer hiện có.

- Nghiệp vụ: Yêu cầu & báo giá, Đăng ký dịch vụ, Thanh toán, Bản quyền, Tính năng.
- Danh mục: Sản phẩm, Doanh nghiệp, Gói dịch vụ, Đơn vị tính.
- Tổng quan giữ cấp đầu.

## Tìm kiếm

Các trang catalog hiện có được mở rộng SQL nhiều cột; thêm search cho yêu cầu/báo giá, subscription, khoản cần thu, giao dịch và bản quyền. Trong chi tiết subscription có tìm lịch sử bổ sung và quyền hiệu lực. SearchField submit bằng Enter/nút, clear xóa lọc ngay, trim và tối đa200 ký tự. Query key chứa từ khóa/offset, đổi từ khóa reset offset và lựa chọn. Giữ AbortSignal, lỗi/thử lại/loading/rỗng. Backend lọc trước phân trang, không lọc riêng trang hiện tại. Các bảng cấu hình lồng như editor giá/feature không phải trang danh sách độc lập.

Catalog tìm tên/mã/mô tả/trạng thái; gói thêm sản phẩm/doanh nghiệp; tính năng thêm loại/đơn vị/sản phẩm; doanh nghiệp có MST/email/điện thoại; nghiệp vụ có tham chiếu/thông tin doanh nghiệp/gói/sản phẩm tùy API. Bản quyền tìm thiết bị/hostname nhưng không tìm hoặc hiển thị license_key. Trang bản quyền chỉ đọc và giữ xuất CSV hiện hữu.

## Required và accessibility

FormControlProps.required truyền qua toàn bộ18 controls đến FormField. Form.Item hiển thị dấu * đỏ của Ant Design, cùng aria-required. Đã đánh dấu các trường bắt buộc trong catalog/auth/giá/báo giá/subscription/bổ sung/thanh toán và đăng ký public. Tài khoản/tham chiếu bắt buộc khi bank_transfer; khoản cần thu bắt buộc khi xác nhận giao dịch. Trường tùy chọn và boolean có giá trị mặc định không ép phải tick. Quy tắc Zod/backend giữ nguyên.

## Tổng quan và API

features/dashboard giữ schema/service/urls/handler/page, cấu hình cột ở columns.tsx và biểu đồ ở revenue-chart.tsx. Route GET /api/dashboard gọi server BFF GET /api/v1/dashboard, kiểm tra cookie và Zod. Bộ lọc tháng và search được forward dù API không phân trang; lib/admin-request chỉ forward queryKeys được cho phép. from/to RFC3339 offset, phải đi cùng, dương và tối đa366 ngày; mặc định UI tháng Việt Nam.

Hiển thị thực thu trong tháng theo received_at của confirmed, gồm thu thừa; không coi pending_review/rejected là doanh thu. Còn phải thu và số liệu vận hành là hiện tại. Currency selector không cộng VND/USD. Các tổng tiền là chuỗi số nguyên đơn vị nhỏ nhất; BigInt định dạng chính xác theo số lẻ tiền tệ. Biểu đồ ngày có tooltip, chọn bằng chuột/bàn phím và nội dung số tiền. Bảng tối đa10 khoản thu gần nhất trong kỳ hiển thị mọi tiền tệ và ghi currency trên từng dòng.

GET /api/licenses → GET /api/v1/licenses trả overview đã kiểm tra schema, không trả khóa license. Cần backend mới trước frontend; thiếu API hiển thị lỗi và thử lại, không dùng số liệu giả. Không tự deploy hay commit.

## Kiểm chứng và giới hạn

- 112 tests admin và17 tests web chạy thành công; pnpm lint, typecheck cả hai app.
- Tests dashboard-search: forward from/to/search Unicode ở GET không phân trang; từ chối range sai/thiếu phiên; response sai trả502; tổng tiền vượt MAX_SAFE_INTEGER và currency scale; pagination/status/search license và loại bỏ field bí mật upstream.
- Form-controls render kiểm tra dấu required và aria-required cho bắt buộc/tùy chọn.
- Docker production build admin/web thành công. Native Windows build có lỗi EPERM từ .next cũ ở phiên trước, nên dùng Docker clean context.
- Preview kết nối backend thật với DB kiểm thử riêng: đăng nhập, tổng thực thu15.000.000VND, menu nhóm, tìm kiếm trang nghiệp vụ/catalog, clear/rỗng/lỗi/thử lại, required đỏ; ảnh desktop/mobile sáng/tối đã xem. Không gửi email, không sửa DB ứng dụng.
- Chưa benchmark dữ liệu lớn. Không có ví khách hàng, tự trừ tiền hoặc dự báo lợi nhuận trong thay đổi này.
