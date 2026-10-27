---
name: license-system-ui
description: Phát triển hoặc sửa tính năng trong repository license-system-ui theo kiến trúc Next.js App Router, Ant Design, React Hook Form, Zod và TanStack Query hiện có. Dùng khi sửa UI, service, API route, server handler hoặc xác thực của repo này.
---

# Phát triển license-system-ui

Toàn bộ UI admin/public và nội dung trợ năng phải bằng tiếng Việt theo AGENTS.md.
Dùng locale tiếng Việt của Ant Design/Zod. Số/tiền dùng dấu phẩy phân cách hàng nghìn (20,000,000); ngày giờ dùng DatePicker/Dayjs theo Asia/Ho_Chi_Minh, định dạng DD/MM/YYYY HH:mm. ISO có offset chỉ dùng tại API/import/export theo AGENTS.md. Giữ code, route,
API, enum request và dữ liệu người dùng nguyên vẹn; chỉ dịch nhãn hiển thị.

Skill nằm tại `.agents/skills/license-system-ui/` trong repository. Xác định repo root qua `AGENTS.md` và `package.json`; đọc [AGENTS.md](../../../AGENTS.md) để lấy rules chung. Không áp dụng cấu trúc này sang repo khác chỉ vì cùng dùng Next.js.

## Khoanh vùng trước khi sửa

1. Đọc `git status --short`, yêu cầu và file liên quan. Tìm callers bằng `rg` để biết đầy đủ trang, service, schema, route, handler, URL constant và test bị ảnh hưởng; không bắt buộc sửa mọi tầng nếu nhiệm vụ chỉ chạm một tầng.
2. Kiểm tra versions/scripts trong `package.json`. Với Next.js, đọc guide phù hợp trong `node_modules/next/dist/docs/` trước khi viết code; không dựa vào trí nhớ về phiên bản cũ. Nếu dependency/docs chưa có, báo rõ và dùng tài liệu chính thức đúng phiên bản khi có thể.
3. Đối chiếu flow gần nhất: products cho CRUD; auth cho login/logout/refresh. Đọc file hiện tại, không sao chép mù quáng hoặc xem giới hạn/bug của ví dụ là contract bắt buộc.

## Chọn file theo công việc

- **CRUD hoặc dữ liệu domain:** đọc `features/products/schema.ts`, `features/products/service.ts`, `features/products/urls.ts`, `app/api/products/route.ts`, `app/api/products/[id]/route.ts`, `features/products/handler.ts` và `features/products/page.tsx` khi cần từng tầng. `app/(dashboard)/products/page.tsx` chỉ nối route tới feature.
- **Form:** đọc `components/form/README.md`, control liên quan và `features/products/form.tsx` hoặc `features/auth/login-page.tsx`. Tái sử dụng `Form*` với `control`, `name`, `label`; `FormField` dùng chung phần label/lỗi/accessibility. Schema domain nằm trong `features/<domain>/schema.ts`, types suy ra từ schema. Giữ validation phía server dù client đã validate.
- **Xác thực:** đọc `features/auth/handler.ts`, `features/auth/service.ts`, `features/auth/schema.ts`, `features/auth/urls.ts`, `features/auth/use-logout.ts`, `proxy.ts`, `components/layouts/admin-layout.tsx` và `tests/auth.test.mjs`; giữ các ràng buộc bảo mật và hành vi session trong `AGENTS.md`.
- **Bố cục/provider:** đọc `app/layout.tsx`, `app/providers.tsx`, layout của route group và `components/layouts/` liên quan; không bọc thêm QueryClientProvider hoặc layout trùng lặp.
- **Table/Descriptions:** đọc `features/products/columns.tsx`, `features/products/descriptions.ts` và caller `features/products/page.tsx`. Cấu hình thuộc feature; columns nhận callbacks/trạng thái, descriptions nhận bản ghi. Giữ state/query/mutation ở page/hook, dùng types Ant Design và `.tsx` khi có JSX. Không tạo schema cấu hình chung cho columns và items hoặc đưa cấu hình domain vào `utils/`.
- **Quy ước bảng catalog:** ẩn mọi ID kỹ thuật ở Table/Descriptions, cột `#` dùng offset + index + 1 nhưng `rowKey`/API/selection vẫn dùng id. Dùng checkbox `rowSelection` có state, xóa selection khi đổi trang/tìm kiếm hoặc xóa thành công. Search chạy qua service/handler tới backend với `URLSearchParams`, query key chứa search/offset và giữ signal; submit/clear reset offset. Actions bảng dùng icon Lucide có aria-label/title, giữ confirmation/pending; toolbar có thể giữ label kèm icon. Xem chi tiết trong `AGENTS.md`.
- **Company/plan/feature:** đọc các module tương ứng tại `features/companies/`, `features/plans/`, `features/features/` và contract Swagger `/swagger/openapi.json`. Company sửa được code; plan giữ nguyên code/product khi update; feature có product/type/unit. Form dùng `*FormSchema` cho giá trị controls, request dùng `*InputSchema`/`*UpdateSchema`, response dùng schema riêng. Dùng `features/products/product-select.tsx` làm điểm tích hợp chọn product, không import trực tiếp nội bộ products từ các feature khác.

## Thực hiện thay đổi đủ luồng

- Xác minh contract backend trước khi thêm endpoint/field: method, URL, payload, response, lỗi, phân trang. Nếu thiếu contract, tìm trong code/tài liệu sẵn có; hỏi phần thiếu quyết định hành vi thay vì tự bịa API.
- Mọi domain dùng `features/<domain>/`: UI, schema/type, URL, service, hook và `handler.ts`. Đọc mục cấu trúc trong `AGENTS.md` trước khi đặt file; dùng auth/products làm mẫu. Phần dùng chung giữ tại `lib/`, `utils/`, `components/`; `app/` giữ route/layout/providers. Không thêm lại `services/` ở root, schema domain trong `lib/` hoặc URL domain trong `utils/`. Route HTTP mỏng gọi feature server handler; không đưa logic backend vào page.
- Đặt handler trực tiếp tại `features/<domain>/handler.ts`, ngang hàng với `schema.ts`, `service.ts`, `urls.ts`; không tạo thư mục `server/`. Handler chỉ chạy phía server, không được import/re-export trực tiếp hoặc gián tiếp từ service, UI hay client hook. Khi đổi vị trí handler, cập nhật cả API routes và đường dẫn/mock imports trong tests.
- Với dynamic route, đọc tài liệu `01-app/03-api-reference/03-file-conventions/route.md`; mẫu hiện tại dùng `params: Promise<...>` và `await params`. Không đổi về params đồng bộ theo hướng dẫn cũ.
- Client query gọi service, truyền AbortSignal, dùng query key đủ tham số. Mutation thành công invalidate nhóm dữ liệu liên quan; lỗi giữ form và dữ liệu để thử lại.
- Giữ đúng khác biệt create/update thay vì gửi nguyên object từ form. Ví dụ hiện tại product `code` chỉ được đặt khi create, update gửi `ProductUpdate`; danh sách dùng offset với page size 20 và không có total. Không tự thêm/suy ra total hoặc cho sửa code nếu backend chưa hỗ trợ.
- Khi sửa shared helper/contract, cập nhật mọi caller và test chịu ảnh hưởng trong cùng thay đổi. Không tạo tầng trung gian chỉ để chuyển tiếp một lời gọi đã rõ.

## Kiểm tra theo thay đổi

Dùng quy trình kiểm tra trong `AGENTS.md`. Test hiện tại dùng `node:test`, mock `fetch` và transpile TypeScript qua `typescript`; tái sử dụng cách này khi phù hợp, không cần thêm test framework.

Với handler/API, chọn test theo rủi ro thay đổi: input/params không hợp lệ không gọi backend, request thiếu phiên hoặc sai origin bị chặn, upstream lỗi/response sai schema được xử lý, `204` không parse JSON. Với auth, kiểm tra cookie và việc không lộ token khi thay đổi flow đó. Với UI, kiểm tra submit pending, lỗi giữ dữ liệu và cập nhật danh sách sau lưu/xóa khi liên quan.

Kết thúc bằng báo cáo ngắn bằng tiếng Việt: hành vi đã đổi, file chính, lệnh đã chạy/kết quả, phần chưa kiểm tra và rủi ro có bằng chứng. Chỉ cập nhật rules/skill khi thay đổi kiến trúc hoặc quy ước trong phạm vi yêu cầu làm chúng không còn đúng.

## Workspace apps (20261027)

App root cho các đường dẫn feature/app/tests phía trên là `apps/admin/`. Website public nằm tại `apps/web/`, không phụ thuộc admin auth. Kiểm tra cả hai app khi thay đổi monorepo; cấu hình build/deploy ở repo root.
