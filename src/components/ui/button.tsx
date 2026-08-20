import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] focus-visible:ring-[#99f6e4]",
        secondary:
          "border-[var(--border)] bg-white text-[#171717] hover:bg-[var(--panel-subtle)] focus-visible:ring-[#dbeafe]",
        ghost:
          "border-[var(--border)] bg-transparent text-[var(--muted-strong)] hover:bg-white focus-visible:ring-[#dbeafe]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Button({
  className,
  variant,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
