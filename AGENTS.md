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
| `app/(dashboard)/` | Route/layout quản trị; trang products nối tới feature, overview đơn giản ở lại đây |
| `app/auth/` | Route/layout xác thực; trang login nối tới `features/auth/login-page.tsx` |
| `app/api/**/route.ts` | Khai báo HTTP methods, đọc route params và gọi server handler |
| `features/<domain>/*page.tsx`, `form.tsx` | Màn hình và form riêng của domain |
| `features/<domain>/schema.ts` | Zod schemas và types suy ra bằng `z.infer`, dùng cả client và server trong domain |
| `features/<domain>/service.ts` | Gọi API same-origin qua `api<T>`; không chứa UI, cookie/token logic |
| `features/<domain>/urls.ts` | Đường dẫn API same-origin của domain |
| `features/<domain>/use-*.ts` | Hook nghiệp vụ khi cần, ví dụ auth logout |
| `features/<domain>/server/handler.ts` | Kiểm tra request/cookie, gọi backend, kiểm tra response và trả HTTP response |
| `lib/api.ts`, `lib/api-errors.ts`, `lib/baseResponse.ts` | HTTP client, lỗi và response contract dùng chung |
| `components/form/`, `components/layouts/` | Form controls và layouts tái sử dụng |
| `components/ui/` | UI dùng chung khi thực sự có nhu cầu tái sử dụng |
| `utils/functions/`, `utils/hooks/`, `utils/constants/` | Hàm thuần/hook/hằng số độc lập nghiệp vụ dùng chung; chỉ tạo thư mục khi có file thực tế |
| `tests/*.test.mjs` | Tests với `node:test` và `node:assert/strict` |
| `public/` | Tài nguyên tĩnh |
| `.agents/skills/` | Hướng dẫn thao tác theo repository |
| `proxy.ts` | Redirect theo sự hiện diện cookie |
| File cấu hình ở root | Next.js, TypeScript, ESLint, pnpm và Docker |

### Cấu trúc feature hiện tại

```text
features/
  auth/
    login-page.tsx
    use-logout.ts
    schema.ts
    service.ts
    urls.ts
    server/handler.ts
  products/
    page.tsx
    form.tsx
    schema.ts
    service.ts
    urls.ts
    server/handler.ts
```

### Quy tắc đặt file và chiều phụ thuộc

- Mọi domain dùng `features/<domain>/`, bao gồm auth. Không đặt lại service domain ở `services/`, schema domain ở `lib/` hoặc URL domain trong `utils/`.
- `app/` giữ route entry, layout, providers, metadata, loading/error boundaries và styles toàn cục. Trang có nghiệp vụ gọi/re-export màn hình từ feature; trang tĩnh đơn giản có thể ở lại `app/`. Providers giữ tại `app/providers.tsx`.
- Giữ file phẳng khi feature còn nhỏ; code chỉ chạy server đặt trong `server/`. Chỉ thêm thư mục con khi thực tế cần, không dựng sẵn thư mục rỗng, barrel export hoặc factory.
- `components/`, `lib/`, `utils/` chứa phần dùng chung có trách nhiệm rõ ràng. Schema dùng cả client và server của cùng domain vẫn thuộc feature. Không tách type chỉ để lặp lại schema.
- Feature được import phần dùng chung; hạ tầng `lib/` và helper `utils/` không import ngược feature. Layout là điểm tích hợp được phép dùng hook/component auth; logic session thuộc `features/auth/`.
- Không import chéo nội bộ giữa các feature hoặc tạo phụ thuộc vòng. Nếu cần chia sẻ thật, xác định phần dùng chung hoặc điểm tích hợp trước.
- Luồng trình duyệt: **feature UI/hook → feature service → `lib/api.ts` → `app/api/*` route → feature server handler → backend**.
- Route API khai báo HTTP methods, đọc/kiểm tra route params hoặc action rồi gọi handler. Handler kiểm tra request/response, cookie và gọi backend; không đưa logic backend vào page.
- Không gọi backend trực tiếp từ client hoặc import `features/*/server/*` vào client. Import trực tiếp đúng module; không gom module client và server vào một barrel. Server Component có thể gọi code server trực tiếp, không bắt gọi vòng qua API nội bộ.
- Khi di chuyển file, cập nhật imports, test mocks, tài liệu và skill; bỏ đường dẫn cũ khi không có caller cần giữ. Không dùng file `test.ts` rỗng làm placeholder; test thực thi nằm trong `tests/`.

## Quy ước triển khai

- Dùng TypeScript strict, alias `@/` cho import nội bộ như code xung quanh; không dùng `any` để né lỗi type. Dữ liệu bên ngoài chưa xác thực có type `unknown`.
- Giữ Server Component mặc định; chỉ thêm `"use client"` ở nơi cần hooks, event handlers hoặc browser APIs. Giữ providers tại `app/providers.tsx` và registry/layout hiện có.
- Dùng Ant Design cho controls, React Hook Form + `zodResolver` cho form. Tái sử dụng các `Form*` trong `components/form/` (xem `components/form/README.md`) trước khi viết `Controller` riêng; không tạo thêm một form state độc lập bằng Ant Design Form.
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
