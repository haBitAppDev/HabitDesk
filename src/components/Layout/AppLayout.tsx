import { Box, Toolbar } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const drawerWidth = 260;

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Topbar onMenuToggle={handleMenuToggle} />
      <Sidebar mobileOpen={mobileOpen} onClose={handleClose} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
