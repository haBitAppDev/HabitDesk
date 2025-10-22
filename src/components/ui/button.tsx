import { clsx } from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "outline" | "neutral" | "ghost";
type ButtonSize = "md" | "sm";

interface ButtonProps
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-[14px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-primary text-white hover:bg-brand-primary-dark focus-visible:outline-brand-primary",
  outline:
    "border border-brand-primary text-brand-primary hover:bg-brand-primary/10 focus-visible:outline-brand-primary",
  neutral:
    "bg-brand-divider text-brand-text hover:bg-brand-divider/70 focus-visible:outline-brand-divider",
  ghost:
    "bg-transparent text-brand-primary hover:bg-brand-primary/10 focus-visible:outline-brand-primary",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "px-6 py-3 text-sm",
  sm: "px-4 py-2 text-xs",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        loading && "pointer-events-none opacity-70",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
