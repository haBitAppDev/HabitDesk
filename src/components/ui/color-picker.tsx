import clsx from "clsx";
import { useMemo, useRef } from "react";
import type { ChangeEventHandler } from "react";

interface ColorPickerProps {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  className?: string;
  allowCustom?: boolean;
  customLabel?: string;
  customHint?: string;
}

const HEX_WITH_PREFIX = /^#[0-9A-Fa-f]{6}$/;
const HEX_NO_PREFIX = /^[0-9A-Fa-f]{6}$/;

const normalizeHex = (color: string, fallback: string): string => {
  if (HEX_WITH_PREFIX.test(color)) {
    return color.toUpperCase();
  }
  if (HEX_NO_PREFIX.test(color)) {
    return `#${color.toUpperCase()}`;
  }
  return fallback.toUpperCase();
};

const swatchButtonBase =
  "flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary";

const previewBase =
  "flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-divider/60 shadow-inner";

export function ColorPicker({
  colors,
  value,
  onChange,
  className,
  allowCustom = false,
  customLabel = "Custom color",
  customHint,
}: ColorPickerProps) {
  const fallback = colors[0] ?? "#1F6FEB";
  const normalizedValue = useMemo(
    () => normalizeHex(value, fallback),
    [value, fallback]
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (color: string) => {
    onChange(normalizeHex(color, fallback));
  };

  const handleCustomChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const next = event.target.value;
    if (next) {
      onChange(normalizeHex(next, fallback));
    }
  };

  const handleCustomClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div
          className={previewBase}
          style={{ backgroundColor: normalizedValue }}
          aria-hidden
        />
        <div>
          <p className="text-sm font-semibold text-brand-text">
            {normalizedValue}
          </p>
          {customHint ? (
            <p className="text-xs text-brand-text-muted">{customHint}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {colors.map((color) => {
          const swatch = normalizeHex(color, fallback);
          const selected = swatch === normalizedValue;
          return (
            <button
              key={swatch}
              type="button"
              onClick={() => handleSelect(swatch)}
              className={clsx(
                swatchButtonBase,
                selected
                  ? "border-brand-primary ring-2 ring-brand-primary/60"
                  : "border-transparent hover:border-brand-primary/40"
              )}
              style={{ backgroundColor: swatch }}
              aria-pressed={selected}
              aria-label={swatch}
              title={swatch}
            >
              <span className="sr-only">{swatch}</span>
            </button>
          );
        })}
        {allowCustom ? (
          <>
            <button
              type="button"
              onClick={handleCustomClick}
              className="flex h-10 items-center rounded-full border border-brand-divider/70 px-4 text-sm font-medium text-brand-text transition hover:border-brand-primary/50 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              {customLabel}
            </button>
            <input
              ref={inputRef}
              type="color"
              value={normalizedValue}
              onChange={handleCustomChange}
              className="sr-only"
              aria-label={customLabel}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
