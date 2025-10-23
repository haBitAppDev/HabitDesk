import { LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { signOutUser } from "../../modules/shared/services/auth";
import { useAuthState } from "../../modules/shared/hooks/useAuthState";
import { useUserRole } from "../../modules/shared/hooks/useUserRole";
import { useI18n } from "../../i18n/I18nProvider";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { user } = useAuthState();
  const { role } = useUserRole();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const brandPrefix = t("layout.topbar.brand.prefix", "Habit");
  const brandSuffix = t("layout.topbar.brand.suffix", "Desk");
  const defaultAccountLabel = t("layout.topbar.menu.defaultName", "Account");
  const defaultMenuName = t("layout.topbar.menu.defaultName", "Signed in user");
  const logoutLabel = t("layout.topbar.menu.logout", "Log out");

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [open]);

  const handleLogout = async () => {
    await signOutUser();
    setOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-brand-divider/60 bg-brand-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 md:px-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mr-2 inline-flex items-center gap-2 border border-brand-divider/60 bg-white/70 text-brand-text md:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg font-semibold tracking-tight text-brand-text">
          {brandPrefix}
          <span className="text-brand-primary">{brandSuffix}</span>
        </span>
        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher />
          {role && (
            <Badge
              variant={role === "admin" ? "primary" : "muted"}
              className="hidden sm:inline-flex"
            >
              {t(`layout.topbar.roleBadge.${role}`, role)}
            </Badge>
          )}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full border border-transparent px-1 py-1 transition hover:border-brand-primary/40"
            >
              <Avatar name={user?.displayName ?? null} email={user?.email ?? null} />
              <div className="hidden flex-col text-left text-xs font-medium sm:flex">
                <span className="text-brand-text">{user?.displayName ?? defaultAccountLabel}</span>
                <span className="text-brand-text-muted">{user?.email}</span>
              </div>
            </button>
            {open && (
              <div className="absolute right-0 top-full z-50 mt-3 w-60 rounded-card bg-white p-3 shadow-soft ring-1 ring-black/5">
                <div className="border-b border-brand-divider/60 pb-3 text-sm">
                  <p className="font-semibold text-brand-text">
                    {user?.displayName ?? defaultMenuName}
                  </p>
                  <p className="text-brand-text-muted">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm font-medium text-brand-text hover:bg-brand-light/50"
                >
                  <LogOut className="h-4 w-4" />
                  {logoutLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
