---
name: license-system-ui
description: Phát triển hoặc sửa tính năng trong repository license-system-ui theo kiến trúc Next.js App Router, Ant Design, React Hook Form, Zod và TanStack Query hiện có. Dùng khi sửa UI, service, API route, server handler hoặc xác thực của repo này.
---

# Phát triển license-system-ui

Skill nằm tại `.agents/skills/license-system-ui/` trong repository. Xác định repo root qua `AGENTS.md` và `package.json`; đọc [AGENTS.md](../../../AGENTS.md) để lấy rules chung. Không áp dụng cấu trúc này sang repo khác chỉ vì cùng dùng Next.js.

## Khoanh vùng trước khi sửa

1. Đọc `git status --short`, yêu cầu và file liên quan. Tìm callers bằng `rg` để biết đầy đủ trang, service, schema, route, handler, URL constant và test bị ảnh hưởng; không bắt buộc sửa mọi tầng nếu nhiệm vụ chỉ chạm một tầng.
2. Kiểm tra versions/scripts trong `package.json`. Với Next.js, đọc guide phù hợp trong `node_modules/next/dist/docs/` trước khi viết code; không dựa vào trí nhớ về phiên bản cũ. Nếu dependency/docs chưa có, báo rõ và dùng tài liệu chính thức đúng phiên bản khi có thể.
3. Đối chiếu flow gần nhất: products cho CRUD; auth cho login/logout/refresh. Đọc file hiện tại, không sao chép mù quáng hoặc xem giới hạn/bug của ví dụ là contract bắt buộc.

## Chọn file theo công việc

- **CRUD hoặc dữ liệu domain:** đọc `lib/product-schema.ts`, `services/product.service.ts`, `utils/constants/urls.ts`, `app/api/products/route.ts`, `app/api/products/[id]/route.ts`, `lib/server/product-handler.ts` và `app/(dashboard)/products/page.tsx` khi cần từng tầng.
- **Form:** đọc `components/form/form-input.tsx` và form tại `app/auth/login/page.tsx`; schema dùng chung nằm trong `lib/`, types suy ra từ schema. Giữ validation phía server dù client đã validate.
- **Xác thực:** đọc `lib/server/auth-handler.ts`, `services/auth.service.ts`, `lib/auth-schema.ts`, `proxy.ts`, `components/layouts/admin-layout.tsx` và `tests/auth.test.mjs`; giữ các ràng buộc bảo mật và hành vi session trong `AGENTS.md`.
- **Bố cục/provider:** đọc `app/layout.tsx`, `app/providers.tsx`, layout của route group và `components/layouts/` liên quan; không bọc thêm QueryClientProvider hoặc layout trùng lặp.

## Thực hiện thay đổi đủ luồng

- Xác minh contract backend trước khi thêm endpoint/field: method, URL, payload, response, lỗi, phân trang. Nếu thiếu contract, tìm trong code/tài liệu sẵn có; hỏi phần thiếu quyết định hành vi thay vì tự bịa API.
- Với API mới, đặt schema và type ở `lib/<domain>-schema.ts`, URL tại `utils/constants/urls.ts`, hàm gọi ở `services/<domain>.service.ts`. Route HTTP mỏng gọi handler tương ứng ở `lib/server/`; không đưa logic backend vào page.
- Với dynamic route, đọc tài liệu `01-app/03-api-reference/03-file-conventions/route.md`; mẫu hiện tại dùng `params: Promise<...>` và `await params`. Không đổi về params đồng bộ theo hướng dẫn cũ.
- Client query gọi service, truyền AbortSignal, dùng query key đủ tham số. Mutation thành công invalidate nhóm dữ liệu liên quan; lỗi giữ form và dữ liệu để thử lại.
- Giữ đúng khác biệt create/update thay vì gửi nguyên object từ form. Ví dụ hiện tại product `code` chỉ được đặt khi create, update gửi `ProductUpdate`; danh sách dùng offset với page size 20 và không có total. Không tự thêm/suy ra total hoặc cho sửa code nếu backend chưa hỗ trợ.
- Khi sửa shared helper/contract, cập nhật mọi caller và test chịu ảnh hưởng trong cùng thay đổi. Không tạo tầng trung gian chỉ để chuyển tiếp một lời gọi đã rõ.

## Kiểm tra theo thay đổi

Dùng quy trình kiểm tra trong `AGENTS.md`. Test hiện tại dùng `node:test`, mock `fetch` và transpile TypeScript qua `typescript`; tái sử dụng cách này khi phù hợp, không cần thêm test framework.

Với handler/API, chọn test theo rủi ro thay đổi: input/params không hợp lệ không gọi backend, request thiếu phiên hoặc sai origin bị chặn, upstream lỗi/response sai schema được xử lý, `204` không parse JSON. Với auth, kiểm tra cookie và việc không lộ token khi thay đổi flow đó. Với UI, kiểm tra submit pending, lỗi giữ dữ liệu và cập nhật danh sách sau lưu/xóa khi liên quan.

Kết thúc bằng báo cáo ngắn bằng tiếng Việt: hành vi đã đổi, file chính, lệnh đã chạy/kết quả, phần chưa kiểm tra và rủi ro có bằng chứng. Chỉ cập nhật rules/skill khi thay đổi kiến trúc hoặc quy ước trong phạm vi yêu cầu làm chúng không còn đúng.
