import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Users, DoorOpen, FileText, UserCheck, Grid3X3,
  ClipboardList, TrendingUp, Sun, Moon, Loader2,
  GraduationCap, CalendarDays, CheckCircle2, XCircle,
  BookOpen, Building2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const SHIFT_STYLE = {
  "Shift 1 (Morning)": { bg: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-700", icon: Sun,  iconColor: "text-amber-500" },
  "Shift 2 (Evening)": { bg: "bg-indigo-50 border-indigo-200", badge: "bg-indigo-100 text-indigo-700", icon: Moon, iconColor: "text-indigo-500" },
};

function StatCard({ label, value, icon: Icon, colorClass, sub, onClick }) {
  return (
    <Card
      className={`hover:shadow-md transition-all duration-200 ${onClick ? "cursor-pointer hover:border-primary/40" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-[1.6rem] font-bold tracking-tight leading-none">{(value ?? 0).toLocaleString()}</p>
        <p className="text-[0.72rem] text-muted-foreground mt-1 font-medium">{label}</p>
        {sub && <p className="text-[0.68rem] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    api.dashboard.get()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="text-[0.85rem]">Loading dashboard...</span>
    </div>
  );

  if (error || !stats) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <p className="text-[0.85rem]">Could not load dashboard data.</p>
      <button onClick={load} className="text-[0.8rem] text-primary underline">Retry</button>
    </div>
  );

  const scheduledExams = stats.exams?.scheduled ?? 0;
  const completedExams = stats.exams?.completed ?? 0;
  const ongoingExams   = stats.exams?.ongoing   ?? 0;
  const totalExams     = scheduledExams + completedExams + ongoingExams;

  const attendanceRate = stats.totalAttendance > 0
    ? Math.round((stats.presentCount / stats.totalAttendance) * 100)
    : null;

  // Chart data
  const schoolData  = (stats.studentsBySchool ?? []).map(s => ({ name: s.school, students: Number(s.count) }));
  const batchData   = (stats.studentsByBatch  ?? []).map(b => ({ name: b.batch,  students: Number(b.count) }));
  const examPieData = [
    { name: "Scheduled", value: scheduledExams },
    { name: "Completed", value: completedExams },
    { name: "Ongoing",   value: ongoingExams },
  ].filter(d => d.value > 0);

  // Today's date string
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-[0.8rem] text-muted-foreground mt-0.5">
            Gautam Buddha University — Exam Management System
          </p>
        </div>
        <Badge variant="outline" className="text-[0.72rem] hidden sm:flex items-center gap-1.5 px-3 py-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          {today}
        </Badge>
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Students"    value={stats.totalStudents}    icon={Users}         colorClass="text-blue-600 bg-blue-50"    onClick={() => navigate("/admin/students")} />
        <StatCard label="Total Faculty"     value={stats.totalFaculty}     icon={UserCheck}     colorClass="text-violet-600 bg-violet-50" onClick={() => navigate("/admin/faculty-management")}
          sub={stats.facultyOnLeave > 0 ? `${stats.facultyOnLeave} on leave` : "All available"} />
        <StatCard label="Exam Rooms"        value={stats.totalRooms}       icon={DoorOpen}      colorClass="text-green-600 bg-green-50"   onClick={() => navigate("/admin/rooms")}
          sub={`${stats.availableRooms} available · ${stats.totalCapacity?.toLocaleString()} seats`} />
        <StatCard label="Total Exams"       value={totalExams}             icon={FileText}      colorClass="text-amber-600 bg-amber-50"   onClick={() => navigate("/admin/exams")}
          sub={`${scheduledExams} scheduled · ${ongoingExams} ongoing`} />
        <StatCard label="Students Seated"   value={stats.totalSeated}      icon={Grid3X3}       colorClass="text-indigo-600 bg-indigo-50" onClick={() => navigate("/admin/seating")} />
        <StatCard label="Attendance Marked" value={stats.totalAttendance}  icon={ClipboardList} colorClass="text-teal-600 bg-teal-50"     onClick={() => navigate("/admin/attendance")}
          sub={attendanceRate !== null ? `${attendanceRate}% present rate` : undefined} />
      </div>

      {/* Attendance summary strip */}
      {stats.totalAttendance > 0 && (
        <Card className="border-0 bg-gradient-to-r from-green-50 to-red-50">
          <CardContent className="py-3 px-5">
            <div className="flex flex-wrap items-center gap-6 text-[0.82rem]">
              <span className="font-semibold text-muted-foreground">Attendance Overview</span>
              <span className="flex items-center gap-1.5 text-green-700 font-medium">
                <CheckCircle2 className="w-4 h-4" /> {stats.presentCount?.toLocaleString()} Present
              </span>
              <span className="flex items-center gap-1.5 text-red-700 font-medium">
                <XCircle className="w-4 h-4" /> {stats.absentCount?.toLocaleString()} Absent
              </span>
              {attendanceRate !== null && (
                <div className="flex items-center gap-2 ml-auto">
                  <div className="w-32 bg-red-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${attendanceRate}%` }} />
                  </div>
                  <span className="font-bold text-green-700">{attendanceRate}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Students by School */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-[0.9rem] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" /> Students by School
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schoolData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={schoolData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}
                    cursor={{ fill: "var(--accent)" }}
                  />
                  <Bar dataKey="students" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground text-[0.85rem] py-10">No student data yet.</p>}
          </CardContent>
        </Card>

        {/* Exam Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[0.9rem] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" /> Exam Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={examPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    paddingAngle={4} dataKey="value" nameKey="name" isAnimationActive={false}>
                    {examPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground text-[0.85rem] py-10">No exam data yet.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Students by Batch */}
      {batchData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[0.9rem] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" /> Students by Batch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={batchData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid var(--border)" }} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="students" radius={[5, 5, 0, 0]} maxBarSize={40}>
                  {batchData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Exams */}
      {(stats.upcomingExams ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[0.9rem] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" /> Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(stats.upcomingExams ?? []).map(exam => {
                const shift  = exam.shift || "Shift 1 (Morning)";
                const style  = SHIFT_STYLE[shift] || SHIFT_STYLE["Shift 1 (Morning)"];
                const ShiftIcon = style.icon;
                const dateStr = new Date(exam.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
                return (
                  <div key={exam.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors ${style.bg} border-l-4`}>
                    <div className="shrink-0">
                      <ShiftIcon className={`w-5 h-5 ${style.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.82rem] font-semibold truncate">{exam.subject}</span>
                        <span className={`text-[0.65rem] px-2 py-0.5 rounded-full font-mono font-bold ${style.badge}`}>
                          {exam.courseCode || exam.course_code}
                        </span>
                      </div>
                      <p className="text-[0.72rem] text-muted-foreground mt-0.5">
                        Sem {exam.semester} · {exam.batch || "—"} · {(exam.branches || []).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[0.78rem] font-semibold">{dateStr}</p>
                      <p className="text-[0.7rem] text-muted-foreground">{exam.startTime || exam.start_time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
