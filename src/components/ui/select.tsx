import { clsx } from "clsx";
import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={clsx(
        "w-full rounded-[14px] border border-brand-divider bg-brand-surface px-4 py-3 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
        props.multiple && "min-h-[3rem]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
