import { useState, useMemo, useCallback } from "react";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ClipboardList, CheckCircle2, XCircle, Minus, Users, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function AttendanceManagement() {
  const { students, rooms, exams, seatingAllocations, attendanceRecords,
    setAttendanceRecords, invigilationAllocations, faculty, refreshAttendance } = useStore();

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  const examRooms = useMemo(() => {
    const roomIds = [...new Set(seatingAllocations.filter(sa => sa.examId === selectedExamId).map(sa => sa.roomId))];
    return roomIds.map(rid => rooms.find(r => r.id === rid)).filter(Boolean);
  }, [seatingAllocations, selectedExamId, rooms]);

  const roomAttendance = useMemo(() => {
    if (!selectedExamId || !selectedRoomId) return [];
    return attendanceRecords.filter(ar => ar.examId === selectedExamId && ar.roomId === selectedRoomId);
  }, [selectedExamId, selectedRoomId, attendanceRecords]);

  const roomInvigilator = useMemo(() => {
    const ia = invigilationAllocations.find(a => a.examId === selectedExamId && a.roomId === selectedRoomId);
    return ia ? faculty.find(f => f.id === ia.facultyId) : null;
  }, [invigilationAllocations, selectedExamId, selectedRoomId, faculty]);

  const handleGenerateSheet = useCallback(async () => {
    if (!selectedExamId || !selectedRoomId) return;
    setGenerating(true);
    try {
      await api.attendance.generate(selectedExamId, selectedRoomId);
      await refreshAttendance();
      toast.success("Attendance sheet generated");
    } catch (err) {
      toast.error(err.message || "Failed to generate sheet");
    } finally {
      setGenerating(false);
    }
  }, [selectedExamId, selectedRoomId, refreshAttendance]);

  const markAttendance = useCallback(async (recordId, studentId, status) => {
    // Optimistic update
    setAttendanceRecords(prev => prev.map(ar =>
      ar.id === recordId ? { ...ar, status, signature: status === 'present' } : ar
    ));
    setMarkingId(recordId);
    try {
      await api.attendance.update(recordId, { status, signature: status === 'present' });
    } catch (err) {
      // Revert on failure
      await refreshAttendance();
      toast.error(err.message || "Failed to mark attendance");
    } finally {
      setMarkingId(null);
    }
  }, [setAttendanceRecords, refreshAttendance]);

  const markAllPresent = useCallback(async () => {
    if (!selectedExamId || !selectedRoomId) return;
    setMarkingAll(true);
    try {
      await api.attendance.markAllPresent(selectedExamId, selectedRoomId);
      await refreshAttendance();
      toast.success("All students marked present");
    } catch (err) {
      toast.error(err.message || "Failed to mark all present");
    } finally {
      setMarkingAll(false);
    }
  }, [selectedExamId, selectedRoomId, refreshAttendance]);

  const presentCount   = roomAttendance.filter(r => r.status === "present").length;
  const absentCount    = roomAttendance.filter(r => r.status === "absent").length;
  const notMarkedCount = roomAttendance.filter(r => r.status === "not-marked").length;
  const hasSheet       = roomAttendance.length > 0;

  return (
    <div className="space-y-4">
      <div><h1>Attendance Management</h1></div>

      {/* Selectors */}
      <Card>
        <CardContent className="py-4 px-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-[0.8rem] text-muted-foreground mb-1 block">Select Exam</label>
              <Select value={selectedExamId} onValueChange={v => { setSelectedExamId(v); setSelectedRoomId(""); }}>
                <SelectTrigger className="text-[0.85rem]"><SelectValue placeholder="Choose an exam..." /></SelectTrigger>
                <SelectContent>
                  {exams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.subject} — {exam.name} ({exam.date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-[0.8rem] text-muted-foreground mb-1 block">Select Room</label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId} disabled={examRooms.length === 0}>
                <SelectTrigger className="text-[0.85rem]">
                  <SelectValue placeholder={examRooms.length === 0 ? "Allocate seating first" : "Choose a room..."} />
                </SelectTrigger>
                <SelectContent>
                  {examRooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>Room {room.roomNumber} ({room.building})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate sheet prompt */}
      {selectedExamId && selectedRoomId && !hasSheet && (
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

      {/* Attendance sheet */}
      {hasSheet && (
        <Card>
          <CardHeader className="py-3 px-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-[0.9rem]">
                  Attendance Sheet — Room {rooms.find(r => r.id === selectedRoomId)?.roomNumber}
                </CardTitle>
                <div className="flex flex-wrap gap-3 mt-1 text-[0.75rem] text-muted-foreground">
                  {selectedExam && <>
                    <span>{selectedExam.subject}</span>
                    <span>•</span><span>{selectedExam.date}</span>
                    <span>•</span><span>{selectedExam.startTime} - {selectedExam.endTime}</span>
                  </>}
                  {roomInvigilator && <><span>•</span><span>Invigilator: {roomInvigilator.name}</span></>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleGenerateSheet} disabled={generating}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${generating ? 'animate-spin' : ''}`} /> Regenerate
                </Button>
                <Button size="sm" variant="outline" onClick={markAllPresent} disabled={markingAll}>
                  {markingAll ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                  Mark All Present
                </Button>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-[0.8rem]">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" />Present: {presentCount}</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" />Absent: {absentCount}</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-300" />Not Marked: {notMarkedCount}</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Total: {roomAttendance.length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["#","Roll Number","Name","Branch","Status","Signature","Actions"].map(h =>
                      <TableHead key={h} className="text-[0.75rem]">{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomAttendance.map((record, idx) => {
                    const student = students.find(s => s.id === record.studentId);
                    if (!student) return null;
                    const isMarking = markingId === record.id;
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="text-[0.8rem] font-mono">{idx + 1}</TableCell>
                        <TableCell className="text-[0.8rem] font-mono">{student.rollNumber}</TableCell>
                        <TableCell className="text-[0.8rem]">{student.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[0.7rem]">{student.branch}</Badge></TableCell>
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
                            ? <span className="text-green-600 italic text-[0.75rem]">Signed</span>
                            : <span className="text-muted-foreground text-[0.75rem]">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" disabled={isMarking}
                              variant={record.status === "present" ? "default" : "outline"}
                              className="h-6 px-2 text-[0.7rem]"
                              onClick={() => markAttendance(record.id, record.studentId, "present")}>
                              {isMarking ? <Loader2 className="w-3 h-3 animate-spin" /> : "P"}
                            </Button>
                            <Button size="sm" disabled={isMarking}
                              variant={record.status === "absent" ? "destructive" : "outline"}
                              className="h-6 px-2 text-[0.7rem]"
                              onClick={() => markAttendance(record.id, record.studentId, "absent")}>A</Button>
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

      {selectedExamId && examRooms.length === 0 && (
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
