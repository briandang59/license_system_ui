"use client";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <html lang="vi"><body style={{ fontFamily: "sans-serif", padding: 32 }}>
    <main role="alert"><h1>Không thể tải hệ thống</h1>
      <p>Đã xảy ra lỗi. Vui lòng thử lại hoặc tải lại trang.</p>
      <button onClick={retry}>Thử lại</button>
    </main>
  </body></html>;
}
