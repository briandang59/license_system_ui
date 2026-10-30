# Thanh toán và bổ sung subscription — 30/10/2026

## Hành vi

Admin có mục **Thanh toán** tại `/payments`: xem khoản cần thu và lịch sử giao dịch; ghi nhận tiền thực nhận nhiều lần; đối soát giao dịch SePay chưa khớp. Tất cả nhân viên đã đăng nhập được xác nhận theo quyết định giai đoạn đầu. Danh tính người xác nhận do backend lấy từ phiên, không gửi từ form.

Tiền thu một phần giữ subscription pending. Khi tổng confirmed đạt số phải thu, backend kích hoạt subscription và bắt đầu thời hạn. Tiền thừa được hiển thị để đối soát riêng; không có ví hoặc tự trừ tiền. Form chuyển khoản yêu cầu tài khoản nhận và mã tham chiếu; dùng UUID giữ nguyên qua retry để chống ghi nhận lặp.

Chi tiết subscription có bảng quyền theo hợp đồng, khoản cần thu và lịch sử bổ sung. Nhân viên ghi nhận thỏa thuận bổ sung đã được khách xác nhận, tổng tiền và các Feature cùng Product. Hạn mức nhập là giá trị mới thay thế, không phải số cộng thêm. Quyền chỉ được áp dụng sau thanh toán đủ; thời hạn cũ giữ nguyên. Chưa có public quote mới cho bổ sung hoặc tính proration tự động.

Trang public `/quote#token` hiển thị mã thanh toán, số đã nhận/còn thiếu và nút cập nhật trạng thái. Không công khai giao dịch ngân hàng hoặc người xác nhận. Token tiếp tục nằm trong fragment và POST body.

## Kiến trúc và API

`features/payments`: schema Zod, URLs, service, server handler, trang danh sách, các form và component tích hợp subscription. Route BFF mỏng ở app/api/payment-requests, payment-transactions và subscriptions/[id]/changes, entitlements. Giữ same-origin check, HttpOnly session cookie, server-only API_BASE_URL, timeout/no-store và runtime validation upstream.

API backend: GET payment-requests, GET payment-requests/:id, POST payment-requests/:id/transactions, GET payment-transactions, POST payment-transactions/:id/review, GET/POST subscriptions/:id/changes, GET subscriptions/:id/entitlements. Tiền là amount_minor nguyên an toàn; trạng thái hiển thị tiếng Việt; phân trang offset, 20 mục, không có total. Thành công invalidates payments và subscriptions; lỗi giữ dữ liệu form để thử lại.

Subscription response nay có source_quote_id và start_date nullable cho hợp đồng chưa thanh toán. UI hiển thị “Chờ thanh toán đủ” và không cho dùng form lifecycle để kích hoạt hoặc đổi ngày kết thúc của subscription từ báo giá. Subscription legacy vẫn dùng luồng cũ. Triển khai cần phối hợp migration/backend trước FE mới; FE cũ không nhận ngày nullable.

## Quyết định và đánh đổi

Tái sử dụng Ant Design, React Hook Form, Zod, TanStack Query và BFF đang có. Không thêm dependency sản phẩm. Component SubscriptionPayments là điểm tích hợp với subscriptions; không import service/schema nội bộ subscriptions từ payment. Các controls và bảng dùng theme token sẵn có, hỗ trợ sáng/tối và cuộn ngang trên mobile.

Manual cho phép nhiều lần thu và SePay có thể gửi lại cùng giao dịch, nên không dùng một cờ paid trên subscription. Backend giữ từng receipt và xử lý race/trùng nguồn. FE không tự cộng tiền hay kích hoạt dịch vụ.

## Kiểm tra

`apps/admin/tests/payments.test.mjs` kiểm tra validation tiền/UUID/tham chiếu, xác thực và same-origin trước fetch, BFF path/body/response, không lộ token, đối soát và bổ sung. Đã chạy test frontend hiện hữu, typecheck và production build admin/web bằng Docker. Build native Windows gặp EPERM khi Next xóa file .next; không được xem lần chạy native đó là thành công.

Trình duyệt Chrome chạy trên các container preview riêng và database kiểm thử: đăng nhập, lỗi form, thu manual một phần, webhook thanh toán đủ, subscription active, public quote và ảnh sáng/tối desktop/mobile. Bàn giao ghi kết quả kiểm tra cuối cùng và phần chưa xác minh. Chưa kiểm chứng giao dịch SePay thật; chưa tự động triển khai ứng dụng đang sử dụng.

Kết quả cuối: 106 test admin và 17 test web đều qua, không skip; typecheck/lint qua cho cả hai app. Docker production build admin/web qua. Trình duyệt đã kiểm tra thêm luồng bổ sung đã xác nhận, thanh toán đủ, hạn mức mới 10 và đối soát/loại giao dịch SePay chưa khớp. Ảnh sáng/tối trên desktop/mobile đã được xem lại. Review đã sửa lỗi subscription detail thiếu Plan/Company khiến nút bổ sung bị khóa; không còn finding Critical/High đã biết trong phạm vi thay đổi. Chưa kiểm thử tiền thật, chưa có refund/ví/proration hoặc tự phát hành lại license offline.
