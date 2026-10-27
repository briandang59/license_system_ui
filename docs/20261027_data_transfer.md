# Import và export trong admin — 20261027

Ngày quyết định: 2026-10-27. Người dùng xác nhận CSV/XLSX upsert cho catalog và bảng
giá, không import Subscription/License/log; export CSV cho mọi nhóm nghiệp vụ.

## Cách dùng

Mở admin → Import & export, chọn resource; hoặc dùng Import/Export CSV trên màn hình
catalog. View Plan/Feature có các thao tác cho bảng giá; modal Plan Features có
import/export liên kết. Subscription và custom add-on chỉ có Export CSV.

1. Tải CSV template hoặc Excel template.
2. Điền dữ liệu và chọn đúng một file .csv/.xlsx.
3. Check file để xem số dòng tạo/cập nhật và lỗi theo dòng.
4. Confirm import chỉ bật khi file hợp lệ, không đổi từ lúc kiểm tra.
5. Nếu lỗi, không dòng nào được lưu; Download errors lấy CSV để sửa và kiểm tra lại.

Export lấy toàn bộ kết quả khớp bộ lọc/search hoặc parent đang xem, không chỉ trang
Table hiện tại. Trang chung xuất mọi nhóm, gồm License/entitlement/activation/log
metadata. Không có export token/mật khẩu/phiên đăng nhập. Log không xuất raw JSON.

## Quy tắc dữ liệu

| Import resource | Khớp upsert |
| --- | --- |
| Products, Companies, Units | code |
| Features, Plans | product_id + code |
| Plan Features | plan_id + feature_id |
| Giá Plan/Feature | Có price_id: update; bỏ trống: create |

Giá lịch sử không được ghi đè tiền/currency/chu kỳ/ngày bắt đầu. Chỉ sửa kết thúc
hoặc status. Import không dùng để đổi khóa catalog, không tự tạo parent thiếu.
Bỏ cột optional giữ nguyên khi sửa; ô nullable trống xóa; false/0 được giữ.
Metadata id/created_at/updated_at không dùng làm khóa catalog và được bỏ qua.
Legacy unit của Feature không bị cập nhật; chọn unit_id để cấu hình Unit.

Giới hạn import 500 dòng, 2 MiB, XLSX một worksheet, không công thức/macro. CSV UTF-8
có BOM hoặc không; comma/semicolon được hỗ trợ. Ngày dùng text ISO có timezone,
không dùng serial date Excel. Đặt số/ID lớn dạng Text để Excel không làm tròn.
Import rollback toàn file; preview có thể tạo khoảng trống sequence ID nhưng không
lưu bản ghi. Fingerprint không phải idempotency: sau timeout cần kiểm tra dữ liệu
trước khi gửi lại, đặc biệt giá mới chưa có price_id.

Export tối đa 10.000 dòng; vượt giới hạn trả lỗi yêu cầu thu hẹp bộ lọc, không cắt
lặng lẽ. CSV có BOM, quoting, timestamp UTC, null là ô trống. Chuỗi giống công thức
được thêm apostrophe; cần kiểm tra dấu bảo vệ nếu import lại chuỗi đặc biệt.

## Thiết kế và contract

Feature nằm tại apps/admin/features/data-transfer: schema/urls/service/handler,
component DataTransferActions và page. Đây là điểm tích hợp component dùng chung
cho các màn hình; không import service/schema nội bộ của catalog khác.

Route /api/data-transfer/[resource]/[action] chỉ chuyển tiếp vào handler server.
action là template/preview/commit/export; resource được kiểm tra theo allowlist.
Proxy kiểm tra cookie/origin, giới hạn stream request, file, scope và fingerprint;
forward FormData nguyên multipart, không JSON hóa file/không tự đặt boundary.
Timeout 30s, no-store, response JSON kiểm tra Zod và response file kiểm tra MIME.
Token chỉ gửi từ server tới backend, không trả cho JavaScript.

Backend có GET /api/v1/imports/:resource/template, POST preview/commit và
GET /api/v1/exports/:resource. Swagger backend ghi đầy đủ contract mới. Không có
endpoint import Subscription dù client tự sửa request. Website public không đổi.

Modal tái sử dụng FormUpload, RHF/Zod, TanStack Query và Ant Design. File chưa upload
tự động; nút kiểm tra mới gửi file. Pending khóa submit/close. Đổi file làm vô hiệu
kết quả cũ. Commit thành công invalidates các nhóm catalog/price và báo tổng hợp.
Giữ font/theme hiện có và hỗ trợ light/dark qua provider; không thêm dependency.

## QA

| ID | Điều kiện | Thao tác | Kỳ vọng |
| --- | --- | --- | --- |
| IMP-01 | File CSV/XLSX hợp lệ | Preview rồi commit | Preview không lưu; commit tạo/upsert đúng |
| IMP-02 | Một dòng sai FK | Commit cả file | Rollback mọi dòng, trả lỗi dòng |
| IMP-03 | File đã preview | Đổi file | Không thể xác nhận báo cáo cũ |
| IMP-04 | Đang commit | Đóng modal/gửi lại | Bị khóa; sau thành công không gửi lại |
| IMP-05 | Subscription/License/log | Gọi import thủ công | Bị từ chối cả FE proxy và backend |
| IMP-06 | Thiếu cookie/sai origin/file lớn | Gửi upload | Bị chặn trước upstream |
| EXP-01 | Hơn 20 dòng khớp | Export CSV | Xuất đủ, giữ search/parent, không limit/offset |
| EXP-02 | Ô chứa công thức | Export/mở CSV | Thêm dấu bảo vệ, không thực thi công thức |
| EXP-03 | Lỗi upstream | Download | Không lộ SQL/token, hiển thị thông báo an toàn |

Tests mới apps/admin/tests/data-transfer.test.mjs kiểm tra proxy, allowlist, file và
MIME, fingerprint, modal pending/đổi file, cache invalidation. Harness cũ được cập
nhật để mock component tích hợp. Backend có integration PostgreSQL 16 test riêng.

Đã kiểm tra HTTP liên thông thật bằng tài khoản QA được mời: login, CSV preview
rollback/create/upsert, XLSX template/preview/commit, export theo filter và chặn
Subscription import. Không có token thật trong log/file repo. Chưa kiểm tra browser
desktop/mobile/light/dark, Excel desktop hoặc Docker runtime mới. Không deploy,
commit hoặc push tự động. Xem README để build lại FE sau khi backend có API mới.
