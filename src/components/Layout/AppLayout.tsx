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
  <Sidebar mobileOpen={mobileOpen} onClose={handleClose} className="h-screen pt-20" />

  <div className="flex flex-col flex-1">
    <Topbar onMenuToggle={handleMenuToggle} />

    {/* Abstand nach oben, z. B. 64 px falls Topbar 4 rem hoch ist */}
    <main className="relative flex-1 px-4 pb-10 pt-20 md:px-10">
      <Outlet />
    </main>
  </div>
</div>


  );
}
