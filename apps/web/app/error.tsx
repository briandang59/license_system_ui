"use client";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main style={{ maxWidth: 640, margin: "48px auto", padding: 24 }} role="alert">
    <h1>Không thể tải nội dung</h1>
    <p>Đã xảy ra lỗi. Vui lòng thử lại.</p>
    <button onClick={retry}>Thử lại</button>
  </main>;
}
