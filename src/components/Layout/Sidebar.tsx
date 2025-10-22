import type { LucideIcon } from "lucide-react";
import { ClipboardList, Gauge, Library, ListPlus, ShieldCheck, X } from "lucide-react";
import { clsx } from "clsx";
import { useMemo } from "react";
import { NavLink } from "react-router-dom";

import { useUserRole } from "../../modules/shared/hooks/useUserRole";
import type { UserRole } from "../../modules/shared/types/domain";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Roles",
    path: "/admin/roles",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    label: "Templates",
    path: "/admin/templates",
    icon: Library,
    roles: ["admin"],
  },
  {
    label: "Program Builder",
    path: "/therapist/program-builder",
    icon: ListPlus,
    roles: ["therapist", "admin"],
  },
  {
    label: "Task Library",
    path: "/therapist/tasks",
    icon: ClipboardList,
    roles: ["therapist", "admin"],
  },
];

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { role } = useUserRole();

  const navItems = useMemo(() => {
    if (!role) return [];
    return NAV_ITEMS.filter((item) => item.roles.includes(role));
  }, [role]);

  const defaultDashboardPath = role === "admin" ? "/admin" : "/therapist";

  const renderNav = () => (
    <div className="flex h-full flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-text-muted">Navigation</p>
          <h2 className="mt-2 text-lg font-semibold text-brand-text">Dashboard</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-brand-text-muted transition hover:bg-brand-light/60 md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="space-y-2 text-sm">
        {role && (
          <NavLink
            to={defaultDashboardPath}
            end
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-[12px] px-4 py-2 font-medium transition",
                isActive
                  ? "bg-brand-primary text-white shadow-soft"
                  : "text-brand-text hover:bg-brand-light/60"
              )
            }
            onClick={onClose}
          >
            <Gauge className="h-4 w-4" />
            Dashboard
          </NavLink>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-[12px] px-4 py-2 font-medium transition",
                  isActive
                    ? "bg-brand-primary text-white shadow-soft"
                    : "text-brand-text hover:bg-brand-light/60"
                )
              }
              onClick={onClose}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto rounded-[12px] border border-brand-divider/60 bg-brand-light/40 p-4 text-xs text-brand-text-muted">
        <p className="font-semibold text-brand-text">Tip</p>
        <p className="mt-1">
          Verwalte Rollen und Templates zentral, damit Therapeut:innen sich auf Programme
          konzentrieren können.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden",
          mobileOpen ? "block" : "hidden"
        )}
        onClick={onClose}
      />
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-brand-divider/60 bg-white px-6 py-8 shadow-soft transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:static md:flex md:h-auto md:w-72 md:shadow-none"
        )}
      >
        {renderNav()}
      </aside>
    </>
  );
}
