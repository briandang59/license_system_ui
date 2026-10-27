import Link from "next/link";

export default function NotFound() {
  return <main style={{ maxWidth: 640, margin: "48px auto", padding: 24 }}>
    <h1>Không tìm thấy trang</h1>
    <p>Đường dẫn không tồn tại hoặc trang đã được chuyển đi.</p>
    <Link href="/">Về trang chủ</Link>
  </main>;
}
