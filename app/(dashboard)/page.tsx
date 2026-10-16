export default function Home() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        Workspace overview
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Welcome to your workspace
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        Keep your license operations organized. Your catalogs will appear here
        as management features become available.
      </p>
      <section
        aria-label="Management catalogs"
        className="mt-8 grid gap-5 sm:grid-cols-3"
      >
        {["Licenses", "Products", "Customers"].map((name) => (
          <article
            key={name}
            className="rounded-xl border border-line bg-surface p-6"
          >
            <span className="rounded-full bg-surface-subtle px-3 py-1 text-xs text-muted">
              Coming soon
            </span>
            <h2 className="mt-5 text-lg font-semibold">{name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              A dedicated place to manage your {name.toLowerCase()}.
            </p>
          </article>
        ))}
      </section>
      <p className="mt-8 text-xs text-muted">
        License System · Management workspace
      </p>
    </div>
  );
}
