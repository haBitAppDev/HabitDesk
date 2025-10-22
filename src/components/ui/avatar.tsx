import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
};

export function Avatar({ name, email, size = "md", className, ...props }: AvatarProps) {
  const initial = (name?.[0] || email?.[0] || "?").toUpperCase();

  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-full bg-brand-primary text-white font-semibold",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {initial}
    </div>
  );
}
