import clsx from "clsx";
import type { ReactNode } from "react";

interface IconPickerProps {
  icons: string[];
  value: string;
  onChange: (icon: string) => void;
  className?: string;
  itemClassName?: string;
  preview?: ReactNode;
}

interface IconPresentation {
  glyph: string;
  fill: number;
  label: string;
}

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");

const presentIcon = (icon: string): IconPresentation => {
  const cleaned = icon.replace(/_(rounded|outlined)$/i, "");
  const label = toTitleCase(cleaned.replace(/_/g, " "));
  const fill = icon.endsWith("_outlined") ? 0 : 1;

  return {
    glyph: cleaned,
    fill,
    label,
  };
};

const iconButtonBase =
  "flex h-14 w-14 items-center justify-center rounded-2xl border text-brand-text transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary";

const iconPreviewBase =
  "flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-primary/40 bg-brand-primary/10 text-brand-primary";

export function IconPicker({
  icons,
  value,
  onChange,
  className,
  itemClassName,
  preview,
}: IconPickerProps) {
  const current = presentIcon(value);

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className={iconPreviewBase} aria-hidden>
          <span
            className="material-symbols-rounded text-3xl"
            style={{
              fontVariationSettings: `'FILL' ${current.fill}, 'wght' 600, 'GRAD' 0, 'opsz' 32`,
            }}
          >
            {current.glyph}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-text">{current.label}</p>
          {preview}
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {icons.map((icon) => {
          const presentation = presentIcon(icon);
          const selected = icon === value;
          return (
            <button
              key={icon}
              type="button"
              onClick={() => onChange(icon)}
              className={clsx(
                iconButtonBase,
                selected
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm"
                  : "border-brand-divider/70 bg-white hover:border-brand-primary/50 hover:bg-brand-light/40",
                itemClassName
              )}
              title={presentation.label}
              aria-pressed={selected}
              aria-label={presentation.label}
            >
              <span
                className="material-symbols-rounded text-2xl"
                style={{
                  fontVariationSettings: `'FILL' ${presentation.fill}, 'wght' ${
                    selected ? 700 : 500
                  }, 'GRAD' 0, 'opsz' 32`,
                }}
              >
                {presentation.glyph}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
