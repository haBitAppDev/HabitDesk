import { Navigate, Outlet, useRoutes } from "react-router-dom";

import { RequireAuth } from "./guards/RequireAuth";
import { RequireRole } from "./guards/RequireRole";
import { AppLayout } from "../components/Layout/AppLayout";
import { AdminDashboard } from "../modules/admin/pages/AdminDashboard";
import { RolesManager } from "../modules/admin/pages/RolesManager";
import { TemplateManager } from "../modules/admin/pages/TemplateManager";
import { TherapistManager } from "../modules/admin/pages/TherapistManager";
import { TherapistDashboard } from "../modules/therapist/pages/TherapistDashboard";
import { ProgramBuilder } from "../modules/therapist/pages/ProgramBuilder";
import { TaskLibrary } from "../modules/therapist/pages/TaskLibrary";
import { Login } from "../modules/shared/pages/Login";
import { NotFound } from "../modules/shared/pages/NotFound";

const AdminOutlet = () => (
  <RequireRole allowed={["admin"]}>
    <Outlet />
  </RequireRole>
);

const TherapistOutlet = () => (
  <RequireRole allowed={["therapist", "admin"]}>
    <Outlet />
  </RequireRole>
);

export function AppRoutes() {
  const element = useRoutes([
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/",
      element: (
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <Navigate to="/therapist" replace /> },
        {
          path: "admin",
          element: <AdminOutlet />,
          children: [
            { index: true, element: <AdminDashboard /> },
            { path: "therapists", element: <TherapistManager /> },
            { path: "roles", element: <RolesManager /> },
            { path: "templates", element: <TemplateManager /> },
          ],
        },
        {
          path: "therapist",
          element: <TherapistOutlet />,
          children: [
            { index: true, element: <TherapistDashboard /> },
            { path: "program-builder", element: <ProgramBuilder /> },
            { path: "tasks", element: <TaskLibrary /> },
          ],
        },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  return element;
}
