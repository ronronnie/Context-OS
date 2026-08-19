import { cn } from "@/lib/utils";

const variants = {
  default: "bg-[#ccfbf1] text-[#134e4a] border-[#99f6e4]",
  outline: "bg-white text-[var(--ink-muted)] border-[var(--line)]",
  success: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
  warning: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
  danger: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
