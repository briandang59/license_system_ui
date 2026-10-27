# 2026-10-27 — Nhập giá cùng form Plan và Feature

## Yêu cầu và quyết định

Người dùng cần nhập giá khi tạo/sửa Plan hoặc Feature và lưu trong cùng một lần thao tác.
Trước thay đổi, tính năng nhập giá chỉ nằm trong Chi tiết → Lịch sử giá.
Ngày 2026-10-27 chọn tích hợp phần Giá bán vào hai form hiện tại, dùng lại API pricing.
Đây là giá của Plan hoặc Feature, không phải giá riêng của từng liên kết Plan–Feature.
Việc gán Feature và hạn mức vào Plan vẫn dùng luồng cấu hình tính năng hiện có.

Từng form hỗ trợ nhiều dòng giá, chu kỳ tháng/năm/một lần, tiền tệ, trạng thái và khoảng
hiệu lực. Mặc định dòng mới là VND, hàng tháng, giá 0, hiệu lực tại thời điểm thêm dòng.
Giá 0 là miễn phí; không thêm dòng nghĩa là chỉ lưu thông tin catalog.
Giữ đơn vị tiền nhỏ nhất của API: VND nhập đồng, USD nhập cent.
Ngày 27/10/2026 cập nhật theo phản hồi người dùng: thay datetime-local bằng FormDatePicker/Dayjs, hiển thị giờ Việt Nam (Asia/Ho_Chi_Minh), gửi UTC ISO cho API. Quyết định này thay thế cách theo múi giờ trình duyệt ban đầu để không lệch ngày khi máy ở nước khác. Xem docs/20261027_display_conventions.md.

## Contract và chủ sở hữu

- Forms: apps/admin/features/plans/form.tsx và features/features/form.tsx.
- Điểm tích hợp UI: apps/admin/features/pricing/price-entry.tsx.
- Validation: apps/admin/features/pricing/entry-schema.ts, tái sử dụng field schemas pricing.
- Lưu và tiến độ: apps/admin/features/pricing/save-with-prices.ts.
- Plan POST /api/plans hoặc PATCH /api/plans/:id; giá POST /api/plans/:id/prices.
- Feature POST /api/features hoặc PATCH /api/features/:id; giá POST /api/features/:id/prices.
- Các route same-origin đi qua handlers hiện có tới backend /api/v1; giữ xác thực, kiểm tra
  origin, validation và response envelope. Không thay đổi API, Swagger hoặc migration.

## Tính nhất quán và đánh đổi

React Hook Form là nguồn dữ liệu duy nhất; controls giá dùng FormProvider của form cha.
Validate toàn bộ form trước khi gửi, bao gồm giá âm/lẻ/không an toàn, tiền tệ và ngày.
Các dòng active cùng tiền tệ và chu kỳ không được chồng khoảng hiệu lực; các khoảng
tiếp giáp được phép. Backend tiếp tục kiểm tra với các giá đã tồn tại.

Một lần bấm lưu tạo/cập nhật parent rồi POST giá lần lượt. Chọn API sẵn có thay vì thêm
endpoint bulk và transaction mới vì không cần đổi contract để hỗ trợ thao tác này.
Đây không phải transaction nguyên tử: nếu một giá lỗi, thông tin parent và những giá đã
được xác nhận lưu vẫn tồn tại. Form ghi nhớ ID parent, bỏ các giá đã xác nhận khỏi draft,
giữ giá lỗi và các giá chưa gửi. Retry trong cùng form cập nhật parent và gửi phần còn lại.
Modal chặn đóng khi pending; cache catalog và pricing được invalidate cả sau lỗi một phần.

Không sửa số tiền/identity của giá cũ vì contract lịch sử giá là bất biến. Để thay giá
cùng tiền tệ/chu kỳ, kết thúc hiệu lực hoặc ngừng giá cũ tại Lịch sử giá trước.
Draft chưa lưu chỉ ở bộ nhớ của form; đóng form hoặc reload sẽ mất draft.
Nếu request đã ghi thành công nhưng mất response, API chưa có idempotency key; cần đối
chiếu Lịch sử giá khi retry báo xung đột. Không tự rollback/xóa dữ liệu đã lưu.

## Kiểm thử và evidence

Các lệnh dùng trực tiếp executable Node của dependencies vì pnpm shim lỗi EPERM trong
môi trường này; đây là các runner tương ứng với scripts test/lint/typecheck/build.

| ID | Kịch bản và bước | Kết quả mong đợi |
| --- | --- | --- |
| PRICE-01 | Validate giá 0, ngày local hợp lệ | Chấp nhận, giữ giá miễn phí |
| PRICE-02 | Validate giá null/âm/lẻ/quá safe integer, tiền tệ sai | Từ chối trước khi lưu |
| PRICE-03 | Validate ngày sai/thời gian kết thúc không sau bắt đầu | Từ chối tại field |
| PRICE-04 | Hai draft cùng tiền tệ/chu kỳ chồng hiệu lực; thử tiếp giáp | Chặn chồng lấn; cho phép tiếp giáp |
| PRICE-05 | Parent lưu lỗi, có draft giá | Không gửi request giá |
| PRICE-06 | Giá đầu thành công, giá sau lỗi, retry trên cùng parent | Giữ draft chưa lưu, không tạo lại parent hoặc gửi lại giá đã xác nhận |
| PRICE-07 | Lưu không có draft | Chỉ lưu catalog |
| PRICE-08 | Render controls với provider thật, pending và giá 0 | Giá/date đúng, controls disabled, không có form lồng |

- Admin: node --test tests/*.test.mjs — 100/100 đạt, gồm tests pricing-subscriptions,
  catalog và form-controls. Fixtures catalog được cập nhật cho FormProvider.
- Web: node --test tests/*.test.mjs — 12/12 đạt, bao gồm theme public.
- TypeScript --noEmit và ESLint: cả hai app đạt.
- Production build: cả hai app đạt.
- Backend: go test ./internal/service/pricing ./internal/handler/http/pricing đạt;
  package handler pricing chưa có test riêng. Backend không có thay đổi của tính năng này.
- git diff --check đạt; dòng trống EOF ở globals.css được dọn khi sửa theme public.

Chưa chạy browser E2E với tài khoản đăng nhập, ảnh desktop/mobile light/dark hoặc ghi
dữ liệu DB thật. Test mock/SSR không chứng minh hành vi trình duyệt hay tích hợp DB live.
