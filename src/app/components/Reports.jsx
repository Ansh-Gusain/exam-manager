import { useMemo, useState, useEffect } from "react";
import { useStore } from "../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DoorOpen, UserCheck, ClipboardList, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

export function Reports() {
  const { students, rooms, exams, faculty, seatingAllocations, invigilationAllocations, attendanceRecords } = useStore();

  // ── Room Utilization filters ──
  const [selectedDate,  setSelectedDate]  = useState("");
  const [selectedShift, setSelectedShift] = useState("");

  // ── Faculty Duties filters ──
  const [facDate, setFacDate] = useState("");

  // ── Attendance filters ──
  const [attDate,  setAttDate]  = useState("");
  const [attShift, setAttShift] = useState("");

  // Unique exam dates
  const examDates = useMemo(() => [...new Set(exams.map(e => e.date))].sort(), [exams]);

  // Shifts on selected date (rooms tab)
  const shiftsOnDate = useMemo(() => {
    if (!selectedDate) return [];
    return [...new Set(
      exams.filter(e => e.date === selectedDate).map(e => e.shift || "Shift 1 (Morning)")
    )].sort();
  }, [exams, selectedDate]);

  // Shifts on selected date (attendance tab)
  const attShiftsOnDate = useMemo(() => {
    if (!attDate) return [];
    return [...new Set(
      exams.filter(e => e.date === attDate).map(e => e.shift || "Shift 1 (Morning)")
    )].sort();
  }, [exams, attDate]);

  // Auto-select first date on load (rooms)
  useEffect(() => {
    if (examDates.length > 0 && !selectedDate) setSelectedDate(examDates[0]);
  }, [examDates]);

  // Auto-select first shift when date changes (rooms)
  useEffect(() => {
    if (shiftsOnDate.length > 0) setSelectedShift(shiftsOnDate[0]);
  }, [shiftsOnDate]);

  // Auto-select first date on load (faculty)
  useEffect(() => {
    if (examDates.length > 0 && !facDate) setFacDate(examDates[0]);
  }, [examDates]);

  // Auto-select first date on load (attendance)
  useEffect(() => {
    if (examDates.length > 0 && !attDate) setAttDate(examDates[0]);
  }, [examDates]);

  // Auto-select first shift when date changes (attendance)
  useEffect(() => {
    if (attShiftsOnDate.length > 0) setAttShift(attShiftsOnDate[0]);
  }, [attShiftsOnDate]);

  // Exam IDs matching selected date+shift
  const filteredExamIds = useMemo(() => {
    if (!selectedDate || !selectedShift) return new Set(exams.map(e => e.id));
    return new Set(
      exams
        .filter(e => e.date === selectedDate && (e.shift || "Shift 1 (Morning)") === selectedShift)
        .map(e => e.id)
    );
  }, [exams, selectedDate, selectedShift]);

  // Room utilization filtered by date+shift
  const roomUtilization = useMemo(() => {
    return rooms.map(room => {
      const allocations = seatingAllocations.filter(
        sa => sa.roomId === room.id && filteredExamIds.has(sa.examId)
      );
      return {
        room: room.roomNumber,
        building: room.building,
        capacity: room.capacity,
        allocated: allocations.length,
        utilization: room.capacity > 0 ? Math.round(allocations.length / room.capacity * 100) : 0      };
    }).filter(r => r.allocated > 0).sort((a,b) => b.utilization - a.utilization);
  }, [rooms, seatingAllocations, filteredExamIds]);

  // Faculty duty summary — filtered by facDate only
  const facultyDutySummary = useMemo(() => {
    const facExamIds = new Set(
      exams
        .filter(e => !facDate || e.date === facDate)
        .map(e => e.id)
    );

    const filtered = invigilationAllocations.filter(ia => facExamIds.has(ia.examId));

    const map = {};
    for (const ia of filtered) {
      const f = faculty.find(f => String(f.id) === String(ia.facultyId));
      if (!f) continue;
      if (!map[f.id]) map[f.id] = { name: f.name, department: f.department, totalDuties: 0 };
      map[f.id].totalDuties++;
    }

    return Object.values(map).sort((a, b) => b.totalDuties - a.totalDuties);
  }, [faculty, invigilationAllocations, exams, facDate]);

  // Attendance summary — filtered by attDate + attShift
  const attendanceSummary = useMemo(() => {
    return exams
      .filter(e => {
        if (!attDate) return true;
        const matchDate  = e.date === attDate;
        const matchShift = !attShift || (e.shift || "Shift 1 (Morning)") === attShift;
        return matchDate && matchShift;
      })
      .map(exam => {
        const records = attendanceRecords.filter(ar => String(ar.examId) === String(exam.id));
        const present = records.filter(r => r.status === "present").length;
        const absent  = records.filter(r => r.status === "absent").length;
        const total   = records.length;
        return {
          exam: `${exam.courseCode || exam.course_code} - ${exam.subject}`,
          date: exam.date,
          shift: exam.shift || "Shift 1 (Morning)",
          total, present, absent,
          rate: total > 0 ? Math.round(present / total * 100) : 0
        };
      })
      .filter(a => a.total > 0)
      .sort((a, b) => a.exam.localeCompare(b.exam));
  }, [exams, attendanceRecords, attDate, attShift]);

  // Distribution charts
  const branchStudentCount = useMemo(() => {
    const map = {};
    for (const s of students) { map[s.branch] = (map[s.branch] || 0) + 1; }
    return Object.entries(map).map(([branch, count]) => ({ branch, count })).sort((a,b) => b.count - a.count);
  }, [students]);

  const deptInvigilation = useMemo(() => {
    const map = {};
    for (const ia of invigilationAllocations) {
      const f = faculty.find(f => String(f.id) === String(ia.facultyId));
      if (f) map[f.department] = (map[f.department] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [invigilationAllocations, faculty]);

  const totalAllocations   = seatingAllocations.length;
  const totalInvigilations = invigilationAllocations.length;
  const totalAttendance    = attendanceRecords.length;

  return (
    <div className="space-y-4">
      <div><h1>Reports & Analytics</h1></div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-[0.75rem] text-muted-foreground">Seats Allocated</span>
            </div>
            <p className="text-[1.1rem] font-semibold">{totalAllocations}</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-green-600" />
              <span className="text-[0.75rem] text-muted-foreground">Invigilation Duties</span>
            </div>
            <p className="text-[1.1rem] font-semibold">{totalInvigilations}</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              <span className="text-[0.75rem] text-muted-foreground">Attendance Marked</span>
            </div>
            <p className="text-[1.1rem] font-semibold">{totalAttendance}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rooms">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="rooms" className="text-[0.8rem]">Room Utilization</TabsTrigger>
          <TabsTrigger value="faculty" className="text-[0.8rem]">Faculty Duties</TabsTrigger>
          <TabsTrigger value="attendance" className="text-[0.8rem]">Attendance</TabsTrigger>
          <TabsTrigger value="distribution" className="text-[0.8rem]">Distribution</TabsTrigger>
        </TabsList>

        {/* ── Room Utilization ── */}
        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-[0.9rem] flex items-center gap-2">
                  <DoorOpen className="w-4 h-4" /> Room Utilization
                </CardTitle>
                {/* Date + Shift filters */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Date dropdown */}
                  <Select value={selectedDate} onValueChange={v => setSelectedDate(v)}>
                    <SelectTrigger className="h-8 text-[0.8rem] w-[180px]">
                      <SelectValue placeholder="Select date..." />
                    </SelectTrigger>
                    <SelectContent>
                      {examDates.map(date => (
                        <SelectItem key={date} value={date}>
                          {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Shift buttons */}
                  {shiftsOnDate.map(shift => {
                    const isMorning = shift.includes("Morning") || shift.includes("1");
                    const isSelected = selectedShift === shift;
                    return (
                      <button key={shift} onClick={() => setSelectedShift(shift)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[0.78rem] font-medium transition-colors ${
                          isSelected
                            ? isMorning
                              ? "bg-amber-100 border-amber-400 text-amber-800"
                              : "bg-indigo-100 border-indigo-400 text-indigo-800"
                            : "bg-background border-border hover:bg-accent text-foreground"
                        }`}>
                        <span>{isMorning ? "☀" : "🌙"}</span>
                        <span>{shift}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {roomUtilization.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roomUtilization}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="room" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => [`${v}%`, "Utilization"]} />
                    <Bar dataKey="utilization" fill="#6366f1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground text-[0.85rem] py-12">
                  {!selectedDate ? "Select a date to view room utilization." : "No seating allocations for the selected date/shift."}
                </p>
              )}
            </CardContent>
          </Card>

          {roomUtilization.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[0.75rem]">Room</TableHead>
                      <TableHead className="text-[0.75rem]">Building</TableHead>
                      <TableHead className="text-[0.75rem]">Capacity</TableHead>
                      <TableHead className="text-[0.75rem]">Allocated</TableHead>
                      <TableHead className="text-[0.75rem]">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomUtilization.map(r => (
                      <TableRow key={r.room}>
                        <TableCell className="text-[0.8rem] font-mono font-semibold">{r.room}</TableCell>
                        <TableCell className="text-[0.8rem]">{r.building}</TableCell>
                        <TableCell className="text-[0.8rem] font-mono">{r.capacity}</TableCell>
                        <TableCell className="text-[0.8rem] font-mono">{r.allocated}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-accent rounded-full h-2">
                              <div className={`h-2 rounded-full ${r.utilization > 90 ? "bg-red-500" : r.utilization > 70 ? "bg-amber-500" : "bg-green-500"}`}
                                style={{ width: `${Math.min(r.utilization, 100)}%` }} />
                            </div>
                            <span className="text-[0.75rem] font-mono">{r.utilization}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Faculty Duties ── */}
        <TabsContent value="faculty">
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-[0.9rem] flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> Faculty Duty Summary
                </CardTitle>
                {/* Date filter only */}
                <Select value={facDate} onValueChange={v => setFacDate(v)}>
                  <SelectTrigger className="h-8 text-[0.8rem] w-[180px]">
                    <SelectValue placeholder="Select date..." />
                  </SelectTrigger>
                  <SelectContent>
                    {examDates.map(date => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {facultyDutySummary.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[0.75rem]">Faculty</TableHead>
                        <TableHead className="text-[0.75rem]">Department</TableHead>
                        <TableHead className="text-[0.75rem]">Duties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facultyDutySummary.map(f => (
                        <TableRow key={f.name}>
                          <TableCell className="text-[0.8rem]">{f.name}</TableCell>
                          <TableCell className="text-[0.8rem]">{f.department}</TableCell>
                          <TableCell className="text-[0.8rem] font-mono font-semibold">{f.totalDuties}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-[0.85rem] py-12">
                  No invigilation duties found for the selected date/shift.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Attendance ── */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-[0.9rem] flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Attendance by Exam
                </CardTitle>
                {/* Date + Shift filters */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Select value={attDate} onValueChange={v => setAttDate(v)}>
                    <SelectTrigger className="h-8 text-[0.8rem] w-[180px]">
                      <SelectValue placeholder="Select date..." />
                    </SelectTrigger>
                    <SelectContent>
                      {examDates.map(date => (
                        <SelectItem key={date} value={date}>
                          {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {attShiftsOnDate.map(shift => {
                    const isMorning = shift.includes("Morning") || shift.includes("1");
                    const isSelected = attShift === shift;
                    return (
                      <button key={shift} onClick={() => setAttShift(shift)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[0.78rem] font-medium transition-colors ${
                          isSelected
                            ? isMorning
                              ? "bg-amber-100 border-amber-400 text-amber-800"
                              : "bg-indigo-100 border-indigo-400 text-indigo-800"
                            : "bg-background border-border hover:bg-accent text-foreground"
                        }`}>
                        <span>{isMorning ? "☀" : "🌙"}</span>
                        <span>{shift}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {attendanceSummary.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={attendanceSummary}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="exam" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#22c55e" name="Present" radius={[4,4,0,0]} />
                      <Bar dataKey="absent"  fill="#ef4444" name="Absent"  radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[0.75rem]">Exam</TableHead>
                          <TableHead className="text-[0.75rem]">Total</TableHead>
                          <TableHead className="text-[0.75rem]">Present</TableHead>
                          <TableHead className="text-[0.75rem]">Absent</TableHead>
                          <TableHead className="text-[0.75rem]">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceSummary.map((a, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-[0.8rem]">{a.exam}</TableCell>
                            <TableCell className="text-[0.8rem] font-mono">{a.total}</TableCell>
                            <TableCell className="text-[0.8rem] font-mono text-green-600">{a.present}</TableCell>
                            <TableCell className="text-[0.8rem] font-mono text-red-600">{a.absent}</TableCell>
                            <TableCell>
                              <Badge className={`text-[0.7rem] ${a.rate > 75 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                {a.rate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground text-[0.85rem] py-12">
                  No attendance data found for the selected date/shift.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Distribution ── */}
        <TabsContent value="distribution">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[0.9rem]">Students by Branch</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={branchStudentCount} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                      paddingAngle={3} dataKey="count" nameKey="branch"
                      label={({ branch, count }) => `${branch}: ${count}`}>
                      {branchStudentCount.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[0.9rem]">Invigilation by Department</CardTitle>
              </CardHeader>
              <CardContent>
                {deptInvigilation.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={deptInvigilation} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                        paddingAngle={3} dataKey="value" nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`}>
                        {deptInvigilation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground text-[0.85rem] py-12">No invigilation data yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Reports;
