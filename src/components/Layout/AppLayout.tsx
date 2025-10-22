import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleClose = () => {
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-brand-background text-brand-text">
      <Topbar onMenuToggle={handleMenuToggle} />
      <Sidebar mobileOpen={mobileOpen} onClose={handleClose} />
      <main className="relative flex-1 px-4 pb-10 pt-24 md:ml-72 md:px-10">
        <Outlet />
      </main>
    </div>
  );
}
