import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Printer, BookOpen } from "lucide-react";

// Branch display names
const BRANCH_LABELS = {
  CSE:     "B.Tech CSE",
  AI:      "B.Tech CSE-AI",
  DS:      "B.Tech CSE-DS",
  CYB:     "B.Tech CSE-Cyber Security",
  ML:      "B.Tech CSE-ML",
  ICS:     "Integrated B.Tech-M.Tech CSE",
  BIT:     "B.Tech IT",
  BCA:     "BCA",
  ECE:     "B.Tech ECE",
  "EC-AIML": "B.Tech ECE-AIML",
};

const SEM_ROMAN = { 1:"I",2:"II",3:"III",4:"IV",5:"V",6:"VI",7:"VII",8:"VIII" };

export function Summary() {
  const { exams, students, seatingAllocations, attendanceRecords } = useStore();

  const [selectedDate,  setSelectedDate]  = useState("");
  const [selectedShift, setSelectedShift] = useState("");

  // Unique dates
  const examDates = useMemo(() => [...new Set(
    exams.filter(e => e.status === "scheduled" || e.status === "ongoing").map(e => e.date)
  )].sort(), [exams]);

  // Shifts on selected date
  const shiftsOnDate = useMemo(() => {
    if (!selectedDate) return [];
    return [...new Set(
      exams.filter(e => e.date === selectedDate).map(e => e.shift || "Shift 1 (Morning)")
    )].sort();
  }, [exams, selectedDate]);

  // Exams on selected date+shift
  const examsOnShift = useMemo(() =>
    exams.filter(e => e.date === selectedDate && (e.shift || "Shift 1 (Morning)") === selectedShift),
    [exams, selectedDate, selectedShift]
  );

  // Build summary rows: one row per branch per exam
  const summaryRows = useMemo(() => {
    if (examsOnShift.length === 0) return [];

    const rows = [];

    examsOnShift.forEach(exam => {
      const examBranches = exam.branches || [];

      examBranches.forEach(branch => {
        // Students of this branch enrolled in this exam (same semester + batch if set)
        const enrolledStudents = students.filter(s =>
          s.branch === branch &&
          s.semester === exam.semester &&
          (!exam.batch || s.batch === exam.batch)
        );
        const total = enrolledStudents.length;
        if (total === 0) return;

        const enrolledIds = new Set(enrolledStudents.map(s => String(s.id)));

        // Find rooms where this branch's students are seated for this exam
        const roomIds = [...new Set(
          seatingAllocations
            .filter(sa => String(sa.examId) === String(exam.id) && enrolledIds.has(String(sa.studentId)))
            .map(sa => String(sa.roomId))
        )];

        // Count attendance from those rooms
        let presentCount = 0;
        let absentCount  = 0;
        const absentStudents = [];

        enrolledStudents.forEach(student => {
          const sid = String(student.id);
          // Find attendance record for this student in any of the rooms for this exam
          const record = attendanceRecords.find(ar =>
            String(ar.examId) === String(exam.id) &&
            String(ar.studentId) === sid &&
            roomIds.includes(String(ar.roomId))
          );

          if (record) {
            if (record.status === "present") {
              presentCount++;
            } else if (record.status === "absent") {
              absentCount++;
              absentStudents.push(student.roll_number || student.rollNumber);
            }
            // not-marked: don't count in present or absent
          }
        });

        rows.push({
          branch,
          branchLabel: BRANCH_LABELS[branch] || branch,
          semester: exam.semester,
          year: enrolledStudents[0]?.year || "",
          courseCode: exam.courseCode || exam.course_code || "",
          courseName: exam.subject || "",
          present: presentCount,
          absent: absentCount,
          total,
          absentRolls: absentStudents.sort(),
        });
      });
    });

    // Sort by branch then semester
    return rows.sort((a, b) => a.branch.localeCompare(b.branch) || a.semester - b.semester);
  }, [examsOnShift, students, seatingAllocations, attendanceRecords]);

  const handlePrint = () => {
    if (summaryRows.length === 0) return;

    const dateStr = selectedDate
      ? new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : "";

    const tableRows = summaryRows.map((row, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'};">
        <td style="border:1px solid #ccc;padding:5px 8px;">${row.branchLabel}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;text-align:center;">Sem ${row.semester} (${SEM_ROMAN[row.semester] || row.semester})</td>
        <td style="border:1px solid #ccc;padding:5px 8px;text-align:center;">${row.year}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-family:monospace;">${row.courseCode}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;">${row.courseName}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;text-align:center;color:#166534;font-weight:600;">${row.present}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;text-align:center;color:#991b1b;font-weight:600;">${row.absent}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;text-align:center;font-weight:600;">${row.total}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-family:monospace;font-size:10px;">${row.absentRolls.join(', ') || '-'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance Summary - ${selectedDate} ${selectedShift}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 16px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
    .header h1 { font-size: 16px; font-weight: bold; }
    .header h2 { font-size: 13px; margin-top: 3px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { border: 1px solid #999; padding: 6px 8px; background: #f0f0f0; text-align: left; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Gautam Buddha University</h1>
    <h2>Attendance Summary Report</h2>
  </div>
  <div class="meta">
    <span><strong>Date:</strong> ${dateStr}</span>
    <span><strong>Shift:</strong> ${selectedShift}</span>
    <span><strong>Total Exams:</strong> ${examsOnShift.length}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Branch</th><th>Semester</th><th>Year</th>
        <th>Course Code</th><th>Course Name</th>
        <th>Present</th><th>Absent</th><th>Total</th>
        <th>Absent Roll Numbers</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=800');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Summary</h1>
        {summaryRows.length > 0 && (
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> Print Summary
          </Button>
        )}
      </div>

      {/* Date + Shift selector */}
      <Card>
        <CardContent className="py-4 px-4 space-y-3">
          <div>
            <label className="text-[0.8rem] text-muted-foreground mb-1 block">Select Exam Date</label>
            <Select value={selectedDate} onValueChange={v => { setSelectedDate(v); setSelectedShift(""); }}>
              <SelectTrigger className="text-[0.85rem]"><SelectValue placeholder="Choose a date..." /></SelectTrigger>
              <SelectContent>
                {examDates.map(date => {
                  const count = exams.filter(e => e.date === date).length;
                  return (
                    <SelectItem key={date} value={date}>
                      {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      <span className="ml-2 text-muted-foreground text-[0.75rem]">- {count} exam{count !== 1 ? "s" : ""}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedDate && shiftsOnDate.length > 0 && (
            <div>
              <label className="text-[0.8rem] text-muted-foreground mb-1.5 block">Select Shift</label>
              <div className="flex flex-wrap gap-2">
                {shiftsOnDate.map(shift => {
                  const isMorning = shift.includes("Morning") || shift.includes("1");
                  const isSelected = selectedShift === shift;
                  const count = exams.filter(e => e.date === selectedDate && (e.shift || "Shift 1 (Morning)") === shift).length;
                  return (
                    <button key={shift} onClick={() => setSelectedShift(shift)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[0.82rem] font-medium transition-colors ${
                        isSelected
                          ? isMorning ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-indigo-100 border-indigo-400 text-indigo-800"
                          : "bg-background border-border hover:bg-accent text-foreground"
                      }`}>
                      <span className="text-base">{isMorning ? "☀" : "🌙"}</span>
                      <span>{shift}</span>
                      <span className={`text-[0.7rem] px-2 py-0.5 rounded-full font-semibold ${
                        isSelected ? (isMorning ? "bg-amber-200 text-amber-900" : "bg-indigo-200 text-indigo-900") : "bg-muted text-muted-foreground"
                      }`}>{count} exam{count !== 1 ? "s" : ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary table */}
      {selectedDate && selectedShift && (
        summaryRows.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[0.75rem]">Branch</TableHead>
                      <TableHead className="text-[0.75rem]">Semester</TableHead>
                      <TableHead className="text-[0.75rem]">Year</TableHead>
                      <TableHead className="text-[0.75rem]">Course Code</TableHead>
                      <TableHead className="text-[0.75rem]">Course Name</TableHead>
                      <TableHead className="text-[0.75rem] text-green-700">Present</TableHead>
                      <TableHead className="text-[0.75rem] text-red-700">Absent</TableHead>
                      <TableHead className="text-[0.75rem]">Total</TableHead>
                      <TableHead className="text-[0.75rem]">Absent Roll Numbers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryRows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-[0.78rem] font-medium">{row.branchLabel}</TableCell>
                        <TableCell className="text-[0.78rem]">
                          Sem {row.semester} ({SEM_ROMAN[row.semester] || row.semester})
                        </TableCell>
                        <TableCell className="text-[0.78rem]">{row.year}</TableCell>
                        <TableCell className="text-[0.78rem] font-mono font-semibold">{row.courseCode}</TableCell>
                        <TableCell className="text-[0.78rem]">{row.courseName}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 text-[0.72rem] font-bold">{row.present}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-700 text-[0.72rem] font-bold">{row.absent}</Badge>
                        </TableCell>
                        <TableCell className="text-[0.78rem] font-semibold">{row.total}</TableCell>
                        <TableCell className="text-[0.72rem] font-mono text-muted-foreground max-w-[200px]">
                          {row.absentRolls.length > 0
                            ? row.absentRolls.join(", ")
                            : <span className="text-green-600">None</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-[0.85rem]">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              No attendance data found for this date and shift.
              <p className="text-[0.75rem] mt-1">Generate attendance sheets first in Attendance Management.</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

export default Summary;
