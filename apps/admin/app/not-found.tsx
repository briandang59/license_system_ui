import Link from "next/link";

export default function NotFound() {
  return <main className="mx-auto max-w-xl p-8 text-foreground">
    <h1 className="text-2xl font-semibold">Không tìm thấy trang</h1>
    <p className="my-4 text-muted">Đường dẫn không tồn tại hoặc trang đã được chuyển đi.</p>
    <Link className="text-accent underline" href="/">Về trang tổng quan</Link>
  </main>;
}
