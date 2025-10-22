import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        "w-full rounded-[14px] border border-brand-divider bg-brand-surface px-4 py-3 text-sm text-brand-text shadow-sm ring-offset-brand-surface placeholder:text-brand-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
