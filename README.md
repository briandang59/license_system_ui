This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Cấu trúc mã nguồn

- `app/`: Next.js routes, API route entry, layouts và providers.
- `features/auth/`: login, logout, schema, service, URL và server handler xác thực.
- `features/products/`: UI CRUD, schema, service, URL và server handler products.
- `components/`: form controls và layouts dùng chung.
- `lib/`: HTTP client, response contract và ánh xạ lỗi.
- `utils/`: helpers độc lập nghiệp vụ dùng chung.
- `tests/`: tests chạy bằng `node:test`.

Quy tắc đặt file, chiều phụ thuộc và kiểm tra nằm trong [AGENTS.md](AGENTS.md).
Hướng dẫn triển khai theo repository nằm trong [skill license-system-ui](.agents/skills/license-system-ui/SKILL.md).
Code riêng của domain nằm trong feature, kể cả schema/URL được cả client và server dùng. Handler đặt trực tiếp tại `features/<domain>/handler.ts`, ngang hàng với `schema.ts`, `service.ts`, `urls.ts`; không có thư mục `server/`. Handler chỉ chạy phía server và không được import vào client.

## Getting Started

### Docker

Build và chạy UI production bằng Docker Compose (Linux containers):

```bash
docker compose up -d --build
```

Mở `http://localhost:3000`. Xem log bằng `docker compose logs -f ui`; dừng bằng `docker compose down`.

Compose mặc định gọi backend trên máy host tại `http://host.docker.internal:5000/api/v1`. `localhost` bên trong container là chính container, không phải máy host. Backend cần lắng nghe trên interface mà container truy cập được. Nếu backend ở máy khác hoặc container cùng network, đặt `DOCKER_API_BASE_URL` thành URL phù hợp.

Có thể đặt `DOCKER_API_BASE_URL` và `UI_PORT` trong file `.env` tại repo root (xem `.env.example`). Các giá trị này được Compose truyền lúc chạy; file `.env*` thực tế không được đưa vào image. `API_BASE_URL` vẫn dành cho chạy ứng dụng trực tiếp ngoài Docker. Sau khi đổi cấu hình, chạy lại `docker compose up -d`.

Image dùng Next.js standalone, chạy bằng user `node`, bao gồm `public` và `.next/static`. Khi triển khai qua domain, dùng HTTPS/reverse proxy vì cookie xác thực production có cờ `Secure`; proxy cần giữ đúng host/origin để request thay đổi dữ liệu vượt qua kiểm tra same-origin.

`APP_ORIGIN` là origin công khai của UI để kiểm tra request thay đổi dữ liệu, vì request URL trong standalone có thể dùng hostname nội bộ. Compose mặc định dùng `http://localhost:3000` (theo `UI_PORT`). Nếu truy cập qua IP/domain khác, đặt `APP_ORIGIN` đúng scheme, host và port trên trình duyệt, không có dấu `/` cuối, rồi chạy `docker compose up -d`. Ví dụ: `APP_ORIGIN=https://license.example.com`. Không đặt thành URL backend.

### Authentication

Visit `/auth/login` for the React Hook Form + Zod login form. TanStack Query manages the login request state.

The browser posts to `/api/auth/login`. This Next.js route calls `POST http://localhost:5000/api/v1/auth/login` and stores the returned access token in an HttpOnly cookie for `expires_in` seconds. The token is not returned to browser JavaScript.

To change the backend address, copy `.env.example` to `.env.local` and set `API_BASE_URL`. Restart the app after changing it.

Login redirects to `/`. The Next.js `proxy.ts` redirects page requests without an access-token cookie to `/auth/login`, and redirects visitors with that cookie away from the login page. This is an optimistic navigation check, not token verification. Backend APIs must still verify tokens and permissions.

`authService` exposes `login`, `register` (email, password, invite_token), `logout`, `me`, and `refresh`. Same-origin server routes forward Bearer authentication and the refresh cookie to the backend. Login/register/refresh store tokens in HttpOnly cookies; refresh tokens are never returned to browser JavaScript. Refresh is explicit, not automatically retried on 401 responses. The header's Sign out button revokes the backend session, clears both cookies and the query cache, and redirects to login. Backend failures keep the session in place and display an error so sign-out can be retried.

Run `pnpm test`, `pnpm lint`, and `pnpm build` to check the implementation.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Sửa màn hình trong `features/auth/login-page.tsx` hoặc `features/products/page.tsx`; các file `app/**/page.tsx` tương ứng chỉ nối route tới feature. Trang overview nằm tại `app/(dashboard)/page.tsx`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
