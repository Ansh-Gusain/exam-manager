import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "./ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "./ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "./ui/table";
import { UserCheck, AlertCircle, CheckCircle2, Shield, User, Pencil } from "lucide-react";
import { toast } from "sonner";

export function InvigilatorAllocation() {
  const { rooms, exams, faculty, invigilationAllocations, seatingAllocations,
    refreshInvigilation, refreshFaculty } = useStore();

  const [selectedDate,  setSelectedDate]  = useState("");
  const [selectedShift, setSelectedShift] = useState("");

  // Edit dialog state
  const [editOpen,       setEditOpen]       = useState(false);
  const [editingRoom,    setEditingRoom]     = useState(null);
  const [newChiefId,     setNewChiefId]     = useState("");
  const [newAssistantId, setNewAssistantId] = useState("");

  // Unique dates from scheduled/ongoing exams
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
  const examsOnDate = useMemo(() =>
    exams.filter(e =>
      e.date === selectedDate &&
      (e.shift || "Shift 1 (Morning)") === selectedShift
    ), [exams, selectedDate, selectedShift]);

  // Invigilation allocations for selected date+shift
  const dateAllocations = useMemo(() => {
    const ids = new Set(examsOnDate.map(e => e.id));
    return invigilationAllocations.filter(ia => ids.has(ia.examId));
  }, [invigilationAllocations, examsOnDate]);

  // Group by room
  const roomsWithFaculty = useMemo(() => {
    const roomIds = [...new Set(dateAllocations.map(ia => ia.roomId))];
    return roomIds.map(roomId => {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return null;

      const roomAllocs = dateAllocations.filter(ia => ia.roomId === roomId);
      const chiefs     = roomAllocs.filter(ia => ia.role === "chief")
                                   .map(ia => ({ ...ia, fac: faculty.find(f => f.id === ia.facultyId) }));
      const assistants = roomAllocs.filter(ia => ia.role === "assistant")
                                   .map(ia => ({ ...ia, fac: faculty.find(f => f.id === ia.facultyId) }));

      const examsInRoom = examsOnDate.filter(exam =>
        seatingAllocations.some(sa => sa.roomId === roomId && sa.examId === exam.id)
      );

      return { room, chiefs, assistants, examsInRoom };
    }).filter(Boolean)
      .sort((a, b) => (a.room?.roomNumber || "").localeCompare(b.room?.roomNumber || ""));
  }, [dateAllocations, rooms, faculty, examsOnDate, seatingAllocations]);

  // Reset edit dialog on close
  const handleEditClose = (open) => {
    if (!open) { setEditingRoom(null); setNewChiefId(""); setNewAssistantId(""); }
    setEditOpen(open);
  };

  const handleEditSave = async () => {
    if (!editingRoom || !newChiefId || !newAssistantId) {
      toast.error("Please select both Chief and Assistant faculty");
      return;
    }
    if (newChiefId === newAssistantId) {
      toast.error("Chief and Assistant must be different faculty members");
      return;
    }
    try {
      await api.invigilation.updateRoom(editingRoom.roomId, editingRoom.examId, newChiefId, newAssistantId);
      await refreshInvigilation();
      await refreshFaculty();
      toast.success(`Faculty updated for Room ${editingRoom.roomNumber}`);
      setEditOpen(false);
      setEditingRoom(null);
    } catch (err) {
      toast.error(err.message || "Failed to update faculty");
    }
  };

  return (
    <div className="space-y-4">
      <div><h1>Invigilation Management</h1></div>

      {/* Date + Shift selector */}
      <Card>
        <CardContent className="py-4 px-4 space-y-4">
          {/* Date */}
          <div>
            <label className="text-[0.8rem] text-muted-foreground mb-1 block">Select Exam Date</label>
            <Select value={selectedDate} onValueChange={v => { setSelectedDate(v); setSelectedShift(""); }}>
              <SelectTrigger className="text-[0.85rem]">
                <SelectValue placeholder="Choose a date..." />
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

          {/* Shift buttons */}
          {selectedDate && shiftsOnDate.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-[0.75rem] text-muted-foreground mb-2 font-medium">Select Shift</p>
              <div className="flex flex-wrap gap-2">
                {shiftsOnDate.map(shift => {
                  const count = exams.filter(e =>
                    e.date === selectedDate && (e.shift || "Shift 1 (Morning)") === shift
                  ).length;
                  const isMorning = shift.includes("Morning") || shift.includes("1");
                  const isSelected = selectedShift === shift;
                  return (
                    <button
                      key={shift}
                      onClick={() => setSelectedShift(shift)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[0.8rem] font-medium transition-colors ${
                        isSelected
                          ? isMorning ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-indigo-100 border-indigo-400 text-indigo-800"
                          : "bg-background border-border hover:bg-accent"
                      }`}
                    >
                      <span>{isMorning ? "☀" : "🌙"}</span>
                      <span>{shift}</span>
                      <span className={`text-[0.7rem] px-1.5 py-0.5 rounded-full font-semibold ${
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

          {/* Exams in shift */}
          {selectedDate && selectedShift && examsOnDate.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-[0.72rem] text-muted-foreground mb-2 font-medium">Exams in this shift:</p>
              <div className="flex flex-wrap gap-2">
                {examsOnDate.map(exam => (
                  <span key={exam.id} className="text-[0.72rem] px-3 py-1.5 rounded-full border bg-background border-border">
                    <span className="font-mono font-bold">{exam.courseCode || exam.course_code || exam.subject}</span>
                    <span className="ml-1.5 opacity-70">Sem {exam.semester}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {selectedDate && selectedShift && (
            <div className="flex flex-wrap gap-4 pt-3 border-t border-border text-[0.8rem]">
              <span>Available Faculty: <strong>{faculty.filter(f => f.isAvailable).length}</strong></span>
              <span>Rooms Assigned: <strong>{roomsWithFaculty.length}</strong></span>
              <span>Invigilators Assigned: <strong>{dateAllocations.length}</strong></span>
              <span>
                {dateAllocations.length > 0 ? (
                  <Badge className="bg-green-100 text-green-700 text-[0.7rem]">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Assigned
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[0.7rem]">
                    <AlertCircle className="w-3 h-3 mr-1" /> Not Assigned
                  </Badge>
                )}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room assignments table */}
      {selectedDate && selectedShift && (
        roomsWithFaculty.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[0.75rem]">Room</TableHead>
                      <TableHead className="text-[0.75rem]">Building</TableHead>
                      <TableHead className="text-[0.75rem]">Exams in Room</TableHead>
                      <TableHead className="text-[0.75rem]">
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-primary" /> Chief Invigilator</span>
                      </TableHead>
                      <TableHead className="text-[0.75rem]">
                        <span className="flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" /> Assistant Invigilator</span>
                      </TableHead>
                      <TableHead className="text-[0.75rem]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomsWithFaculty.map(({ room, chiefs, assistants, examsInRoom }) => {
                      const primaryExamId = examsInRoom[0]?.id || chiefs[0]?.examId || assistants[0]?.examId;
                      return (
                        <TableRow key={room.id}>
                          <TableCell className="text-[0.8rem] font-mono font-semibold">{room.roomNumber}</TableCell>
                          <TableCell className="text-[0.8rem]">{room.building}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {examsInRoom.map(exam => (
                                <Badge key={exam.id} variant="secondary" className="text-[0.68rem] font-mono">
                                  {exam.courseCode || exam.course_code || exam.subject}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {chiefs.length > 0 ? chiefs.map((c, i) => (
                              <div key={i}>
                                <p className="text-[0.8rem] font-medium">{c.fac?.name || "—"}</p>
                                <p className="text-[0.7rem] text-muted-foreground">{c.fac?.phone} · {c.fac?.department}</p>
                              </div>
                            )) : <span className="text-[0.75rem] text-destructive">Not assigned</span>}
                          </TableCell>
                          <TableCell>
                            {assistants.length > 0 ? assistants.map((a, i) => (
                              <div key={i}>
                                <p className="text-[0.8rem] font-medium">{a.fac?.name || "—"}</p>
                                <p className="text-[0.7rem] text-muted-foreground">{a.fac?.phone} · {a.fac?.department}</p>
                              </div>
                            )) : <span className="text-[0.75rem] text-destructive">Not assigned</span>}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => {
                                setEditingRoom({
                                  roomId:     room.id,
                                  examId:     primaryExamId,
                                  roomNumber: room.roomNumber,
                                });
                                setNewChiefId(chiefs[0]?.facultyId || "");
                                setNewAssistantId(assistants[0]?.facultyId || "");
                                setEditOpen(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded border border-border hover:bg-accent text-[0.75rem] text-muted-foreground"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-[0.85rem]">
              <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              No invigilation assignments found for this date and shift.
              <p className="text-[0.75rem] mt-1">Faculty are assigned automatically when you run Auto Allocate in Seating Allocation.</p>
            </CardContent>
          </Card>
        )
      )}

      {/* Edit Faculty Dialog */}
      <Dialog open={editOpen} onOpenChange={handleEditClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Invigilators — Room {editingRoom?.roomNumber}</DialogTitle>
            <DialogDescription>
              Replace the Chief or Assistant invigilator for this room.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[0.8rem] font-semibold flex items-center gap-1 mb-1">
                <Shield className="w-3.5 h-3.5 text-primary" /> Chief Invigilator
              </label>
              <Select value={String(newChiefId)} onValueChange={setNewChiefId}>
                <SelectTrigger className="text-[0.85rem]"><SelectValue placeholder="Select chief..." /></SelectTrigger>
                <SelectContent>
                  {[...faculty].filter(f => f.isAvailable)
                    .sort((a, b) => (a.totalDuties || 0) - (b.totalDuties || 0))
                    .map(f => (
                      <SelectItem key={f.id} value={String(f.id)} disabled={String(f.id) === String(newAssistantId)}>
                        <span className="font-medium">{f.name}</span>
                        <span className="ml-2 text-muted-foreground text-[0.75rem]">{f.phone} · {f.department} · {f.totalDuties || 0} duties</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[0.8rem] font-semibold flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-muted-foreground" /> Assistant Invigilator
              </label>
              <Select value={String(newAssistantId)} onValueChange={setNewAssistantId}>
                <SelectTrigger className="text-[0.85rem]"><SelectValue placeholder="Select assistant..." /></SelectTrigger>
                <SelectContent>
                  {[...faculty].filter(f => f.isAvailable)
                    .sort((a, b) => (a.totalDuties || 0) - (b.totalDuties || 0))
                    .map(f => (
                      <SelectItem key={f.id} value={String(f.id)} disabled={String(f.id) === String(newChiefId)}>
                        <span className="font-medium">{f.name}</span>
                        <span className="ml-2 text-muted-foreground text-[0.75rem]">{f.phone} · {f.department} · {f.totalDuties || 0} duties</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={!newChiefId || !newAssistantId}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InvigilatorAllocation;
