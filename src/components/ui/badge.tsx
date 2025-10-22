import { clsx } from "clsx";
import type { HTMLAttributes, PropsWithChildren } from "react";

type BadgeVariant = "primary" | "secondary" | "muted";

interface BadgeProps extends PropsWithChildren<HTMLAttributes<HTMLSpanElement>> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-brand-primary/10 text-brand-primary",
  secondary: "bg-brand-accent/10 text-brand-accent",
  muted: "bg-brand-divider text-brand-text-muted",
};

export function Badge({ variant = "primary", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
