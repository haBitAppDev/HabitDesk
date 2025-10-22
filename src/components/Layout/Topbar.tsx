import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { signOutUser } from "../../modules/shared/services/auth";
import { useAuthState } from "../../modules/shared/hooks/useAuthState";
import { useUserRole } from "../../modules/shared/hooks/useUserRole";

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { user } = useAuthState();
  const { role } = useUserRole();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOutUser();
    handleCloseMenu();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          aria-label="open drawer"
          onClick={onMenuToggle}
          sx={{ mr: 2, display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div">
          HabitDesk
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {role && (
          <Chip
            label={role.toUpperCase()}
            color={role === "admin" ? "secondary" : "default"}
            size="small"
            sx={{ mr: 2 }}
          />
        )}
        <IconButton color="inherit" onClick={handleOpenMenu}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            {(user?.displayName?.[0] || user?.email?.[0] || "?").toUpperCase()}
          </Avatar>
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
          <MenuItem disabled>{user?.email}</MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
