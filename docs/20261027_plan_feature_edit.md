# Sửa Feature đã gắn vào Plan — 2026-10-27

Yêu cầu: cho phép sửa hạn mức chưa cấu hình, hạn mức hiện tại và enabled ngay trên
bảng Feature của Plan. Tái sử dụng API backend đã có:
`PATCH /api/v1/plans/{planId}/features/{featureId}`; featureId là ID Feature, không
phải ID dòng liên kết. Không đổi schema DB hoặc contract backend/Swagger hiện hành.

Luồng FE: IncludedFeatures → PlanFeatureEditor → planService.updateFeature →
same-origin route PATCH → handlePlan → backend. Cookie HttpOnly và Bearer server-side
giữ nguyên; proxy kiểm tra origin, phiên, cả hai ID và payload strict trước fetch.
Response được kiểm tra schema và đúng plan_id/feature_id, giữ no-store/timeout.

Form RHF/Zod điền sẵn enabled/limit. Quantity nhận số nguyên không âm tới
Number.MAX_SAFE_INTEGER; trống gửi null, 0 được giữ. Boolean/unlimited chỉ gửi enabled,
không tự thay đổi limit. Quy tắc type và same-product cuối cùng vẫn do backend bảo vệ.

Trong lúc lưu chặn submit lặp, đóng modal và controls. API lỗi báo message an toàn,
giữ form để thử lại. Thành công báo một lần, invalidate nhóm plans (cả list/detail/
assigned features) rồi đóng form. Mở lại đọc giá trị từ dữ liệu đã tải lại.

Chức năng có tại dòng Plan mở rộng, View và Configure features. Không bổ sung xóa
liên kết. Bố cục dùng Ant Design/theme hiện có; chưa kiểm tra browser desktop/mobile.

Evidence: tests/plan-features.test.mjs kiểm tra null/0/false, scope ID, origin/session,
response lỗi, service/route forwarding, prefill/pending và cache invalidation.
