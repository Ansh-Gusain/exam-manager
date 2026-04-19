import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import {
  DoorOpen,
  UserCheck,
  ClipboardList,
  Users,
  Award
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
function Reports() {
  const {
    students,
    rooms,
    exams,
    faculty,
    seatingAllocations,
    invigilationAllocations,
    attendanceRecords,
    replacementLogs
  } = useStore();
  const [selectedExamId, setSelectedExamId] = useState("all");
  const roomUtilization = useMemo(() => {
    return rooms.map((room) => {
      const allocations = seatingAllocations.filter(
        (sa) => sa.roomId === room.id && (selectedExamId === "all" || sa.examId === selectedExamId)
      );
      return {
        room: room.roomNumber,
        building: room.building,
        capacity: room.capacity,
        allocated: allocations.length,
        utilization: room.capacity > 0 ? Math.round(allocations.length / room.capacity * 100) : 0
      };
    }).filter((r) => r.allocated > 0);
  }, [rooms, seatingAllocations, selectedExamId]);
  const facultyDutySummary = useMemo(() => {
    return faculty.map((f) => {
      const duties = invigilationAllocations.filter(
        (ia) => ia.facultyId === f.id
      ).length;
      const chiefDuties = invigilationAllocations.filter(
        (ia) => ia.facultyId === f.id && ia.role === "chief"
      ).length;
      const replacements = replacementLogs.filter(
        (r) => r.originalFacultyId === f.id && r.status === "approved"
      ).length;
      return {
        name: f.name,
        department: f.department,
        designation: f.designation,
        totalDuties: f.totalDuties + duties,
        chiefDuties,
        assistantDuties: duties - chiefDuties,
        replacementsRequested: replacements
      };
    }).sort((a, b) => b.totalDuties - a.totalDuties);
  }, [faculty, invigilationAllocations, replacementLogs]);
  const attendanceSummary = useMemo(() => {
    return exams.map((exam) => {
      const records = attendanceRecords.filter((ar) => ar.examId === exam.id);
      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const total = records.length;
      return {
        exam: exam.subject,
        date: exam.date,
        total,
        present,
        absent,
        rate: total > 0 ? Math.round(present / total * 100) : 0
      };
    }).filter((a) => a.total > 0);
  }, [exams, attendanceRecords]);
  const deptAllocation = useMemo(() => {
    const deptMap = {};
    for (const ia of invigilationAllocations) {
      const fac = faculty.find((f) => f.id === ia.facultyId);
      if (fac) {
        deptMap[fac.department] = (deptMap[fac.department] || 0) + 1;
      }
    }
    return Object.entries(deptMap).map(([dept, count]) => ({
      name: dept,
      value: count
    }));
  }, [invigilationAllocations, faculty]);
  const branchStudentCount = useMemo(() => {
    const map = {};
    for (const s of students) {
      map[s.branch] = (map[s.branch] || 0) + 1;
    }
    return Object.entries(map).map(([branch, count]) => ({
      branch,
      count
    }));
  }, [students]);
  const totalAllocations = seatingAllocations.length;
  const totalInvigilations = invigilationAllocations.length;
  const totalAttendanceMarked = attendanceRecords.length;
  const approvedReplacements = replacementLogs.filter((r) => r.status === "approved").length;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", { children: "Reports & Analytics" }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsx(Card, { className: "py-3", children: /* @__PURE__ */ jsxs(CardContent, { className: "px-4 py-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-blue-600" }),
          /* @__PURE__ */ jsx("span", { className: "text-[0.75rem] text-muted-foreground", children: "Seats Allocated" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[1.1rem]", children: totalAllocations })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "py-3", children: /* @__PURE__ */ jsxs(CardContent, { className: "px-4 py-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsx(UserCheck, { className: "w-4 h-4 text-green-600" }),
          /* @__PURE__ */ jsx("span", { className: "text-[0.75rem] text-muted-foreground", children: "Invigilation Duties" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[1.1rem]", children: totalInvigilations })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "py-3", children: /* @__PURE__ */ jsxs(CardContent, { className: "px-4 py-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsx(ClipboardList, { className: "w-4 h-4 text-amber-600" }),
          /* @__PURE__ */ jsx("span", { className: "text-[0.75rem] text-muted-foreground", children: "Attendance Marked" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[1.1rem]", children: totalAttendanceMarked })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "py-3", children: /* @__PURE__ */ jsxs(CardContent, { className: "px-4 py-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsx(Award, { className: "w-4 h-4 text-purple-600" }),
          /* @__PURE__ */ jsx("span", { className: "text-[0.75rem] text-muted-foreground", children: "Replacements" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[1.1rem]", children: approvedReplacements })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "rooms", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "flex-wrap h-auto gap-1", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "rooms", className: "text-[0.8rem]", children: "Room Utilization" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "faculty", className: "text-[0.8rem]", children: "Faculty Duties" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "attendance", className: "text-[0.8rem]", children: "Attendance" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "distribution", className: "text-[0.8rem]", children: "Distribution" })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "rooms", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "py-3 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "text-[0.9rem] flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(DoorOpen, { className: "w-4 h-4" }),
              " Room Utilization"
            ] }),
            /* @__PURE__ */ jsxs(Select, { value: selectedExamId, onValueChange: setSelectedExamId, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[200px] h-8 text-[0.8rem]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter exam" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Exams" }),
                exams.map((exam) => /* @__PURE__ */ jsxs(SelectItem, { value: exam.id, children: [
                  exam.subject,
                  " (",
                  exam.date,
                  ")"
                ] }, exam.id))
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { children: roomUtilization.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(BarChart, { data: roomUtilization, children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)" }),
            /* @__PURE__ */ jsx(XAxis, { dataKey: "room", tick: { fontSize: 11 } }),
            /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 11 }, unit: "%" }),
            /* @__PURE__ */ jsx(
              Tooltip,
              {
                formatter: (value, name) => [
                  `${value}%`,
                  name === "utilization" ? "Utilization" : name
                ]
              }
            ),
            /* @__PURE__ */ jsx(Bar, { dataKey: "utilization", fill: "#6366f1", radius: [4, 4, 0, 0] })
          ] }) }) : /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground text-[0.85rem] py-12", children: "No seating allocations yet. Allocate seats to see utilization data." }) })
        ] }),
        roomUtilization.length > 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Room" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Building" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Capacity" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Allocated" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Utilization" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: roomUtilization.map((r) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsxs(TableCell, { className: "text-[0.8rem]", children: [
              "Room ",
              r.room
            ] }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem]", children: r.building }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem] font-mono", children: r.capacity }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem] font-mono", children: r.allocated }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-20 bg-accent rounded-full h-2", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: `h-2 rounded-full ${r.utilization > 90 ? "bg-red-500" : r.utilization > 70 ? "bg-amber-500" : "bg-green-500"}`,
                  style: { width: `${Math.min(r.utilization, 100)}%` }
                }
              ) }),
              /* @__PURE__ */ jsxs("span", { className: "text-[0.75rem] font-mono", children: [
                r.utilization,
                "%"
              ] })
            ] }) })
          ] }, r.room)) })
        ] }) }) })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "faculty", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-[0.9rem] flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(UserCheck, { className: "w-4 h-4" }),
          " Faculty Duty Summary"
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Faculty" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Department" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Designation" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Total Duties" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Chief" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Assistant" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Replacements" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: facultyDutySummary.map((f) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem]", children: f.name }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem]", children: f.department }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem]", children: f.designation }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem] font-mono", children: f.totalDuties }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem] font-mono", children: f.chiefDuties }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem] font-mono", children: f.assistantDuties }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem] font-mono", children: f.replacementsRequested })
          ] }, f.name)) })
        ] }) }) })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "attendance", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-[0.9rem] flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ClipboardList, { className: "w-4 h-4" }),
          " Attendance Reports"
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: attendanceSummary.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 250, children: /* @__PURE__ */ jsxs(BarChart, { data: attendanceSummary, children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)" }),
            /* @__PURE__ */ jsx(XAxis, { dataKey: "exam", tick: { fontSize: 11 } }),
            /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 11 } }),
            /* @__PURE__ */ jsx(Tooltip, {}),
            /* @__PURE__ */ jsx(Legend, {}),
            /* @__PURE__ */ jsx(Bar, { dataKey: "present", fill: "#22c55e", name: "Present", radius: [4, 4, 0, 0] }),
            /* @__PURE__ */ jsx(Bar, { dataKey: "absent", fill: "#ef4444", name: "Absent", radius: [4, 4, 0, 0] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Exam" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Date" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Total" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Present" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Absent" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Rate" })
            ] }) }),
            /* @__PURE__ */ jsx(TableBody, { children: attendanceSummary.map((a) => /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem]", children: a.exam }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem]", children: a.date }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem] font-mono", children: a.total }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem] font-mono text-green-600", children: a.present }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem] font-mono text-red-600", children: a.absent }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(Badge, { className: `text-[0.7rem] ${a.rate > 75 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`, children: [
                a.rate,
                "%"
              ] }) })
            ] }, a.exam)) })
          ] }) })
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground text-[0.85rem] py-12", children: "No attendance data available. Mark attendance to see reports." }) })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "distribution", children: /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-[0.9rem]", children: "Students by Branch" }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 250, children: /* @__PURE__ */ jsxs(PieChart, { children: [
            /* @__PURE__ */ jsx(
              Pie,
              {
                data: branchStudentCount,
                cx: "50%",
                cy: "50%",
                innerRadius: 50,
                outerRadius: 90,
                paddingAngle: 3,
                dataKey: "count",
                nameKey: "branch",
                label: ({ branch, count }) => `${branch}: ${count}`,
                children: branchStudentCount.map((_, i) => /* @__PURE__ */ jsx(Cell, { fill: COLORS[i % COLORS.length] }, i))
              }
            ),
            /* @__PURE__ */ jsx(Tooltip, {})
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-[0.9rem]", children: "Invigilation by Department" }) }),
          /* @__PURE__ */ jsx(CardContent, { children: deptAllocation.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 250, children: /* @__PURE__ */ jsxs(PieChart, { children: [
            /* @__PURE__ */ jsx(
              Pie,
              {
                data: deptAllocation,
                cx: "50%",
                cy: "50%",
                innerRadius: 50,
                outerRadius: 90,
                paddingAngle: 3,
                dataKey: "value",
                nameKey: "name",
                label: ({ name, value }) => `${name}: ${value}`,
                children: deptAllocation.map((_, i) => /* @__PURE__ */ jsx(Cell, { fill: COLORS[i % COLORS.length] }, i))
              }
            ),
            /* @__PURE__ */ jsx(Tooltip, {})
          ] }) }) : /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground text-[0.85rem] py-12", children: "No invigilation data yet." }) })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  Reports
};
