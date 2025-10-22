import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import AssignmentIcon from "@mui/icons-material/Assignment";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useUserRole } from "../../modules/shared/hooks/useUserRole";
import type { UserRole } from "../../modules/shared/types/domain";

const drawerWidth = 260;

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Roles",
    path: "/admin/roles",
    icon: <AdminPanelSettingsIcon />,
    roles: ["admin"],
  },
  {
    label: "Templates",
    path: "/admin/templates",
    icon: <LibraryBooksIcon />,
    roles: ["admin"],
  },
  {
    label: "Program Builder",
    path: "/therapist/program-builder",
    icon: <PlaylistAddIcon />,
    roles: ["therapist", "admin"],
  },
  {
    label: "Task Library",
    path: "/therapist/tasks",
    icon: <AssignmentIcon />,
    roles: ["therapist", "admin"],
  },
];

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { role } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = useMemo(() => {
    if (!role) return [];
    return NAV_ITEMS.filter((item) => item.roles.includes(role));
  }, [role]);

  const defaultDashboardPath =
    role === "admin" ? "/admin" : role === "therapist" ? "/therapist" : "/";

  const drawerContent = (
    <Box sx={{ height: "100%" }}>
      <Toolbar>
        <Typography variant="h6">Navigation</Typography>
      </Toolbar>
      <Divider />
      <List>
        {role && (
          <ListItemButton
            selected={location.pathname === defaultDashboardPath}
            onClick={() => navigate(defaultDashboardPath)}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        )}
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
