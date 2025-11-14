import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

interface IconPickerProps {
  icons: string[];
  value: string;
  onChange: (icon: string) => void;
  className?: string;
  itemClassName?: string;
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
  "flex h-10 w-10 items-center justify-center rounded-2xl border text-brand-text transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary";

const popupBase =
  "absolute left-0 top-full mt-1 z-10 min-w-[280px] rounded-2xl border border-brand-divider/70 bg-white p-3 shadow-lg";

export function IconPicker({
  icons,
  value,
  onChange,
  className,
  itemClassName,
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close, isOpen]);

  const handleSelect = (icon: string) => {
    onChange(icon);
    close();
  };

  return (
    <div
      className={clsx("relative", className)}
      ref={containerRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-12 w-12  justify-center rounded-2xl border border-brand-divider/70 bg-white text-brand-text transition hover:border-brand-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
        aria-haspopup="grid"
        aria-expanded={isOpen}
        aria-label="Choose icon"
      >
        <span className="text-3xl font-semibold leading-none">+</span>
      </button>
      {isOpen && (
        <div className={popupBase}>
          <div className="grid grid-cols-6 gap-1">
            {icons.map((icon) => {
              const presentation = presentIcon(icon);
              const selected = icon === value;
              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleSelect(icon)}
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
      )}
    </div>
  );
}
