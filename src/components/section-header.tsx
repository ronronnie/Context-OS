export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--border)] px-4 py-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? (
        <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
      ) : null}
    </div>
  );
}
