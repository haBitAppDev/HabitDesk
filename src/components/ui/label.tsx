import { clsx } from "clsx";
import type { LabelHTMLAttributes, PropsWithChildren } from "react";

export function Label({
  className,
  children,
  ...props
}: PropsWithChildren<LabelHTMLAttributes<HTMLLabelElement>>) {
  return (
    <label
      className={clsx("text-sm font-medium text-brand-text", className)}
      {...props}
    >
      {children}
    </label>
  );
}
