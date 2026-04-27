import { Badge } from "./ui/badge";
import logoImg from "@/assets/ed2ca518a3e5afbd0023769633d655019bb193a2.png";
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth-context";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, DoorOpen, FileText, Grid3X3,
  UserCheck, ClipboardList, BarChart3, Menu,
  LogOut, GraduationCap, UserCog, X, Loader2, ChevronRight, BookOpen
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { path: "/admin/academic", label: "Academic Structure", icon: GraduationCap },
    ]
  },
  {
    label: "Management",
    items: [
      { path: "/admin/students", label: "Students", icon: Users },
      { path: "/admin/faculty-management", label: "Faculty", icon: UserCog },
      { path: "/admin/rooms", label: "Rooms", icon: DoorOpen },
      { path: "/admin/exams", label: "Exams", icon: FileText },
    ]
  },
  {
    label: "Exam Operations",
    items: [
      { path: "/admin/seating", label: "Seating Allocation", icon: Grid3X3 },
      { path: "/admin/invigilation", label: "Invigilation", icon: UserCheck },
      { path: "/admin/attendance", label: "Attendance", icon: ClipboardList },
      { path: "/admin/summary", label: "Summary", icon: BookOpen },
    ]
  },
  {
    label: "Analytics",
    items: [
      { path: "/admin/reports", label: "Reports", icon: BarChart3 },
    ]
  }
];

const pageTitles = {
  "/admin":                    "Dashboard",
  "/admin/academic":           "Academic Structure",
  "/admin/students":           "Student Management",
  "/admin/faculty-management": "Faculty Management",
  "/admin/rooms":              "Room Management",
  "/admin/exams":              "Exam Management",
  "/admin/seating":            "Seating Allocation",
  "/admin/invigilation":       "Invigilation Management",
  "/admin/attendance":         "Attendance Management",
  "/admin/summary":            "Summary",
  "/admin/reports":            "Reports & Analytics",
};

function UserAvatar({ name, email, role }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "A";
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[0.7rem] font-semibold shrink-0">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.75rem] font-medium truncate">{name || "Administrator"}</p>
        <p className="text-[0.65rem] text-muted-foreground truncate">{email || "admin@gbu.ac.in"}</p>
      </div>
    </div>
  );
}

export function Layout() {
  const { setCurrentRole, loading } = useStore();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] ?? "Admin Portal";

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) navigate("/login/admin", { replace: true });
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut();
    setCurrentRole("admin");
    toast.success("Signed out successfully");
    navigate("/login/admin");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Logo */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="GBU Logo" className="w-9 h-9 rounded-full object-contain shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground leading-tight truncate">GAUTAM BUDDHA UNIVERSITY</p>
              <p className="text-[9px] text-muted-foreground leading-tight">Exam Management System</p>
            </div>
            <button className="lg:hidden ml-auto p-1 rounded hover:bg-accent" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <Badge className="mt-2 text-[0.6rem] bg-primary/10 text-primary border-0 w-fit">Admin Portal</Badge>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1">{group.label}</p>
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8rem] mb-0.5 transition-all duration-150 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-border pb-2">
          <UserAvatar name={user?.name} email={user?.email} />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 mx-0 rounded-lg text-[0.8rem] text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-accent">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-[0.8rem] text-muted-foreground">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{pageTitle}</span>
          </div>

          <div className="flex-1" />

          <Badge variant="outline" className="text-[0.7rem] hidden sm:flex">
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </Badge>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-[0.85rem]">Loading data...</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

export default Layout;
