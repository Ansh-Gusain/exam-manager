import { useState, useMemo, useCallback, useEffect } from "react";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ClipboardList, CheckCircle2, XCircle, Minus, Users, Loader2, RefreshCw, Printer } from "lucide-react";
import { toast } from "sonner";

export function AttendanceManagement() {
  const { students, rooms, exams, seatingAllocations, attendanceRecords,
    setAttendanceRecords, invigilationAllocations, faculty, refreshAttendance } = useStore();

  const [selectedDate,   setSelectedDate]   = useState("");
  const [selectedShift,  setSelectedShift]  = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [filterCourseCode, setFilterCourseCode] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  // Unique exam dates
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
  const examsOnDateShift = useMemo(() =>
    exams.filter(e => e.date === selectedDate && (e.shift || "Shift 1 (Morning)") === selectedShift),
    [exams, selectedDate, selectedShift]
  );

  // Rooms that have seating for any exam on this date+shift
  const examRooms = useMemo(() => {
    const examIds = new Set(examsOnDateShift.map(e => e.id));
    const roomIds = [...new Set(
      seatingAllocations.filter(sa => examIds.has(sa.examId)).map(sa => sa.roomId)
    )];
    return roomIds.map(rid => rooms.find(r => r.id === rid)).filter(Boolean)
      .sort((a,b) => (a.roomNumber||"").localeCompare(b.roomNumber||""));
  }, [seatingAllocations, examsOnDateShift, rooms]);

  // Primary exam for selected room (first exam with students in this room)
  const primaryExamForRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    const examIds = new Set(examsOnDateShift.map(e => e.id));
    const sa = seatingAllocations.find(sa => sa.roomId === selectedRoomId && examIds.has(sa.examId));
    return sa ? exams.find(e => e.id === sa.examId) : null;
  }, [selectedRoomId, examsOnDateShift, seatingAllocations, exams]);

  const roomAttendance = useMemo(() => {
    if (!selectedRoomId || examsOnDateShift.length === 0) return [];
    const examIds = new Set(examsOnDateShift.map(e => String(e.id)));
    return attendanceRecords
      .filter(ar => examIds.has(String(ar.examId)) && String(ar.roomId) === String(selectedRoomId))
      .sort((a, b) => {
        // Sort by course code then roll number
        const sa = students.find(s => String(s.id) === String(a.studentId));
        const sb = students.find(s => String(s.id) === String(b.studentId));
        return (sa?.roll_number || sa?.rollNumber || "").localeCompare(sb?.roll_number || sb?.rollNumber || "");
      });
  }, [selectedRoomId, examsOnDateShift, attendanceRecords, students]);

  const examsInRoom = useMemo(() => {
    if (!selectedRoomId) return [];
    const shiftExamIds = new Set(examsOnDateShift.map(e => String(e.id)));
    // Find all exams that have seating allocations in this room on this shift
    const roomExamIds = new Set(
      seatingAllocations
        .filter(sa => String(sa.roomId) === String(selectedRoomId) && shiftExamIds.has(String(sa.examId)))
        .map(sa => String(sa.examId))
    );
    return exams.filter(e => roomExamIds.has(String(e.id)));
  }, [selectedRoomId, examsOnDateShift, seatingAllocations, exams]);

  // Auto-select first course when examsInRoom changes
  useEffect(() => {
    if (examsInRoom.length > 0) {
      const firstCode = examsInRoom[0]?.courseCode || examsInRoom[0]?.course_code;
      if (firstCode) setFilterCourseCode(firstCode);
    }
  }, [examsInRoom]);

  // Fix: ensure string comparison for IDs — always filter by a specific course
  const filteredAttendance = useMemo(() => {
    const targetExam = examsInRoom.find(e => (e.courseCode || e.course_code) === filterCourseCode);
    if (!targetExam) return roomAttendance; // fallback: show all if no match
    const studentIds = new Set(
      seatingAllocations
        .filter(sa => String(sa.examId) === String(targetExam.id) && String(sa.roomId) === String(selectedRoomId))
        .map(sa => String(sa.studentId))
    );
    return roomAttendance.filter(ar => studentIds.has(String(ar.studentId)));
  }, [roomAttendance, filterCourseCode, examsInRoom, seatingAllocations, selectedRoomId]);

  // Exactly 2 invigilators per room — auto-syncs when room/shift changes
  const roomInvigilators = useMemo(() => {
    if (!selectedRoomId) return [];
    const shiftExamIds = new Set(examsOnDateShift.map(e => String(e.id)));
    const seen = new Set();
    return invigilationAllocations
      .filter(a => String(a.roomId) === String(selectedRoomId) && shiftExamIds.has(String(a.examId)))
      .filter(a => {
        const key = String(a.facultyId);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 2) // strictly 2 max
      .map(a => {
        const f = faculty.find(f => String(f.id) === String(a.facultyId));
        return f ? { ...f, role: a.role } : null;
      })
      .filter(Boolean);
  }, [invigilationAllocations, selectedRoomId, examsOnDateShift, faculty]);

  // Auto-generate when room is selected or course changes and no sheet exists
  const autoGenerate = useCallback(async (roomId, examId) => {
    if (!roomId || !examId) return;
    setGenerating(true);
    try {
      await api.attendance.generate(examId, roomId);
      await refreshAttendance();
    } catch (err) {
      // Only show error if it's not a "already exists" type error
      if (err.message && !err.message.includes('already')) {
        toast.error("Failed to generate attendance sheet: " + err.message);
      }
    } finally {
      setGenerating(false);
    }
  }, [refreshAttendance]);

  const handleGenerateSheet = useCallback(async () => {
    if (!selectedRoomId || !primaryExamForRoom) return;
    setGenerating(true);
    try {
      await api.attendance.generate(primaryExamForRoom.id, selectedRoomId);
      await refreshAttendance();
      toast.success("Attendance sheet generated");
    } catch (err) {
      toast.error(err.message || "Failed to generate sheet");
    } finally {
      setGenerating(false);
    }
  }, [selectedRoomId, primaryExamForRoom, refreshAttendance]);

  // Auto-generate sheet when room is selected and auto-select first course
  const handleRoomSelect = useCallback(async (roomId) => {
    setSelectedRoomId(roomId);
    setFilterCourseCode("all"); // always reset course filter when room changes
    if (roomId && primaryExamForRoom) {
      const examIds = new Set(examsOnDateShift.map(e => String(e.id)));
      const existing = attendanceRecords.some(ar =>
        examIds.has(String(ar.examId)) && String(ar.roomId) === String(roomId)
      );
      if (!existing) {
        await autoGenerate(roomId, primaryExamForRoom.id);
      }
    }
  }, [primaryExamForRoom, examsOnDateShift, attendanceRecords, autoGenerate]);

  const handleCourseChange = useCallback(async (code) => {
    setFilterCourseCode(code);
    if (selectedRoomId) {
      const targetExam = examsInRoom.find(e => (e.courseCode || e.course_code) === code);
      if (targetExam) {
        const hasRecords = attendanceRecords.some(ar =>
          String(ar.examId) === String(targetExam.id) && String(ar.roomId) === String(selectedRoomId)
        );
        if (!hasRecords) {
          await autoGenerate(selectedRoomId, targetExam.id);
        }
      }
    }
  }, [selectedRoomId, examsInRoom, attendanceRecords, autoGenerate]);

  const markAttendance = useCallback(async (recordId, currentStatus, clickedStatus) => {
    // Toggle logic: clicking same status → revert to not-marked, clicking different → set new status
    const newStatus = currentStatus === clickedStatus ? "not-marked" : clickedStatus;
    const newSignature = newStatus === "present";

    // Optimistic update — only update the specific record, no full re-render
    setAttendanceRecords(prev => prev.map(ar =>
      ar.id === recordId ? { ...ar, status: newStatus, signature: newSignature } : ar
    ));
    setMarkingId(recordId);
    try {
      await api.attendance.update(recordId, { status: newStatus, signature: newSignature });
    } catch (err) {
      // Revert only this record on failure
      setAttendanceRecords(prev => prev.map(ar =>
        ar.id === recordId ? { ...ar, status: currentStatus, signature: currentStatus === "present" } : ar
      ));
      toast.error(err.message || "Failed to mark attendance");
    } finally {
      setMarkingId(null);
    }
  }, [setAttendanceRecords]);

  const markAllPresent = useCallback(async () => {
    if (!selectedRoomId || !primaryExamForRoom) return;
    setMarkingAll(true);
    try {
      await api.attendance.markAllPresent(primaryExamForRoom.id, selectedRoomId);
      await refreshAttendance();
      toast.success("All students marked present with signature");
    } catch (err) {
      toast.error(err.message || "Failed to mark all present");
    } finally {
      setMarkingAll(false);
    }
  }, [selectedRoomId, primaryExamForRoom, refreshAttendance]);

  // Print attendance sheet as PDF
  const handlePrint = useCallback(() => {
    const room = rooms.find(r => r.id === selectedRoomId);
    if (!room || filteredAttendance.length === 0) return;

    // Group by course for separate sections
    const courseGroups = {};
    filteredAttendance.forEach(record => {
      const student = students.find(s => s.id === record.studentId);
      if (!student) return;
      const studentExam = examsInRoom.find(e =>
        seatingAllocations.some(sa => sa.examId === e.id && sa.studentId === record.studentId && sa.roomId === selectedRoomId)
      );
      const code = studentExam?.courseCode || studentExam?.course_code || "Unknown";
      if (!courseGroups[code]) courseGroups[code] = { exam: studentExam, records: [] };
      courseGroups[code].records.push({ record, student });
    });

    const invigilatorNames = roomInvigilators.map(f => `${f.name} (${f.department || ''})`).join(', ') || 'Not assigned';

    let sectionsHtml = '';
    Object.entries(courseGroups).forEach(([code, { exam, records }]) => {
      const rows = records.map((item, idx) => {
        const { record, student } = item;
        const statusText = record.status === 'present' ? 'Present' : record.status === 'absent' ? 'Absent' : '-';
        const sigText = record.signature ? 'Signed' : '';
        return `<tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="font-family:monospace;">${student.roll_number || student.rollNumber}</td>
          <td>${student.name}</td>
          <td style="text-align:center;">${student.branch}</td>
          <td style="text-align:center;font-weight:600;color:${record.status === 'present' ? '#166534' : record.status === 'absent' ? '#991b1b' : '#666'};">${statusText}</td>
          <td style="text-align:center;">${sigText}</td>
          <td></td>
        </tr>`;
      }).join('');

      const present = records.filter(r => r.record.status === 'present').length;
      const absent  = records.filter(r => r.record.status === 'absent').length;

      sectionsHtml += `
        <div class="section">
          <div class="section-header">
            <table>
              <tr>
                <td><strong>Course Code:</strong> ${code}</td>
                <td><strong>Course Name:</strong> ${exam?.subject || ''}</td>
              </tr>
              <tr>
                <td><strong>Exam:</strong> ${exam?.name || ''}</td>
                <td><strong>Date:</strong> ${exam?.date || ''} &nbsp; <strong>Time:</strong> ${exam?.startTime || exam?.start_time || ''} - ${exam?.endTime || exam?.end_time || ''}</td>
              </tr>
            </table>
          </div>
          <table class="sheet">
            <thead>
              <tr>
                <th style="width:35px;">#</th>
                <th>Roll Number</th>
                <th>Name</th>
                <th style="width:55px;">Branch</th>
                <th style="width:65px;">Status</th>
                <th style="width:55px;">Signed</th>
                <th style="width:75px;">Sign Here</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="text-align:right;">Summary:</td>
                <td colspan="3">Total: ${records.length} | Present: ${present} | Absent: ${absent}</td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance Sheet - Room ${room.roomNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 16px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
    .header h1 { font-size: 16px; font-weight: bold; }
    .header h2 { font-size: 13px; font-weight: normal; margin-top: 3px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    .section { margin-bottom: 20px; }
    .section-header { margin-bottom: 6px; }
    .section-header table { width: 100%; border-collapse: collapse; }
    .section-header td { padding: 2px 0; font-size: 11px; }
    table.sheet { width: 100%; border-collapse: collapse; font-size: 11px; }
    table.sheet th { border: 1px solid #999; padding: 5px 6px; background: #f0f0f0; text-align: left; }
    table.sheet td { border: 1px solid #ccc; padding: 4px 6px; }
    table.sheet tfoot td { background: #f5f5f5; font-weight: bold; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 10px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Gautam Buddha University</h1>
    <h2>Attendance Sheet</h2>
  </div>
  <div class="meta">
    <span><strong>Room:</strong> ${room.roomNumber} (${room.building})</span>
    <span><strong>Shift:</strong> ${selectedShift}</span>
    <span><strong>Invigilator(s):</strong> ${invigilatorNames}</span>
  </div>
  ${sectionsHtml}
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=800');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  }, [filteredAttendance, rooms, selectedRoomId, examsInRoom, seatingAllocations, students, selectedExam, roomInvigilators]);

  const presentCount   = filteredAttendance.filter(r => r.status === "present").length;
  const absentCount    = filteredAttendance.filter(r => r.status === "absent").length;
  const notMarkedCount = filteredAttendance.filter(r => r.status === "not-marked").length;
  const hasSheet       = roomAttendance.length > 0;
  const selectedRoom   = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="space-y-4">
      <div><h1>Attendance Management</h1></div>

      {/* Selectors: Date → Shift → Room */}
      <Card>
        <CardContent className="py-4 px-4 space-y-3">
          {/* Row 1: Date */}
          <div>
            <label className="text-[0.8rem] text-muted-foreground mb-1 block">Select Exam Date</label>
            <Select value={selectedDate} onValueChange={v => { setSelectedDate(v); setSelectedShift(""); setSelectedRoomId(""); setFilterCourseCode("all"); }}>
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

          {/* Row 2: Shift buttons */}
          {selectedDate && shiftsOnDate.length > 0 && (
            <div>
              <label className="text-[0.8rem] text-muted-foreground mb-1.5 block">Select Shift</label>
              <div className="flex flex-wrap gap-2">
                {shiftsOnDate.map(shift => {
                  const isMorning = shift.includes("Morning") || shift.includes("1");
                  const isSelected = selectedShift === shift;
                  const count = exams.filter(e => e.date === selectedDate && (e.shift || "Shift 1 (Morning)") === shift).length;
                  return (
                    <button
                      key={shift}
                      onClick={() => { setSelectedShift(shift); setSelectedRoomId(""); setFilterCourseCode("all"); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[0.82rem] font-medium transition-colors ${
                        isSelected
                          ? isMorning
                            ? "bg-amber-100 border-amber-400 text-amber-800"
                            : "bg-indigo-100 border-indigo-400 text-indigo-800"
                          : "bg-background border-border hover:bg-accent text-foreground"
                      }`}
                    >
                      <span className="text-base">{isMorning ? "☀" : "🌙"}</span>
                      <span>{shift}</span>
                      <span className={`text-[0.7rem] px-2 py-0.5 rounded-full font-semibold ${
                        isSelected
                          ? isMorning ? "bg-amber-200 text-amber-900" : "bg-indigo-200 text-indigo-900"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {count} exam{count !== 1 ? "s" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 3: Room */}
          {selectedDate && selectedShift && (
            <div>
              <label className="text-[0.8rem] text-muted-foreground mb-1 block">Select Room</label>
              <Select value={selectedRoomId} onValueChange={handleRoomSelect} disabled={examRooms.length === 0}>
                <SelectTrigger className="text-[0.85rem]">
                  <SelectValue placeholder={examRooms.length === 0 ? "No rooms found - allocate seating first" : "Choose a room..."} />
                </SelectTrigger>
                <SelectContent>
                  {examRooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.roomNumber} ({room.building})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate sheet prompt — only show if not auto-generating */}
      {selectedDate && selectedShift && selectedRoomId && !hasSheet && !generating && (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <ClipboardList className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-[0.85rem] text-muted-foreground">No attendance sheet yet for this room.</p>
            <Button onClick={handleGenerateSheet} disabled={generating}>
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : "Generate Attendance Sheet"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state while auto-generating */}
      {selectedDate && selectedShift && selectedRoomId && !hasSheet && generating && (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <p className="text-[0.85rem] text-muted-foreground">Generating attendance sheet...</p>
          </CardContent>
        </Card>
      )}

      {/* Attendance sheet */}
      {hasSheet && (
        <Card>
          <CardHeader className="py-3 px-4 border-b border-border">
            {/* Title + meta info */}
            <div className="mb-2">
              <CardTitle className="text-[0.9rem]">
                Attendance Sheet - Room {selectedRoom?.roomNumber}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-1 text-[0.75rem] text-muted-foreground">
                {primaryExamForRoom && (
                  <>
                    <span>{primaryExamForRoom.courseCode || primaryExamForRoom.course_code} - {primaryExamForRoom.subject}</span>
                    <span>|</span>
                    <span>{primaryExamForRoom.date}</span>
                    <span>|</span>
                    <span>{primaryExamForRoom.startTime || primaryExamForRoom.start_time} - {primaryExamForRoom.endTime || primaryExamForRoom.end_time}</span>
                    <span>|</span>
                    <span>{selectedShift}</span>
                  </>
                )}
                {roomInvigilators.length > 0 && (
                  <>
                    <span>|</span>
                    <span className="font-medium text-foreground">
                      {roomInvigilators.map(f => `${f.name} (${f.department || ''})`).join(' | ')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* All controls in ONE line */}
            <div className="flex flex-wrap items-center gap-2">
              {examsInRoom.length > 1 && (
                <Select value={filterCourseCode} onValueChange={handleCourseChange}>
                  <SelectTrigger className="h-8 text-[0.78rem] w-[160px]">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {examsInRoom.map(e => (
                      <SelectItem key={e.id} value={e.courseCode || e.course_code || e.subject}>
                        {e.courseCode || e.course_code} - {e.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button size="sm" variant="outline" onClick={handleGenerateSheet} disabled={generating}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${generating ? 'animate-spin' : ''}`} /> Regenerate
              </Button>
              <Button size="sm" variant="outline" onClick={markAllPresent} disabled={markingAll}>
                {markingAll ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                Mark All Present + Sign
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-2 text-[0.8rem]">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" />Present: {presentCount}</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" />Absent: {absentCount}</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-300" />Not Marked: {notMarkedCount}</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Total: {filteredAttendance.length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["#","Roll Number","Name","Branch","Course","Status","Signature","Actions"].map(h =>
                      <TableHead key={h} className="text-[0.75rem]">{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record, idx) => {
                    const student = students.find(s => s.id === record.studentId);
                    if (!student) return null;
                    const studentExam = examsInRoom.find(e =>
                      seatingAllocations.some(sa => sa.examId === e.id && sa.studentId === record.studentId && sa.roomId === selectedRoomId)
                    );
                    const isMarking = markingId === record.id;
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="text-[0.8rem] font-mono">{idx + 1}</TableCell>
                        <TableCell className="text-[0.8rem] font-mono">{student.roll_number || student.rollNumber}</TableCell>
                        <TableCell className="text-[0.8rem]">{student.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[0.7rem]">{student.branch}</Badge></TableCell>
                        <TableCell>
                          {studentExam && (
                            <span className="text-[0.7rem] font-mono text-muted-foreground">
                              {studentExam.courseCode || studentExam.course_code}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.status === "present"
                            ? <Badge className="bg-green-100 text-green-700 text-[0.7rem]"><CheckCircle2 className="w-3 h-3 mr-1" />Present</Badge>
                            : record.status === "absent"
                            ? <Badge className="bg-red-100 text-red-700 text-[0.7rem]"><XCircle className="w-3 h-3 mr-1" />Absent</Badge>
                            : <Badge variant="secondary" className="text-[0.7rem]"><Minus className="w-3 h-3 mr-1" />Not Marked</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-[0.8rem]">
                          {record.signature
                            ? <span className="text-green-600 text-[0.75rem] font-medium">Signed</span>
                            : <span className="text-muted-foreground text-[0.75rem]">-</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" disabled={isMarking}
                              variant={record.status === "present" ? "default" : "outline"}
                              className="h-6 px-2 text-[0.7rem]"
                              onClick={() => markAttendance(record.id, record.status, "present")}>
                              {isMarking ? <Loader2 className="w-3 h-3 animate-spin" /> : "P"}
                            </Button>
                            <Button size="sm" disabled={isMarking}
                              variant={record.status === "absent" ? "destructive" : "outline"}
                              className="h-6 px-2 text-[0.7rem]"
                              onClick={() => markAttendance(record.id, record.status, "absent")}>A</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDate && selectedShift && examRooms.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-[0.85rem]">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No seating allocations found for this exam. Please allocate seating first.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AttendanceManagement;
