import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Users, DoorOpen, FileText, UserCheck, Grid3X3, RefreshCw, AlertCircle, CheckCircle2, Clock, TrendingUp, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export function Dashboard() {  const { faculty } = useStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.get()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin" /><span className="text-[0.85rem]">Loading dashboard...</span>
    </div>
  );

  if (!stats) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-[0.85rem]">
      Could not load dashboard data.
    </div>
  );

  const scheduledExams = stats.exams?.scheduled ?? 0;
  const completedExams = stats.exams?.completed ?? 0;
  const ongoingExams   = stats.exams?.ongoing ?? 0;

  const statCards = [
    { label: "Total Students",   value: stats.totalStudents,    icon: Users,     color: "text-blue-600 bg-blue-50" },
    { label: "Rooms",            value: stats.totalRooms,       icon: DoorOpen,  color: "text-green-600 bg-green-50" },
    { label: "Upcoming Exams",   value: scheduledExams,         icon: FileText,  color: "text-amber-600 bg-amber-50" },
    { label: "Faculty Available",value: stats.availableFaculty, icon: UserCheck, color: "text-purple-600 bg-purple-50" },
    { label: "Total Capacity",   value: stats.totalCapacity,    icon: Grid3X3,   color: "text-indigo-600 bg-indigo-50" },
    { label: "Total Faculty",    value: stats.totalFaculty,     icon: TrendingUp,color: "text-teal-600 bg-teal-50" },
  ];

  const branchData = (stats.studentsBySchool ?? []).map(s => ({ branch: s.school, students: s.count }));
  const examStatusData = [
    { name: "Scheduled", value: scheduledExams },
    { name: "Completed", value: completedExams },
    { name: "Ongoing",   value: ongoingExams },
  ].filter(d => d.value > 0);

  const pendingReplacements = (stats.recentReplacements ?? []).filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-[0.8rem] text-muted-foreground mt-0.5">Overview of exam operations at Gautam Buddha University</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(stat => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-semibold tracking-tight">{(stat.value ?? 0).toLocaleString()}</p>
              <p className="text-[0.72rem] text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-[0.9rem]">Students by School</CardTitle></CardHeader>
          <CardContent>
            {branchData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground text-[0.85rem] py-12">No student data yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-[0.9rem]">Exam Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {examStatusData.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={examStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      paddingAngle={5} dataKey="value" nameKey="name" isAnimationActive={false}
                      label={({ name, value }) => `${name}: ${value}`}>
                      {examStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-center text-muted-foreground text-[0.85rem] py-12">No exam data yet.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming exams + Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[0.9rem] flex items-center gap-2"><Clock className="w-4 h-4" /> Upcoming Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats.upcomingExams ?? []).length === 0
                ? <p className="text-[0.8rem] text-muted-foreground py-4 text-center">No upcoming exams</p>
                : (stats.upcomingExams ?? []).map(exam => (
                  <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[0.82rem] font-medium">{exam.subject}</p>
                        <p className="text-[0.7rem] text-muted-foreground">{exam.name} • Sem {exam.semester}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[0.75rem] font-medium">{new Date(exam.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      <p className="text-[0.7rem] text-muted-foreground">{exam.startTime}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[0.9rem] flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Alerts & Replacements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingReplacements > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg">
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <p className="text-[0.8rem]">{pendingReplacements} pending replacement request(s)</p>
                </div>
              )}
              {(stats.recentReplacements ?? []).map(rep => (
                <div key={rep.id} className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                  <div className="shrink-0">
                    {rep.status === "approved" ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : rep.status === "pending" ? <Clock className="w-4 h-4 text-amber-600" />
                      : <AlertCircle className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8rem] truncate">{rep.originalFacultyName} — {rep.reason}</p>
                    <Badge variant={rep.status === "approved" ? "default" : rep.status === "pending" ? "secondary" : "destructive"}
                      className="text-[0.65rem] mt-1">{rep.status}</Badge>
                  </div>
                </div>
              ))}
              {(stats.recentReplacements ?? []).length === 0 && pendingReplacements === 0 && (
                <p className="text-[0.8rem] text-muted-foreground py-4 text-center">No alerts at this time</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
