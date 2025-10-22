import { clsx } from "clsx";
import type { HTMLAttributes, PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-card bg-brand-surface shadow-soft ring-1 ring-black/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
