"use client";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="mx-auto max-w-xl p-8 text-foreground" role="alert">
    <h1 className="text-2xl font-semibold">Không thể tải nội dung</h1>
    <p className="my-4 text-muted">Đã xảy ra lỗi. Vui lòng thử lại.</p>
    <button className="rounded border border-line px-4 py-2 text-accent" onClick={retry}>Thử lại</button>
  </main>;
}
