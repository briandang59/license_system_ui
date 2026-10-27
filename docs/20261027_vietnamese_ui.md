# Giao diện tiếng Việt — 2026-10-27

Yêu cầu: toàn bộ FE dùng tiếng Việt và đặt quy tắc cho các thay đổi tiếp theo.
Phạm vi gồm apps/admin và apps/web: menu, bảng/form, nút, trợ năng, thông báo,
metadata, nội dung tải/rỗng/lỗi, landing/bảng giá và trang 404/lỗi hệ thống.

Việt hóa trực tiếp nội dung hiện tại vì hệ thống chỉ yêu cầu một ngôn ngữ, không
thêm framework i18n hay bộ chọn ngôn ngữ. ConfigProvider dùng locale vi_VN; Day.js
dùng vi; Zod dùng locale vi; HTML lang=vi, font có subset Vietnamese và định dạng
số/tiền vi-VN. Theme light/dark và cấu trúc UI giữ nguyên; menu chọn theme nới rộng
để hiển thị nhãn tiếng Việt.

lib/display-labels.ts chuyển enum sang nhãn khi hiển thị. Request, URL, JSON keys,
enum và code nghiệp vụ giữ nguyên. Không dịch dữ liệu tên/mô tả người dùng lưu ở
backend; tên gói tiếng Anh do người dùng đặt vẫn hiển thị nguyên vẹn. Header file
import/export giữ theo contract để có thể import lại.

Lỗi API thông thường qua thông báo an toàn tiếng Việt. Riêng kết quả import theo
dòng dùng features/data-transfer/messages.ts để dịch lỗi đã biết và thông tin
field; lỗi chưa biết dùng thông báo tiếng Việt an toàn, không đưa nguyên nội dung
backend lên UI hoặc CSV báo lỗi. Mã lỗi kỹ thuật giữ nguyên.

Quy tắc được đặt tại AGENTS.md root, AGENTS.md hai app và skill license-system-ui.
tests/localization.test.mjs kiểm tra nhãn enum/contract, locale, ngăn lỗi backend lộ
ra UI và một số chuỗi tiếng Anh phổ biến tái xuất hiện. Test này không chứng minh
mọi dữ liệu do backend/người dùng cung cấp đều là tiếng Việt.

Kiểm thử chức năng dùng test runner hiện có, lint, TypeScript và build hai app.
Chưa có xác nhận trực quan bằng trình duyệt desktop/mobile, light/dark trong phiên này.
