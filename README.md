This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
