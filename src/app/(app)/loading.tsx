export default function AppLoading() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-5">
        <div className="h-4 w-32 rounded-md bg-[var(--panel-subtle)]" />
        <div className="mt-3 h-8 w-80 max-w-full rounded-md bg-[var(--panel-subtle)]" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md bg-[var(--panel-subtle)]" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {["one", "two", "three", "four"].map((item) => (
          <div
            className="h-28 rounded-md border border-[var(--border)] bg-[var(--panel)] p-4"
            key={item}
          >
            <div className="h-4 w-24 rounded-md bg-[var(--panel-subtle)]" />
            <div className="mt-4 h-8 w-16 rounded-md bg-[var(--panel-subtle)]" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="h-80 rounded-md border border-[var(--border)] bg-[var(--panel)]" />
        <div className="h-80 rounded-md border border-[var(--border)] bg-[var(--panel)]" />
      </div>
    </div>
  );
}
