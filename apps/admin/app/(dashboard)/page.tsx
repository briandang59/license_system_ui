export default function Home() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        Tổng quan hệ thống
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Chào mừng đến với hệ thống quản lý
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        Quản lý bản quyền và các danh mục tập trung. Chọn một mục trong menu để bắt đầu.
      </p>
      <section
        aria-label="Danh mục quản lý"
        className="mt-8 grid gap-5 sm:grid-cols-3"
      >
        {["Bản quyền", "Sản phẩm", "Khách hàng"].map((name) => (
          <article
            key={name}
            className="rounded-xl border border-line bg-surface p-6"
          >
            <span className="rounded-full bg-surface-subtle px-3 py-1 text-xs text-muted">
              Sắp ra mắt
            </span>
            <h2 className="mt-5 text-lg font-semibold">{name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Khu vực quản lý {name.toLowerCase()}.
            </p>
          </article>
        ))}
      </section>
      <p className="mt-8 text-xs text-muted">
        Hệ thống quản lý bản quyền
      </p>
    </div>
  );
}
