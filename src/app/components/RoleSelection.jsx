import { useNavigate } from "react-router";
import { Card, CardContent } from "./ui/card";
import { Shield, BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import logoImg from "@/assets/ed2ca518a3e5afbd0023769633d655019bb193a2.png";

const roles = [
  {
    title: "Admin",
    description: "Manage exams, seating, invigilation & attendance",
    icon: Shield,
    path: "/login/admin",
    bg: "bg-slate-900",
    iconBg: "bg-white/10",
    iconColor: "text-white",
    textColor: "text-white",
    subColor: "text-gray-400",
    border: "border-gray-700",
    hover: "hover:bg-slate-800",
    badge: "bg-white/10 text-white",
  },
  {
    title: "Faculty",
    description: "View invigilation duties & mark attendance",
    icon: BookOpen,
    path: "/login/faculty",
    bg: "bg-white",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    textColor: "text-gray-900",
    subColor: "text-gray-500",
    border: "border-green-200",
    hover: "hover:border-green-400 hover:shadow-green-100",
    badge: "bg-green-100 text-green-700",
  },
  {
    title: "Student",
    description: "View exam schedule and seat allocation",
    icon: GraduationCap,
    path: "/login/student",
    bg: "bg-white",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    textColor: "text-gray-900",
    subColor: "text-gray-500",
    border: "border-blue-200",
    hover: "hover:border-blue-400 hover:shadow-blue-100",
    badge: "bg-blue-100 text-blue-700",
  },
];

export function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img src={logoImg} alt="GBU Logo" className="w-16 h-16 rounded-full object-contain shadow-md" />
          </div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Gautam Buddha University</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Exam Management System</h1>
          <p className="text-[0.85rem] text-muted-foreground mt-1">Select your role to continue</p>
        </div>

        {/* Role cards */}
        <div className="space-y-3">
          {roles.map(role => (
            <button
              key={role.title}
              onClick={() => navigate(role.path)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 shadow-sm hover:shadow-md ${role.bg} ${role.border} ${role.hover}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${role.iconBg}`}>
                  <role.icon className={`w-6 h-6 ${role.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[0.95rem] font-semibold ${role.textColor}`}>{role.title}</span>
                    <span className={`text-[0.6rem] font-medium px-2 py-0.5 rounded-full ${role.badge}`}>Portal</span>
                  </div>
                  <p className={`text-[0.78rem] ${role.subColor}`}>{role.description}</p>
                </div>
                <ArrowRight className={`w-4 h-4 shrink-0 ${role.subColor}`} />
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-[0.72rem] text-muted-foreground mt-8">
          By logging in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default RoleSelection;
