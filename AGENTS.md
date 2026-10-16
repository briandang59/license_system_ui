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
| `features/<domain>/columns.tsx`, `descriptions.ts` | Cấu hình cột Table và hàm tạo Descriptions items riêng của domain khi cần tách |
| `features/<domain>/handler.ts` | Kiểm tra request/cookie, gọi backend, kiểm tra response và trả HTTP response |
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
    handler.ts
  products/
    page.tsx
    form.tsx
    columns.tsx
    descriptions.ts
    schema.ts
    service.ts
    urls.ts
    handler.ts
    product-select.tsx
  companies/              # page, form, columns, descriptions, schema, service, urls, handler
  plans/                  # Cùng cấu trúc CRUD như companies
  features/               # Quản lý feature của sản phẩm; cùng cấu trúc CRUD
```

### Quy tắc đặt file và chiều phụ thuộc

- Mọi domain dùng `features/<domain>/`, bao gồm auth. Không đặt lại service domain ở `services/`, schema domain ở `lib/` hoặc URL domain trong `utils/`.
- `app/` giữ route entry, layout, providers, metadata, loading/error boundaries và styles toàn cục. Trang có nghiệp vụ gọi/re-export màn hình từ feature; trang tĩnh đơn giản có thể ở lại `app/`. Providers giữ tại `app/providers.tsx`.
- Giữ file phẳng khi feature còn nhỏ. Handler luôn đặt tại `features/<domain>/handler.ts`, ngang hàng với `schema.ts`, `service.ts`, `urls.ts`; không tạo thư mục `server/` để bọc handler. Chỉ thêm thư mục con khác khi thực tế cần, không dựng sẵn thư mục rỗng, barrel export hoặc factory.
- `components/`, `lib/`, `utils/` chứa phần dùng chung có trách nhiệm rõ ràng. Schema dùng cả client và server của cùng domain vẫn thuộc feature. Không tách type chỉ để lặp lại schema.
- Cấu hình Table/Descriptions riêng của domain đặt trong feature: `columns.tsx` export hàm nhận callbacks/trạng thái thao tác, `descriptions.ts` export hàm nhận bản ghi và trả items. Dùng types `TableProps<T>["columns"]` và `DescriptionsProps["items"]` của Ant Design; file có JSX dùng `.tsx`. State, query, mutation và điều hướng giữ ở page/hook; cấu hình không tự gọi API. Không ép columns và items dùng chung một schema; chỉ đưa formatter/UI độc lập nghiệp vụ ra dùng chung khi có nhu cầu thực tế.
- Bảng catalog hiển thị cột `#` tính bằng `offset + rowIndex + 1`; không hiển thị ID kỹ thuật (kể cả foreign key) ở Table/Descriptions. Vẫn dùng `id` cho `rowKey`, selection keys và gọi API; không thay bằng số thứ tự.
- Bảng hỗ trợ checkbox chọn nhiều dòng qua `rowSelection` được điều khiển bằng state ở page. Xóa lựa chọn khi đổi trang/từ khóa hoặc xóa thành công; không tự thêm bulk action khi chưa có yêu cầu.
- Tìm kiếm catalog chạy phía backend qua query `search`; service và handler trim rồi encode bằng `URLSearchParams`, không lọc riêng trang hiện tại. Query key chứa từ khóa đã áp dụng và offset; submit bằng Enter/nút tìm kiếm, clear để bỏ lọc và luôn reset offset về 0. Giữ truyền `AbortSignal` và trạng thái loading/empty/error/retry.
- Actions View/Edit/Delete trong bảng dùng icon `Eye`/`Pencil`/`Trash2` từ `lucide-react`, không dùng text trong nút. Icon chỉ trang trí có `aria-hidden`; nút có `aria-label` theo bản ghi và `title` mô tả. Giữ xác nhận xóa, pending/disabled và điều hướng bàn phím. Các nút toolbar/phân trang có thể giữ label kèm icon Lucide; import trực tiếp icon cần dùng, không tạo icon registry.
- Feature được import phần dùng chung; hạ tầng `lib/` và helper `utils/` không import ngược feature. Layout là điểm tích hợp được phép dùng hook/component auth; logic session thuộc `features/auth/`.
- Không import chéo nội bộ giữa các feature hoặc tạo phụ thuộc vòng. Khi cần tích hợp, dùng component có trách nhiệm rõ: `features/products/product-select.tsx` là điểm tích hợp chọn product cho forms plan/feature; không import schema/service/handler products trực tiếp từ hai feature này.
- Luồng trình duyệt: **feature UI/hook → feature service → `lib/api.ts` → `app/api/*` route → feature server handler → backend**.
- Route API khai báo HTTP methods, đọc/kiểm tra route params hoặc action rồi gọi handler. Handler kiểm tra request/response, cookie và gọi backend; không đưa logic backend vào page.
- Không gọi backend trực tiếp từ client hoặc import `features/*/handler.ts` vào client. Import trực tiếp đúng module; không gom module client và server vào một barrel. Server Component có thể gọi code server trực tiếp, không bắt gọi vòng qua API nội bộ.
- `handler.ts` chỉ chạy phía server dù nằm cùng thư mục với UI. Không thêm `"use client"` vào handler; service, UI và client hook không được import hoặc re-export handler, kể cả gián tiếp qua module dùng chung.
- Khi di chuyển file, cập nhật imports, test mocks, tài liệu và skill; bỏ đường dẫn cũ khi không có caller cần giữ. Không dùng file `test.ts` rỗng làm placeholder; test thực thi nằm trong `tests/`.

## Quy ước triển khai

- Dùng TypeScript strict, alias `@/` cho import nội bộ như code xung quanh; không dùng `any` để né lỗi type. Dữ liệu bên ngoài chưa xác thực có type `unknown`.
- Giữ Server Component mặc định; chỉ thêm `"use client"` ở nơi cần hooks, event handlers hoặc browser APIs. Giữ providers tại `app/providers.tsx` và registry/layout hiện có.
- Dùng Ant Design cho controls, React Hook Form + `zodResolver` cho form. Tái sử dụng các `Form*` trong `components/form/` (xem `components/form/README.md`) trước khi viết `Controller` riêng; không tạo thêm một form state độc lập bằng Ant Design Form.
- Dùng TanStack Query cho server state; query key chứa tham số ảnh hưởng kết quả, truyền `signal` qua service cho query và invalidate cache liên quan sau mutation thành công. State mở modal, phân trang dùng state cục bộ như trang products.
- Có trạng thái loading, empty, error/retry phù hợp; chặn gửi lặp khi pending, xác nhận trước thao tác xóa. Giữ label, thông báo lỗi truy cập được và điều hướng bàn phím.
- Lỗi API hiển thị qua `getApiErrorMessage`; không hiển thị nguyên lỗi backend hoặc thông tin nhạy cảm.
- Phản hồi thao tác tạo/sửa/xóa và xác thực dùng `App.useApp().message` của Ant Design; `App` nằm trong `ConfigProvider` tại `app/providers.tsx` để nhận theme. Không gọi static `message.*` hoặc tự thêm thư viện toast. Báo một lần cho mỗi thao tác; thao tác nhiều mục báo kết quả tổng hợp theo số thành công/thất bại. Validation vẫn hiển thị tại field; lỗi tải dữ liệu dùng Alert và Retry tại vùng dữ liệu. Không hiện đồng thời toast và Alert giống nhau cho cùng một lỗi thao tác.
- Chỉ tách component/helper khi có trách nhiệm rõ hoặc tái sử dụng thực tế; không tạo sẵn hook/service/repository factory cho tính năng chưa tồn tại.

## Thiết kế giao diện và dark mode

- Chủ đề đã chọn: **light mode thiên xanh lá cây, dark mode thiên tím**. Light dùng accent xanh lá trầm `#167047`, canvas `#F3F8F4`, surface `#FFFFFF`, chữ `#182C23`, chữ phụ `#52695C`, viền `#D7E5DB`; dark dùng accent tím sáng `#C4A0F2`, canvas tím than `#17121F`, surface `#211A2C`, chữ `#F0EAF7`, chữ phụ `#B8ABC9`, viền `#493A5B`. Các sắc hover/selected/elevated cùng họ màu; đồng bộ Ant Design tokens và CSS variables. Không tự quay lại chủ đề xanh dương hoặc thêm màu nhấn chủ đạo khác. Giữ màu trạng thái success/warning/error theo ý nghĩa, không đổi toàn bộ thành màu accent.
- Khi xây dựng hoặc chỉnh bố cục/giao diện, đọc skill [.agents/skills/frontend-design/SKILL.md](.agents/skills/frontend-design/SKILL.md) cùng skill repository. Áp dụng nguyên tắc thiết kế trong giới hạn Ant Design và kiến trúc hiện có; không thay bộ controls, thêm dependency hoặc thiết kế lại toàn ứng dụng chỉ để đổi một màn hình.
- Trước khi viết UI, trình bày ngắn hướng thiết kế: tác vụ chính, thứ bậc thông tin, bố cục căn chỉnh, typography, khoảng cách và 4–6 màu chủ đạo có vai trò rõ ở cả light/dark. Tự đối chiếu với yêu cầu rồi triển khai trong phạm vi đã được giao; không cần thêm vòng duyệt nếu người dùng đã cho phép làm.
- Định hướng sản phẩm là workspace quản trị license: rõ ràng, chính xác, dễ quét dữ liệu và cấu hình quyền lợi. Tạo chất lượng qua typography, căn chỉnh, mật độ thông tin và trạng thái thao tác; tránh trang trí không phục vụ tác vụ như gradient nền, card lồng card, icon lớn trong mọi tiêu đề hoặc badge cho mọi giá trị.
- Dùng thang chữ và spacing nhất quán; ưu tiên font đang có, chỉ đổi/thêm font khi có lý do cụ thể và thuộc phạm vi yêu cầu. Giữ UI sentence case và ngôn ngữ hiện có; code nghiệp vụ vẫn giữ nguyên cách viết. Nội dung hướng dẫn ngắn, nằm gần thao tác cần giải thích.
- Bảng/modal cấu hình phải gọn và ổn định: có thể gom tên/code theo thứ bậc chính/phụ, đặt controls liên quan cạnh nhau khi đủ chỗ và không lặp tên bản ghi trong mọi label nhìn thấy. Vẫn giữ accessible name theo bản ghi, lỗi theo field, quy ước cột `#`, selection và actions đã nêu. Danh sách dài cuộn trong vùng phù hợp; footer và hành động chính dễ tìm trên màn hình nhỏ.
- UI mới hoặc được thiết kế lại phải hỗ trợ light và dark. Với UI cũ ngoài phạm vi, ghi rõ giới hạn còn lại; không tuyên bố toàn ứng dụng đã hỗ trợ dark mode khi mới sửa một component.
- Khi triển khai theme, tích hợp tại `app/providers.tsx` bằng `ConfigProvider` và `theme.defaultAlgorithm` / `theme.darkAlgorithm` của Ant Design; giữ QueryClientProvider và registry hiện có. Các provider theme cục bộ chỉ ghi đè token thực sự cần, không áp lại bảng màu sáng làm mất theme cha.
- Dùng semantic tokens cho màu nền trang, bề mặt, chữ chính/phụ, viền, accent và trạng thái. Controls dùng Ant Design tokens; phần UI tự viết dùng `theme.useToken()` hoặc CSS variables ánh xạ nhất quán với theme. Không rải màu hex hoặc utility màu chỉ đúng ở light mode vào từng component; token cho hover/selected/disabled/error cũng phải phù hợp cả hai theme. Màu cố định của tài nguyên thương hiệu chỉ dùng khi đã kiểm tra trên cả hai nền.
- Khi làm tính năng đổi theme, có lựa chọn Light/Dark/System, mặc định System nếu chưa có lựa chọn đã lưu; chỉ theo thay đổi hệ điều hành khi ở System. Có thể lưu riêng tùy chọn giao diện trong localStorage; không liên quan token đăng nhập. Xử lý SSR/hydration và màu nền ban đầu để tránh hydration mismatch hoặc chớp nền sáng; không dùng `suppressHydrationWarning` để che lỗi chưa hiểu rõ.
- Theme phải phủ cả layout, bảng, forms, dropdown, tooltip, modal/drawer và các popup render qua portal. Không chỉ đổi nền trang hoặc đảo màu bằng CSS filter. Hạn chế selectors phụ thuộc class nội bộ Ant Design; ưu tiên component props, theme tokens và styles được hỗ trợ.
- Giữ tương phản chữ thường tối thiểu 4.5:1, focus bàn phím nhìn rõ và không dùng màu làm tín hiệu duy nhất. Kiểm tra hover/selected/disabled/error/loading/empty, nội dung dài, zoom và bố cục mobile; animation ngắn phục vụ phản hồi thao tác và tôn trọng `prefers-reduced-motion`.
- Khi sửa UI, xem và tự đánh giá ảnh chụp light/dark trên desktop/mobile nếu có môi trường truy cập được; kiểm tra cả trạng thái đã chọn và lỗi validation, không chỉ màn hình trống. Nếu thiếu phiên đăng nhập hoặc không chạy được browser, báo rõ phần chưa kiểm tra; không bỏ qua xác thực hoặc tạo đường truy cập thử trong sản phẩm.

## Ràng buộc API và xác thực

- `API_BASE_URL` chỉ dùng phía server; không đổi thành biến `NEXT_PUBLIC_*`. Không đọc/in giá trị bí mật từ `.env*`; khi cần cấu hình mới chỉ thêm tên và giá trị mẫu an toàn vào `.env.example`.
- Access token (`access_token`) và refresh token (`license_refresh`) nằm trong HttpOnly cookies; không trả token về JavaScript, lưu vào localStorage/sessionStorage hoặc query cache, hay ghi log token/password.
- Giữ cookie `sameSite: "lax"`, `path: "/"`, `secure` trong production và thời hạn theo contract hiện có. Không đổi vòng đời phiên đăng nhập khi chưa có yêu cầu.
- `proxy.ts` chỉ kiểm tra sự hiện diện cookie để redirect; backend vẫn phải xác thực token và quyền. Không thay Proxy bằng `middleware.ts` theo ví dụ Next.js cũ.
- Giữ kiểm tra same-origin cho request thay đổi dữ liệu; kiểm tra cookie, methods, params, query và body trước khi gọi backend. Dùng Zod cho body/response theo domain; không tin type assertion thay cho runtime validation.
- Backend fetch giữ timeout và `cache: "no-store"`; response dữ liệu nhạy cảm không được cache công khai. Giữ mã HTTP, error code và response envelope tương thích với callers.
- `api<T>` trả phần `data`, không trả cả envelope. Response `204` dùng `api<void>` và không parse JSON; không ép endpoint trả JSON nếu contract không có body.
- Refresh hiện được gọi tường minh, không tự thêm retry/refresh khi gặp 401. Logout lỗi giữ session để thử lại; logout thành công hủy query đang chạy, xóa cache và điều hướng như hiện tại.
- Contract catalog tham chiếu Swagger `/swagger/openapi.json`: company cho sửa code; plan không cho sửa code/product; feature cho sửa product/code/type nhưng backend có thể từ chối khi đã được tham chiếu. Trường nullable gửi `null` để xóa, không đổi các giá trị thiếu thành null trong PATCH. Danh sách dùng offset, không có total. Quản lý liên kết plan-feature là endpoint riêng, không ghép vào payload plan.

## Kiểm tra và bàn giao

- Dùng `pnpm` và giữ `pnpm-lock.yaml` đồng bộ nếu dependency thực sự thay đổi.
- Với thay đổi logic, thêm/cập nhật test hành vi nhỏ cho nhánh thay đổi và trường hợp lỗi quan trọng; dùng test runner hiện có, không thêm framework chỉ cho vài test.
- Với code thay đổi, chạy `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`; chạy `pnpm build` khi ảnh hưởng routing, providers, cấu hình hoặc ranh giới server/client. Kiểm tra UI trong trình duyệt khi sửa hành vi/layout và có môi trường chạy được.
- Nếu chỉ sửa tài liệu/skill, kiểm tra nội dung, đường dẫn và skill validator; không cần build ứng dụng.
- Báo cáo file đã sửa, kết quả kiểm tra và phần chưa kiểm tra/rủi ro thực tế. Không tuyên bố test/build thành công nếu chưa chạy.
