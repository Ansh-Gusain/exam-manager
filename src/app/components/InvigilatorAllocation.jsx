import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "./ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { UserCheck, Play, AlertCircle, CheckCircle2, BarChart3, Shield, User } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export function InvigilatorAllocation() {
  const { rooms, exams, faculty, invigilationAllocations, setInvigilationAllocations, refreshInvigilation, refreshFaculty } = useStore();
  const [selectedExamId, setSelectedExamId] = useState("");
  const [allocating, setAllocating] = useState(false);

  const scheduledExams = exams.filter(e => e.status === "scheduled" || e.status === "ongoing");
  const selectedExam   = exams.find(e => e.id === selectedExamId);

  const examAllocations = useMemo(
    () => invigilationAllocations.filter(ia => ia.examId === selectedExamId),
    [invigilationAllocations, selectedExamId]
  );

  // Group by room: { roomId: { chief, assistant } }
  const byRoom = useMemo(() => {
    const map = {};
    examAllocations.forEach(ia => {
      if (!map[ia.roomId]) map[ia.roomId] = {};
      map[ia.roomId][ia.role] = ia;
    });
    return map;
  }, [examAllocations]);

  const roomsWithFaculty = useMemo(() =>
    Object.entries(byRoom).map(([roomId, roles]) => ({
      room:      rooms.find(r => r.id === roomId),
      chief:     roles.chief     ? faculty.find(f => f.id === roles.chief.facultyId)     : null,
      assistant: roles.assistant ? faculty.find(f => f.id === roles.assistant.facultyId) : null,
    })).filter(r => r.room),
    [byRoom, rooms, faculty]
  );

  const dutyDistribution = useMemo(() =>
    faculty.filter(f => f.isAvailable)
      .map(f => ({ name: f.name.split(" ").slice(-1)[0], duties: f.totalDuties }))
      .sort((a, b) => b.duties - a.duties)
      .slice(0, 15),
    [faculty]
  );

  const handleAllocate = async () => {
    if (!selectedExam) return;
    setAllocating(true);
    try {
      const result = await api.invigilation.allocate(selectedExamId);
      await refreshInvigilation();
      await refreshFaculty();
      toast.success(result.message || `Assigned invigilators to ${result.rooms} rooms (2 per room)`);
    } catch (err) {
      toast.error(err.message || "Allocation failed");
    } finally {
      setAllocating(false);
    }
  };

  const handleClear = async () => {
    try {
      await api.invigilation.clearByExam(selectedExamId);
      setInvigilationAllocations(prev => prev.filter(ia => ia.examId !== selectedExamId));
      toast.success("Invigilation allocations cleared.");
    } catch (err) {
      toast.error(err.message || "Failed to clear");
    }
  };

  return (
    <div className="space-y-4">
      <div><h1>Invigilator Allocation</h1></div>

      {/* Exam selector */}
      <Card>
        <CardContent className="py-4 px-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-[0.8rem] text-muted-foreground mb-1 block">Select Exam</label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="text-[0.85rem]">
                  <SelectValue placeholder="Choose an exam..." />
                </SelectTrigger>
                <SelectContent>
                  {scheduledExams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.courseCode || exam.subject} — {exam.name} ({exam.date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAllocate} disabled={!selectedExamId || allocating}>
                <Play className="w-4 h-4 mr-1" />
                {allocating ? "Assigning..." : "Auto Assign (2 per room)"}
              </Button>
              {examAllocations.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleClear}>Clear</Button>
              )}
            </div>
          </div>

          {selectedExam && (
            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-border text-[0.8rem]">
              <span>Available Faculty: <strong>{faculty.filter(f => f.isAvailable).length}</strong></span>
              <span>Rooms with Seating: <strong>{roomsWithFaculty.length || "—"}</strong></span>
              <span>Invigilators Assigned: <strong>{examAllocations.length}</strong></span>
              <span>
                {examAllocations.length > 0 ? (
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

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms" className="text-[0.8rem]">Room Assignments</TabsTrigger>
          <TabsTrigger value="distribution" className="text-[0.8rem]">Workload Chart</TabsTrigger>
          <TabsTrigger value="faculty" className="text-[0.8rem]">Faculty Overview</TabsTrigger>
        </TabsList>

        {/* ── Room Assignments (2 per room) ── */}
        <TabsContent value="rooms">
          {roomsWithFaculty.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[0.75rem]">Room</TableHead>
                        <TableHead className="text-[0.75rem]">Building</TableHead>
                        <TableHead className="text-[0.75rem]">
                          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-primary" /> Chief Invigilator</span>
                        </TableHead>
                        <TableHead className="text-[0.75rem]">Dept (Chief)</TableHead>
                        <TableHead className="text-[0.75rem]">
                          <span className="flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" /> Assistant Invigilator</span>
                        </TableHead>
                        <TableHead className="text-[0.75rem]">Dept (Asst)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roomsWithFaculty.map(({ room, chief, assistant }) => (
                        <TableRow key={room.id}>
                          <TableCell className="text-[0.8rem] font-mono font-semibold">{room.roomNumber}</TableCell>
                          <TableCell className="text-[0.8rem]">{room.building}</TableCell>
                          <TableCell>
                            {chief ? (
                              <div>
                                <p className="text-[0.8rem] font-medium">{chief.name}</p>
                                <p className="text-[0.7rem] text-muted-foreground">{chief.employeeId}</p>
                              </div>
                            ) : <span className="text-[0.75rem] text-destructive">Not assigned</span>}
                          </TableCell>
                          <TableCell className="text-[0.78rem]">{chief?.department || "—"}</TableCell>
                          <TableCell>
                            {assistant ? (
                              <div>
                                <p className="text-[0.8rem] font-medium">{assistant.name}</p>
                                <p className="text-[0.7rem] text-muted-foreground">{assistant.employeeId}</p>
                              </div>
                            ) : <span className="text-[0.75rem] text-destructive">Not assigned</span>}
                          </TableCell>
                          <TableCell className="text-[0.78rem]">{assistant?.department || "—"}</TableCell>
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
                <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                Select an exam and click "Auto Assign" to allocate 2 invigilators per room.
                <p className="text-[0.75rem] mt-1">Seating allocation must be done first.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Workload Chart ── */}
        <TabsContent value="distribution">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[0.9rem] flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Faculty Duty Distribution (Top 15)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dutyDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="duties" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Faculty Overview ── */}
        <TabsContent value="faculty">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[0.75rem]">Employee ID</TableHead>
                      <TableHead className="text-[0.75rem]">Name</TableHead>
                      <TableHead className="text-[0.75rem]">Department</TableHead>
                      <TableHead className="text-[0.75rem]">Designation</TableHead>
                      <TableHead className="text-[0.75rem]">Total Duties</TableHead>
                      <TableHead className="text-[0.75rem]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...faculty].sort((a, b) => (b.totalDuties || 0) - (a.totalDuties || 0)).map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="text-[0.8rem] font-mono">{f.employeeId}</TableCell>
                        <TableCell className="text-[0.8rem]">{f.name}</TableCell>
                        <TableCell className="text-[0.8rem]">{f.department}</TableCell>
                        <TableCell className="text-[0.8rem]">{f.designation}</TableCell>
                        <TableCell className="text-[0.8rem] font-mono font-semibold">{f.totalDuties || 0}</TableCell>
                        <TableCell>
                          <Badge variant={f.isAvailable ? "default" : "secondary"}
                            className={`text-[0.7rem] ${f.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {f.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default InvigilatorAllocation;
