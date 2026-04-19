import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Grid3X3,
  Play,
  AlertCircle,
  CheckCircle2,
  Users,
  DoorOpen,
  LayoutGrid,
  List,
  TableIcon
} from "lucide-react";
import { toast } from "sonner";

// â”€â”€â”€ Colour palette for interleaving programmes in the room grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PROGRAMME_COLOURS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "bg-red-100 text-red-800 border-red-200",
];

// â”€â”€â”€ Master Summary Table (Sheet 1 style) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MasterSummaryTable({ exam, allocatedRooms, students, rooms }) {
  if (!exam || allocatedRooms.length === 0) return null;

  // Group allocations by room, then by branch within room
  const rows = [];
  let sNo = 1;
  allocatedRooms.forEach(({ room, allocations }) => {
    // Group by branch
    const byBranch = {};
    allocations.forEach((sa) => {
      const student = students.find((s) => s.id === sa.studentId);
      if (!student) return;
      const key = student.branch;
      if (!byBranch[key]) byBranch[key] = [];
      byBranch[key].push(student);
    });

    Object.entries(byBranch).forEach(([branch, studs]) => {
      const sorted = [...studs].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
      rows.push({
        sNo: sNo++,
        building: room.building,
        room: room.roomNumber,
        programme: branch,
        semester: exam.semester,
        batch: exam.batch || "â€”",
        from: sorted[0]?.rollNumber || "â€”",
        to: sorted[sorted.length - 1]?.rollNumber || "â€”",
        count: sorted.length,
        paperCode: exam.subject,
        courseName: exam.name,
      });
    });
  });

  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-[0.75rem] border-collapse">
        <thead>
          <tr className="bg-muted/60">
            <th className="border border-border px-2 py-2 text-left font-semibold whitespace-nowrap">S.No</th>
            <th className="border border-border px-2 py-2 text-left font-semibold whitespace-nowrap">Programme / Batch / Semester</th>
            <th className="border border-border px-2 py-2 text-left font-semibold whitespace-nowrap">Course Code &amp; Name</th>
            <th className="border border-border px-2 py-2 text-left font-semibold whitespace-nowrap">Building</th>
            <th className="border border-border px-2 py-2 text-left font-semibold whitespace-nowrap">Room</th>
            <th className="border border-border px-2 py-2 text-left font-semibold whitespace-nowrap">Roll No. (From)</th>
            <th className="border border-border px-2 py-2 text-left font-semibold whitespace-nowrap">Roll No. (To)</th>
            <th className="border border-border px-2 py-2 text-right font-semibold whitespace-nowrap">No. of Students</th>
            <th className="border border-border px-2 py-2 text-right font-semibold whitespace-nowrap">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
              <td className="border border-border px-2 py-1.5 text-center">{row.sNo}</td>
              <td className="border border-border px-2 py-1.5">
                <span className="font-medium">{row.programme}</span>
                <span className="text-muted-foreground ml-1">Sem {row.semester} ({row.batch})</span>
              </td>
              <td className="border border-border px-2 py-1.5">
                <span className="font-mono text-[0.7rem] bg-muted px-1 rounded">{row.paperCode}</span>
                <span className="ml-1">{row.courseName}</span>
              </td>
              <td className="border border-border px-2 py-1.5">{row.building}</td>
              <td className="border border-border px-2 py-1.5 font-mono font-semibold">{row.room}</td>
              <td className="border border-border px-2 py-1.5 font-mono text-[0.7rem]">{row.from}</td>
              <td className="border border-border px-2 py-1.5 font-mono text-[0.7rem]">{row.to}</td>
              <td className="border border-border px-2 py-1.5 text-right font-semibold">{row.count}</td>
              <td className="border border-border px-2 py-1.5 text-right text-muted-foreground">{row.sNo === 1 ? total : ""}</td>
            </tr>
          ))}
          <tr className="bg-primary/5 font-semibold">
            <td colSpan={7} className="border border-border px-2 py-1.5 text-right">Total No. of Students</td>
            <td className="border border-border px-2 py-1.5 text-right">{total}</td>
            <td className="border border-border px-2 py-1.5 text-right">{total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// â”€â”€â”€ Per-Room Seating Grid (Excel-style with 8 columns like IL-101) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RoomSeatingGrid({ room, allocations, students, exam, exams = [], invigilators = [], faculty = [] }) {
  if (!room || allocations.length === 0) return null;

  const getExam = (sa) => exams.find(e => e.id === sa.examId) || exam || null;

  const branches = [...new Set(
    allocations.map((sa) => students.find((s) => s.id === sa.studentId)?.branch).filter(Boolean)
  )];
  const branchColour = {};
  branches.forEach((b, i) => { branchColour[b] = PROGRAMME_COLOURS[i % PROGRAMME_COLOURS.length]; });

  const sorted = [...allocations].sort((a, b) => (a.seatNumber || 0) - (b.seatNumber || 0));
  const seatMap = {};
  sorted.forEach((sa) => { seatMap[sa.seatNumber] = sa; });
  const maxSeat = sorted.length > 0 ? Math.max(...sorted.map(s => s.seatNumber || 0)) : 0;

  const COLS = 6;
  const rows = [];
  for (let i = 1; i <= maxSeat; i += COLS) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const seatNum = i + c;
      row.push(seatNum <= maxSeat ? (seatMap[seatNum] || null) : null);
    }
    rows.push(row);
  }

  // Per-branch summary — each branch looks up its own exam for course code + name
  const branchSummary = branches.map((branch) => {
    const branchAllocs = allocations.filter((sa) => {
      const st = students.find((s) => s.id === sa.studentId);
      return st?.branch === branch;
    });
    const studs = branchAllocs
      .map((sa) => students.find((s) => s.id === sa.studentId))
      .filter(Boolean)
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
    const branchExam = branchAllocs.length > 0 ? getExam(branchAllocs[0]) : null;
    return {
      branch,
      from:       studs[0]?.rollNumber || "-",
      to:         studs[studs.length - 1]?.rollNumber || "-",
      count:      studs.length,
      semester:   branchExam?.semester || "-",
      courseCode: branchExam?.courseCode || branchExam?.course_code || branchExam?.subject || "-",
      courseName: branchExam?.subject || "-",
      batch:      branchExam?.batch || "2024-2028",
    };
  });

  const firstExam = allocations.length > 0 ? getExam(allocations[0]) : null;

  // Find chief and assistant for this room
  const chief     = invigilators.find(ia => ia.role === 'chief');
  const assistant = invigilators.find(ia => ia.role === 'assistant');
  const chiefFac  = chief     ? faculty.find(f => f.id === chief.facultyId)     : null;
  const asstFac   = assistant ? faculty.find(f => f.id === assistant.facultyId) : null;

  return (
    <Card className="overflow-hidden break-inside-avoid mb-6">
      <div className="bg-primary/5 border-b-2 border-primary/20 px-4 py-3 text-center">
        <p className="text-[0.7rem] text-muted-foreground uppercase tracking-wide">Seating Plan (SOICT)</p>
        <h3 className="font-bold text-[1.1rem] mt-1">Room No - {room.roomNumber}</h3>
        <p className="text-[0.75rem] text-muted-foreground mt-0.5">
          {firstExam?.shift || "Second Shift"} &nbsp;&nbsp; {firstExam?.date || ""}
        </p>
        {/* Faculty names */}
        {(chiefFac || asstFac) && (
          <div className="flex flex-wrap justify-center gap-3 mt-2 pt-2 border-t border-primary/10">
            {chiefFac && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-medium bg-primary/10 text-primary border border-primary/20">
                🛡️ <span>{chiefFac.name}</span> <span className="opacity-60">(Chief)</span>
              </div>
            )}
            {asstFac && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-medium bg-muted text-muted-foreground border border-border">
                👤 <span>{asstFac.name}</span> <span className="opacity-60">(Assistant)</span>
              </div>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-0.5 bg-border" />
          <span className="text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-1 bg-muted/50 rounded">WHITE BOARD</span>
          <div className="flex-1 h-0.5 bg-border" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.7rem]">
            <thead>
              <tr>
                <th className="border border-border bg-blue-50 px-2 py-1.5 text-center font-semibold text-[0.65rem] text-blue-700">DESK-1</th>
                <th className="border border-border bg-green-50 px-2 py-1.5 text-center font-semibold text-[0.65rem] text-green-700">DESK-2</th>
                <th className="border border-border bg-blue-50 px-2 py-1.5 text-center font-semibold text-[0.65rem] text-blue-700">DESK-3</th>
                <th className="bg-background w-3 border-0"></th>
                <th className="border border-border bg-green-50 px-2 py-1.5 text-center font-semibold text-[0.65rem] text-green-700">DESK-1</th>
                <th className="border border-border bg-blue-50 px-2 py-1.5 text-center font-semibold text-[0.65rem] text-blue-700">DESK-2</th>
                <th className="border border-border bg-green-50 px-2 py-1.5 text-center font-semibold text-[0.65rem] text-green-700">DESK-3</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {[0, 1, 2].map((ci) => {
                    const sa = row[ci];
                    if (!sa) return (
                      <td key={ci} className="border border-dashed border-muted-foreground/30 px-1.5 py-2 bg-muted/5">
                        <div className="rounded px-2 py-1 text-center text-[0.6rem] text-muted-foreground/40 font-mono">empty</div>
                      </td>
                    );
                    const student = students.find((s) => s.id === sa.studentId);
                    const colour = student ? branchColour[student.branch] : "";
                    return (
                      <td key={ci} className="border border-border px-1.5 py-2">
                        <div className={`rounded px-2 py-1 border font-mono text-center text-[0.68rem] font-medium ${colour}`}>
                          {student?.rollNumber || sa.seatNumber}
                        </div>
                      </td>
                    );
                  })}
                  <td className="bg-background w-3 border-0"></td>
                  {[3, 4, 5].map((ci) => {
                    const sa = row[ci];
                    if (!sa) return (
                      <td key={ci} className="border border-dashed border-muted-foreground/30 px-1.5 py-2 bg-muted/5">
                        <div className="rounded px-2 py-1 text-center text-[0.6rem] text-muted-foreground/40 font-mono">empty</div>
                      </td>
                    );
                    const student = students.find((s) => s.id === sa.studentId);
                    const colour = student ? branchColour[student.branch] : "";
                    return (
                      <td key={ci} className="border border-border px-1.5 py-2">
                        <div className={`rounded px-2 py-1 border font-mono text-center text-[0.68rem] font-medium ${colour}`}>
                          {student?.rollNumber || sa.seatNumber}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 overflow-x-auto rounded border border-border">
          <table className="w-full text-[0.7rem] border-collapse">
            <thead>
              <tr className="bg-muted/60">
                <th className="border border-border px-2 py-1.5 text-left font-semibold">Room No</th>
                <th className="border border-border px-2 py-1.5 text-left font-semibold">Programme</th>
                <th className="border border-border px-2 py-1.5 text-center font-semibold">Semester</th>
                <th className="border border-border px-2 py-1.5 text-center font-semibold">Batch</th>
                <th className="border border-border px-2 py-1.5 text-left font-semibold">From</th>
                <th className="border border-border px-2 py-1.5 text-left font-semibold">To</th>
                <th className="border border-border px-2 py-1.5 text-center font-semibold">No. of Students</th>
                <th className="border border-border px-2 py-1.5 text-left font-semibold">Paper Code</th>
                <th className="border border-border px-2 py-1.5 text-left font-semibold">Course Name</th>
              </tr>
            </thead>
            <tbody>
              {branchSummary.map((bs, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="border border-border px-2 py-1.5 font-mono font-bold">{room.roomNumber}</td>
                  <td className="border border-border px-2 py-1.5">
                    <span className={`px-2 py-0.5 rounded border text-[0.65rem] font-semibold ${branchColour[bs.branch]}`}>{bs.branch}</span>
                  </td>
                  <td className="border border-border px-2 py-1.5 text-center">{bs.semester}</td>
                  <td className="border border-border px-2 py-1.5 text-center">{bs.batch}</td>
                  <td className="border border-border px-2 py-1.5 font-mono text-[0.68rem]">{bs.from}</td>
                  <td className="border border-border px-2 py-1.5 font-mono text-[0.68rem]">{bs.to}</td>
                  <td className="border border-border px-2 py-1.5 text-center font-bold">{bs.count}</td>
                  <td className="border border-border px-2 py-1.5 font-mono text-[0.68rem] bg-primary/5 font-semibold text-primary">{bs.courseCode}</td>
                  <td className="border border-border px-2 py-1.5">{bs.courseName}</td>
                </tr>
              ))}
              <tr className="bg-primary/5 font-bold">
                <td colSpan={6} className="border border-border px-2 py-1.5 text-right">Total</td>
                <td className="border border-border px-2 py-1.5 text-center">{allocations.length}</td>
                <td colSpan={2} className="border border-border px-2 py-1.5"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function SeatingAllocation() {
  const { students, rooms, exams, faculty, seatingAllocations, invigilationAllocations, refreshSeating, refreshInvigilation } = useStore();

  const [selectedDate,   setSelectedDate]   = useState("");
  const [selectedExamId, setSelectedExamId] = useState("all");
  const [selectedRoomId, setSelectedRoomId] = useState("all");
  const [allocating,     setAllocating]     = useState(false);

  const examDates = useMemo(() => [...new Set(
    exams.filter(e => e.status === "scheduled" || e.status === "ongoing").map(e => e.date)
  )].sort(), [exams]);

  const examsOnDate = useMemo(() =>
    exams.filter(e => e.date === selectedDate), [exams, selectedDate]);

  const dateAllocations = useMemo(() => {
    const ids = new Set(examsOnDate.map(e => e.id));
    return seatingAllocations.filter(sa => ids.has(sa.examId));
  }, [seatingAllocations, examsOnDate]);

  const filteredAllocations = useMemo(() =>
    selectedExamId === "all" ? dateAllocations
      : dateAllocations.filter(sa => sa.examId === selectedExamId),
    [dateAllocations, selectedExamId]);

  const roomAllocations = useMemo(() =>
    selectedRoomId === "all" ? filteredAllocations
      : filteredAllocations.filter(sa => sa.roomId === selectedRoomId),
    [filteredAllocations, selectedRoomId]);

  const allocatedRooms = useMemo(() => {
    const ids = [...new Set(filteredAllocations.map(sa => sa.roomId))];
    return ids.map(rid => {
      const room   = rooms.find(r => r.id === rid);
      const allocs = filteredAllocations.filter(sa => sa.roomId === rid);
      return { room, allocations: allocs, studentCount: allocs.length };
    }).filter(r => r.room);
  }, [filteredAllocations, rooms]);

  const selectedExam = selectedExamId !== "all" ? exams.find(e => e.id === selectedExamId) : null;

  const totalEligible = examsOnDate.reduce((sum, exam) =>
    sum + students.filter(s => (exam.branches||[]).includes(s.branch) && s.semester === exam.semester).length, 0);

  const handleAllocate = async () => {
    if (!selectedDate) return;
    setAllocating(true);
    try {
      const result = await api.seating.allocateByDate(selectedDate);
      await refreshSeating();
      await refreshInvigilation();
      toast.success(result.message || `Allocated ${result.count} students on ${selectedDate}`);
      if (examsOnDate.length > 0) setSelectedExamId(examsOnDate[0].id);
    } catch (err) {
      toast.error(err.message || "Allocation failed");
    } finally {
      setAllocating(false);
    }
  };

  const handleClear = async () => {
    if (!selectedDate) return;
    try {
      await api.seating.clearByDate(selectedDate);
      await refreshSeating();
      setSelectedExamId("all");
      toast.success(`Cleared all allocations for ${selectedDate}`);
    } catch (err) {
      toast.error(err.message || "Failed to clear");
    }
  };

  return (
    <div className="space-y-4">
      <div><h1>Seating Allocation</h1></div>

      <Card>
        <CardContent className="py-4 px-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-[0.8rem] text-muted-foreground mb-1 block">Select Exam Date</label>
              <Select value={selectedDate} onValueChange={v => { setSelectedDate(v); setSelectedExamId("all"); }}>
                <SelectTrigger className="text-[0.85rem]">
                  <SelectValue placeholder="Choose a date — all exams on that day will be allocated together..." />
                </SelectTrigger>
                <SelectContent>
                  {examDates.map(date => {
                    const count = exams.filter(e => e.date === date).length;
                    return (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        <span className="ml-2 text-muted-foreground text-[0.75rem]">— {count} exam{count !== 1 ? "s" : ""}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAllocate} disabled={!selectedDate || allocating}>
                <Play className="w-4 h-4 mr-1" />
                {allocating ? "Allocating..." : "Auto Allocate All"}
              </Button>
              {dateAllocations.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleClear}>Clear</Button>
              )}
            </div>
          </div>

          {selectedDate && examsOnDate.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-[0.72rem] text-muted-foreground mb-2 font-medium">
                Exams on {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} — click to filter:
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedExamId("all")}
                  className={`text-[0.72rem] px-3 py-1.5 rounded-full border transition-colors ${selectedExamId === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-accent"}`}>
                  All Exams
                </button>
                {examsOnDate.map(exam => (
                  <button key={exam.id}
                    onClick={() => setSelectedExamId(selectedExamId === exam.id ? "all" : exam.id)}
                    className={`text-[0.72rem] px-3 py-1.5 rounded-full border transition-colors ${selectedExamId === exam.id ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-accent"}`}>
                    <span className="font-mono font-bold">{exam.courseCode || exam.course_code || exam.subject}</span>
                    <span className="ml-1.5 opacity-70">{exam.shift?.includes("Morning") ? "☀️" : "🌙"} Sem {exam.semester}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && (
            <div className="flex flex-wrap gap-4 pt-3 border-t border-border text-[0.8rem]">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                Total Eligible: <strong>{totalEligible}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Grid3X3 className="w-3.5 h-3.5 text-muted-foreground" />
                Allocated: <strong>{dateAllocations.length}</strong>
              </span>
              <span className="flex items-center gap-1">
                <DoorOpen className="w-3.5 h-3.5 text-muted-foreground" />
                Rooms Used: <strong>{new Set(dateAllocations.map(sa => sa.roomId)).size}</strong>
              </span>
              <span>
                {dateAllocations.length > 0 ? (
                  <Badge className="bg-green-100 text-green-700 text-[0.7rem]">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Allocated
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[0.7rem]">
                    <AlertCircle className="w-3 h-3 mr-1" /> Not Allocated
                  </Badge>
                )}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredAllocations.length > 0 && (
        <Tabs defaultValue="seating-plan">
          <TabsList>
            <TabsTrigger value="seating-plan" className="text-[0.8rem]">
              <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Seating Plan
            </TabsTrigger>
            <TabsTrigger value="master-summary" className="text-[0.8rem]">
              <TableIcon className="w-3.5 h-3.5 mr-1" /> Master Summary
            </TabsTrigger>
            <TabsTrigger value="rooms" className="text-[0.8rem]">
              <DoorOpen className="w-3.5 h-3.5 mr-1" /> Room Summary
            </TabsTrigger>
            <TabsTrigger value="students" className="text-[0.8rem]">
              <List className="w-3.5 h-3.5 mr-1" /> Student List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seating-plan" className="space-y-0 mt-4">
            <div className="rounded-t-lg border border-b-0 border-border bg-gradient-to-b from-primary/10 to-primary/5 px-6 py-4 text-center">
              <p className="text-[0.65rem] text-muted-foreground uppercase tracking-[0.15em] mb-1">Gautam Buddha University</p>
              <h2 className="font-bold text-[1.15rem] mb-1">{selectedExam ? selectedExam.name : "Master Seating Plan"}</h2>
              <p className="text-[0.75rem] text-muted-foreground">
                {selectedDate && new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {examsOnDate.map((exam, i) => (
                  <span key={exam.id} className={`text-[0.7rem] px-3 py-1 rounded-full border font-mono font-bold ${PROGRAMME_COLOURS[i % PROGRAMME_COLOURS.length]}`}>
                    {exam.courseCode || exam.course_code} · {exam.shift?.includes("Morning") ? "☀️" : "🌙"}
                  </span>
                ))}
              </div>
            </div>
            <div className="border border-border rounded-b-lg bg-background p-4 space-y-6">
              {allocatedRooms.map(({ room, allocations }) => (
                <RoomSeatingGrid
                  key={room.id}
                  room={room}
                  allocations={allocations}
                  students={students}
                  exam={selectedExam || examsOnDate[0]}
                  exams={exams}
                  invigilators={invigilationAllocations.filter(ia =>
                    ia.roomId === room.id && examsOnDate.some(e => e.id === ia.examId)
                  )}
                  faculty={faculty}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="master-summary" className="mt-4">
            <div className="rounded-t-lg border border-b-0 border-border bg-gradient-to-b from-primary/10 to-primary/5 px-6 py-4 text-center">
              <p className="text-[0.65rem] text-muted-foreground uppercase tracking-[0.15em] mb-1">Gautam Buddha University</p>
              <h2 className="font-bold text-[1.15rem] mb-1">Master Seating Plan</h2>
              <p className="text-[0.75rem] text-muted-foreground">{selectedDate}</p>
            </div>
            <div className="border border-border rounded-b-lg bg-background p-4">
              <MasterSummaryTable exam={selectedExam || examsOnDate[0]} allocatedRooms={allocatedRooms} students={students} rooms={rooms} />
            </div>
          </TabsContent>

          <TabsContent value="rooms">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {allocatedRooms.map(({ room, studentCount }) => (
                <Card key={room.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedRoomId(room.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[0.9rem]">Room {room.roomNumber}</h3>
                      <Badge variant="secondary" className="text-[0.7rem]">{room.building}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[0.8rem]">
                      <span className="text-muted-foreground">Students</span>
                      <span>{studentCount} / {room.capacity}</span>
                    </div>
                    <div className="mt-2 w-full bg-accent rounded-full h-2">
                      <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${Math.min(studentCount / room.capacity * 100, 100)}%` }} />
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground mt-1 text-right">{Math.round(studentCount / room.capacity * 100)}% utilized</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="students">
            <Card className="mt-4">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <label className="text-[0.8rem] text-muted-foreground">Filter by Room:</label>
                  <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                    <SelectTrigger className="w-[200px] h-8 text-[0.8rem]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rooms</SelectItem>
                      {allocatedRooms.map(({ room }) => (
                        <SelectItem key={room.id} value={room.id}>Room {room.roomNumber} ({room.building})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[0.75rem]">Seat #</TableHead>
                        <TableHead className="text-[0.75rem]">Roll Number</TableHead>
                        <TableHead className="text-[0.75rem]">Name</TableHead>
                        <TableHead className="text-[0.75rem]">Branch</TableHead>
                        <TableHead className="text-[0.75rem]">Room</TableHead>
                        <TableHead className="text-[0.75rem]">Exam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roomAllocations.map((sa) => {
                        const student = students.find(s => s.id === sa.studentId);
                        const room    = rooms.find(r => r.id === sa.roomId);
                        const exam    = exams.find(e => e.id === sa.examId);
                        if (!student || !room) return null;
                        return (
                          <TableRow key={sa.id}>
                            <TableCell className="text-[0.8rem] font-mono">{sa.seatNumber}</TableCell>
                            <TableCell className="text-[0.8rem] font-mono">{student.rollNumber}</TableCell>
                            <TableCell className="text-[0.8rem]">{student.name}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-[0.7rem]">{student.branch}</Badge></TableCell>
                            <TableCell className="text-[0.8rem]">{room.roomNumber}</TableCell>
                            <TableCell className="text-[0.7rem] font-mono text-muted-foreground">{exam?.courseCode || exam?.course_code}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default SeatingAllocation;
