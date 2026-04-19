import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { StudentManagement } from "./components/StudentManagement";
import { FacultyManagement } from "./components/FacultyManagement";
import { RoomManagement } from "./components/RoomManagement";
import { ExamManagement } from "./components/ExamManagement";
import { SeatingAllocation } from "./components/SeatingAllocation";
import { InvigilatorAllocation } from "./components/InvigilatorAllocation";
import { AttendanceManagement } from "./components/AttendanceManagement";
import { ReplacementManagement } from "./components/ReplacementManagement";
import { Reports } from "./components/Reports";
import { AcademicStructure } from "./components/AcademicStructure";
import { NotFound } from "./components/NotFound";
import { LoginAdmin } from "./components/LoginAdmin";
import { SignupAdmin } from "./components/SignupAdmin";
import { ForgotPasswordAdmin } from "./components/ForgotPasswordAdmin";
import { ResetPassword } from "./components/ResetPassword";

const router = createBrowserRouter([
  // Redirect root to admin login
  { path: "/", element: <Navigate to="/login/admin" replace /> },

  // Admin auth
  { path: "/login/admin",           Component: LoginAdmin },
  { path: "/signup/admin",          Component: SignupAdmin },
  { path: "/forgot-password/admin", Component: ForgotPasswordAdmin },
  { path: "/reset-password",        Component: ResetPassword },

  // Admin portal
  {
    path: "/admin",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "academic",     Component: AcademicStructure },
      { path: "students",     Component: StudentManagement },
      { path: "faculty-management", Component: FacultyManagement },
      { path: "rooms",        Component: RoomManagement },
      { path: "exams",        Component: ExamManagement },
      { path: "seating",      Component: SeatingAllocation },
      { path: "invigilation", Component: InvigilatorAllocation },
      { path: "attendance",   Component: AttendanceManagement },
      { path: "replacements", Component: ReplacementManagement },
      { path: "reports",      Component: Reports },
      { path: "*",            Component: NotFound },
    ]
  },

  { path: "*", element: <Navigate to="/login/admin" replace /> },
]);

export { router };
