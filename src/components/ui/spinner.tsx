import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function Spinner({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent",
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <span className="sr-only">Lädt…</span>
    </div>
  );
}
