<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Phạm vi và cách làm việc

- Rules này áp dụng cho toàn bộ repository. Khi phát triển hoặc sửa tính năng, đọc skill [.agents/skills/license-system-ui/SKILL.md](.agents/skills/license-system-ui/SKILL.md).
- Trao đổi và báo cáo bằng tiếng Việt; giữ tên code bằng tiếng Anh và ngôn ngữ UI hiện có trừ khi được yêu cầu đổi.
- Đọc code liên quan và tìm mọi nơi gọi trước khi sửa contract dùng chung. Giữ nguyên thay đổi có sẵn của người dùng ngoài phạm vi công việc.
- Chọn thay đổi nhỏ nhất giải quyết đủ yêu cầu. Tái sử dụng code và dependency đã có; không tự thêm tầng kiến trúc, dependency, tính năng hoặc refactor ngoài phạm vi.
- Không sửa file sinh tự động trong `.next/`, `node_modules/`, `next-env.d.ts`, `*.tsbuildinfo`. Giữ nguyên block Next.js phía trên.

## Cấu trúc và trách nhiệm

| Vị trí | Trách nhiệm |
| --- | --- |
| `app/(dashboard)/` | Trang quản trị; dùng layout quản trị hiện có |
| `app/auth/` | Trang xác thực; dùng layout xác thực hiện có |
| `app/api/**/route.ts` | Khai báo HTTP methods, đọc route params và gọi server handler |
| `lib/server/*-handler.ts` | Kiểm tra request, cookie, gọi backend, kiểm tra response và trả HTTP response |
| `services/*.service.ts` | Hàm gọi API same-origin qua `api<T>`; không chứa UI hoặc cookie/token logic |
| `lib/*-schema.ts` | Zod schemas và types suy ra bằng `z.infer` |
| `lib/api.ts`, `lib/api-errors.ts`, `lib/baseResponse.ts` | HTTP client, lỗi và response contract dùng chung |
| `components/form/`, `components/layouts/` | Form controls và layouts tái sử dụng |
| `components/ui/` | UI dùng chung khi thực sự có nhu cầu tái sử dụng |
| `utils/constants/urls.ts` | Đường dẫn API cho services |
| `utils/hooks/`, `utils/functions/` | Hook/helper dùng chung khi cần; các file `test.ts` không phải mẫu nghiệp vụ |
| `tests/*.test.mjs` | Tests với `node:test` và `node:assert/strict` |

Luồng gọi API từ trình duyệt: **page/component → service → `api<T>` → `/api/*` route → server handler → backend**. Không gọi backend trực tiếp từ client, không import `lib/server/*` vào client. Không bắt Server Component gọi vòng qua API nội bộ nếu không cần.

## Quy ước triển khai

- Dùng TypeScript strict, alias `@/` cho import nội bộ như code xung quanh; không dùng `any` để né lỗi type. Dữ liệu bên ngoài chưa xác thực có type `unknown`.
- Giữ Server Component mặc định; chỉ thêm `"use client"` ở nơi cần hooks, event handlers hoặc browser APIs. Giữ providers tại `app/providers.tsx` và registry/layout hiện có.
- Dùng Ant Design cho controls, React Hook Form + `zodResolver` cho form, `FormInput` cho input chuỗi. Dùng `Controller` cho control khác; không tạo thêm một form state độc lập bằng Ant Design Form.
- Dùng TanStack Query cho server state; query key chứa tham số ảnh hưởng kết quả, truyền `signal` qua service cho query và invalidate cache liên quan sau mutation thành công. State mở modal, phân trang dùng state cục bộ như trang products.
- Có trạng thái loading, empty, error/retry phù hợp; chặn gửi lặp khi pending, xác nhận trước thao tác xóa. Giữ label, thông báo lỗi truy cập được và điều hướng bàn phím.
- Lỗi API hiển thị qua `getApiErrorMessage`; không hiển thị nguyên lỗi backend hoặc thông tin nhạy cảm.
- Chỉ tách component/helper khi có trách nhiệm rõ hoặc tái sử dụng thực tế; không tạo sẵn hook/service/repository factory cho tính năng chưa tồn tại.

## Ràng buộc API và xác thực

- `API_BASE_URL` chỉ dùng phía server; không đổi thành biến `NEXT_PUBLIC_*`. Không đọc/in giá trị bí mật từ `.env*`; khi cần cấu hình mới chỉ thêm tên và giá trị mẫu an toàn vào `.env.example`.
- Access token (`access_token`) và refresh token (`license_refresh`) nằm trong HttpOnly cookies; không trả token về JavaScript, lưu vào localStorage/sessionStorage hoặc query cache, hay ghi log token/password.
- Giữ cookie `sameSite: "lax"`, `path: "/"`, `secure` trong production và thời hạn theo contract hiện có. Không đổi vòng đời phiên đăng nhập khi chưa có yêu cầu.
- `proxy.ts` chỉ kiểm tra sự hiện diện cookie để redirect; backend vẫn phải xác thực token và quyền. Không thay Proxy bằng `middleware.ts` theo ví dụ Next.js cũ.
- Giữ kiểm tra same-origin cho request thay đổi dữ liệu; kiểm tra cookie, methods, params, query và body trước khi gọi backend. Dùng Zod cho body/response theo domain; không tin type assertion thay cho runtime validation.
- Backend fetch giữ timeout và `cache: "no-store"`; response dữ liệu nhạy cảm không được cache công khai. Giữ mã HTTP, error code và response envelope tương thích với callers.
- `api<T>` trả phần `data`, không trả cả envelope. Response `204` dùng `api<void>` và không parse JSON; không ép endpoint trả JSON nếu contract không có body.
- Refresh hiện được gọi tường minh, không tự thêm retry/refresh khi gặp 401. Logout lỗi giữ session để thử lại; logout thành công hủy query đang chạy, xóa cache và điều hướng như hiện tại.

## Kiểm tra và bàn giao

- Dùng `pnpm` và giữ `pnpm-lock.yaml` đồng bộ nếu dependency thực sự thay đổi.
- Với thay đổi logic, thêm/cập nhật test hành vi nhỏ cho nhánh thay đổi và trường hợp lỗi quan trọng; dùng test runner hiện có, không thêm framework chỉ cho vài test.
- Với code thay đổi, chạy `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`; chạy `pnpm build` khi ảnh hưởng routing, providers, cấu hình hoặc ranh giới server/client. Kiểm tra UI trong trình duyệt khi sửa hành vi/layout và có môi trường chạy được.
- Nếu chỉ sửa tài liệu/skill, kiểm tra nội dung, đường dẫn và skill validator; không cần build ứng dụng.
- Báo cáo file đã sửa, kết quả kiểm tra và phần chưa kiểm tra/rủi ro thực tế. Không tuyên bố test/build thành công nếu chưa chạy.
