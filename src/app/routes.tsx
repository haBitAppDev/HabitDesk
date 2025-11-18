import { Outlet, useRoutes } from "react-router-dom";

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
import { PatientManagement } from "../modules/therapist/pages/PatientManagement";
import { Login } from "../modules/shared/pages/Login";
import { NotFound } from "../modules/shared/pages/NotFound";
import { RegisterPage } from "../modules/shared/pages/RegisterPage";
import { DefaultDashboardRedirect } from "./shell/DefaultDashboardRedirect";
import { PatientDashboard } from "../modules/patient/pages/PatientDashboard";

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

const PatientOutlet = () => (
  <RequireRole allowed={["patient"]}>
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
      path: "/register",
      element: <RegisterPage />,
    },
    {
      path: "/",
      element: (
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <DefaultDashboardRedirect /> },
        {
          path: "admin",
          element: <AdminOutlet />,
          children: [
            { index: true, element: <AdminDashboard /> },
            { path: "therapists", element: <TherapistManager /> },
            { path: "users", element: <RolesManager /> },
            { path: "templates", element: <TemplateManager /> },
          ],
        },
        {
          path: "therapist",
          element: <TherapistOutlet />,
          children: [
            { index: true, element: <TherapistDashboard /> },
            { path: "patients", element: <PatientManagement /> },
            { path: "program-builder", element: <ProgramBuilder /> },
            { path: "tasks", element: <TaskLibrary /> },
          ],
        },
        {
          path: "patient",
          element: <PatientOutlet />,
          children: [{ index: true, element: <PatientDashboard /> }],
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
