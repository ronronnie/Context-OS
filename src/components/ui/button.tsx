import { cn } from "@/lib/utils";

const variants = {
  primary:
    "border-[#0f766e] bg-[#0f766e] text-white hover:bg-[#134e4a] focus-visible:ring-[#99f6e4]",
  secondary:
    "border-[var(--line)] bg-white text-[#171717] hover:bg-[var(--panel-muted)] focus-visible:ring-[#d9f99d]",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
