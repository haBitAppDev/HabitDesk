import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Gauge,
  Library,
  ListPlus,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useMemo } from "react";
import { NavLink } from "react-router-dom";

import { useI18n } from "../../i18n/I18nProvider";
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

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { role } = useUserRole();
  const { t } = useI18n();

  const navItems = useMemo(() => {
    if (!role) return [];
    const items: NavItem[] = [
      {
        label: t("layout.sidebar.admin.therapists", "Therapists"),
        path: "/admin/therapists",
        icon: UserCog,
        roles: ["admin"],
      },
      {
        label: t("layout.sidebar.admin.roles", "Role Management"),
        path: "/admin/roles",
        icon: ShieldCheck,
        roles: ["admin"],
      },
      {
        label: t("layout.sidebar.admin.templates", "Templates"),
        path: "/admin/templates",
        icon: Library,
        roles: ["admin"],
      },
      {
        label: t("layout.sidebar.therapist.patients", "Patients"),
        path: "/therapist/patients",
        icon: Users,
        roles: ["therapist", "admin"],
      },
      {
        label: t("layout.sidebar.therapist.programBuilder", "Program Builder"),
        path: "/therapist/program-builder",
        icon: ListPlus,
        roles: ["therapist", "admin"],
      },
      {
        label: t("layout.sidebar.therapist.taskLibrary", "Task Library"),
        path: "/therapist/tasks",
        icon: ClipboardList,
        roles: ["therapist", "admin"],
      },
    ];
    return items.filter((item) => item.roles.includes(role));
  }, [role, t]);

  const defaultDashboardPath = role === "admin" ? "/admin" : "/therapist";
  const navigationLabel = t("layout.sidebar.navigation", "Navigation");
  const dashboardLabel = t("layout.sidebar.dashboard", "Dashboard");
  const tipTitle = t("layout.sidebar.tipTitle", "Tip");
  const tipBody = t(
    "layout.sidebar.tip",
    "Manage roles and templates centrally so therapists can focus on patient work."
  );
  const adminRootLabel = t("layout.sidebar.admin.root", "Admin");
  const therapistRootLabel = t("layout.sidebar.therapist.root", "Therapist");
  const dashboardTitle = role === "admin" ? adminRootLabel : therapistRootLabel;

  const renderNav = () => (
    <div className="flex h-full flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-text-muted">{navigationLabel}</p>
          <h2 className="mt-2 text-lg font-semibold text-brand-text">{dashboardTitle}</h2>
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
            {dashboardLabel}
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
        <p className="font-semibold text-brand-text">{tipTitle}</p>
        <p className="mt-1">{tipBody}</p>
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
