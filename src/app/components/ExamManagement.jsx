import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription
} from "./ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "./ui/select";
import { Plus, Pencil, Trash2, Calendar, Clock, Sun, Moon, X } from "lucide-react";

// ── School → Dept → Branch cascade ──────────────────────────────────────────
const SCHOOL_DEPT_BRANCH = {
  "SOICT": {
    "Computer Science":       ["CSE","AI","DS","CYB","ML","ICS"],
    "Information Technology": ["BCA","BIT"],
    "Electronics":            ["ECE","EC-AIML"],
  },
  "SOM":    { "Management": ["MBA"], "Business Administration": ["BBA"] },
  "SOE":    { "Mechanical Engineering": ["ME"], "Civil Engineering": ["CE"] },
  "SOLGJ":  { "Law": ["LLB","BA-LLB"] },
  "SOHSS":  { "Humanities": ["BA"], "Social Sciences": ["BSc"] },
  "SOVSAS": { "Visual Arts": ["BFA"], "Performing Arts": ["BPA"] },
};
const SCHOOLS = Object.keys(SCHOOL_DEPT_BRANCH);

const YEARS = ["1st Year","2nd Year","3rd Year","4th Year","5th Year"];
const BATCHES = ["2021-2025","2022-2026","2023-2027","2024-2028","2025-2029"];
const SEM_ROMAN = { 1:"I",2:"II",3:"III",4:"IV",5:"V",6:"VI",7:"VII",8:"VIII",9:"IX",10:"X" };

// Year → allowed semesters (odd first = Aug-Dec, even second = Jan-May)
const YEAR_SEMESTERS = {
  "1st Year": [1, 2],
  "2nd Year": [3, 4],
  "3rd Year": [5, 6],
  "4th Year": [7, 8],
  "5th Year": [9, 10],
};

const SHIFTS = [
  { value: "Shift 1 (Morning)", label: "Shift 1 — Morning (9:00 am – 12:00 pm)", start: "09:00", end: "12:00" },
  { value: "Shift 2 (Evening)", label: "Shift 2 — Evening (3:00 pm – 6:00 pm)",  start: "15:00", end: "18:00" },
];

const EMPTY_FORM = {
  name: "End Semester Examination",
  courseCode: "", subject: "", date: "",
  startTime: "09:00", endTime: "12:00",
  shift: "Shift 1 (Morning)",
  school: "SOICT", department: "Computer Science",
  branches: [], year: "2nd Year", semester: 4,
  batch: "2023-2027",
  status: "scheduled",
};

const statusColor = (s) => ({
  scheduled: "bg-blue-100 text-blue-700",
  ongoing:   "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
}[s] || "");

export function ExamManagement() {
  const { exams, setExams } = useStore();
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData]       = useState(EMPTY_FORM);

  const set = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  // Available depts and branches based on selected school/dept
  const availableDepts   = Object.keys(SCHOOL_DEPT_BRANCH[formData.school] || {});
  const availableBranches = (SCHOOL_DEPT_BRANCH[formData.school]?.[formData.department]) || [];

  const toggleBranch = (code) =>
    set("branches", formData.branches.includes(code)
      ? formData.branches.filter((b) => b !== code)
      : [...formData.branches, code]);

  const selectSchool = (school) => {
    const depts  = Object.keys(SCHOOL_DEPT_BRANCH[school] || {});
    const dept   = depts[0] || "";
    const branch = (SCHOOL_DEPT_BRANCH[school]?.[dept] || [])[0] || "";
    setFormData(p => ({ ...p, school, department: dept, branches: [] }));
  };

  const selectDept = (dept) => {
    setFormData(p => ({ ...p, department: dept, branches: [] }));
  };

  const selectYear = (year) => {
    const sems = YEAR_SEMESTERS[year] || [1, 2];
    setFormData(p => ({ ...p, year, semester: sems[0] }));
  };

  const selectShift = (val) => {
    const s = SHIFTS.find((x) => x.value === val);
    setFormData((p) => ({ ...p, shift: val, startTime: s?.start ?? p.startTime, endTime: s?.end ?? p.endTime }));
  };

  const openAdd = () => { setEditingExam(null); setFormData(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      name:       exam.name,
      courseCode: exam.courseCode || exam.course_code || "",
      subject:   exam.subject,
      date:      exam.date,
      startTime: exam.startTime  || exam.start_time || "09:00",
      endTime:   exam.endTime    || exam.end_time   || "12:00",
      shift:     exam.shift      || "Shift 1 (Morning)",
      branches:  [...(exam.branches || [])],
      semester:  exam.semester,
      year:      exam.year       || "2nd Year",
      batch:     exam.batch      || "2023-2027",
      status:    exam.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.courseCode.trim()) { toast.error("Course code is required"); return; }
    if (!formData.subject.trim())    { toast.error("Course name is required"); return; }
    if (!formData.date)              { toast.error("Date is required"); return; }
    if (formData.branches.length === 0) { toast.error("Select at least one branch"); return; }
    try {
      if (editingExam) {
        const updated = await api.exams.update(editingExam.id, formData);
        setExams((prev) => prev.map((e) => e.id === editingExam.id ? { ...e, ...updated } : e));
        toast.success("Exam updated");
      } else {
        const created = await api.exams.create(formData);
        setExams((prev) => [...prev, created]);
        toast.success("Exam scheduled");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save exam");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.exams.delete(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
      toast.success("Exam deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete exam");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1>Exam Management</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Schedule Exam
        </Button>
      </div>

      {/* Exam cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...exams].sort((a, b) => a.date?.localeCompare(b.date)).map((exam) => (
          <Card key={exam.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary text-[0.8rem] bg-primary/10 px-2 py-0.5 rounded">
                      {exam.courseCode || exam.course_code || exam.subject}
                    </span>
                  </div>
                  <h3 className="text-[0.9rem] font-semibold mt-1">{exam.subject}</h3>
                  <p className="text-[0.75rem] text-muted-foreground">{exam.name}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(exam)} className="p-1 rounded hover:bg-accent">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(exam.id)} className="p-1 rounded hover:bg-accent">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-[0.8rem]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{new Date(exam.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{exam.startTime || exam.start_time} – {exam.endTime || exam.end_time}</span>
                </div>
                {exam.shift && (
                  <div className="flex items-center gap-1.5">
                    {exam.shift.includes("Morning")
                      ? <Sun className="w-3.5 h-3.5 text-amber-500" />
                      : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                    <span className={`text-[0.7rem] font-semibold px-2 py-0.5 rounded ${exam.shift.includes("Morning") ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                      {exam.shift}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Semester:</span>
                  <span className="font-semibold">{exam.semester}</span>
                  {exam.batch && <>
                    <span className="text-muted-foreground ml-2">Batch:</span>
                    <span className="font-semibold">{exam.batch}</span>
                  </>}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border">
                {(exam.branches || []).map((b) => (
                  <Badge key={b} variant="secondary" className="text-[0.65rem] font-mono">{b}</Badge>
                ))}
                <div className="flex-1" />
                <Badge className={`text-[0.65rem] ${statusColor(exam.status)}`}>{exam.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExam ? "Edit Exam" : "Schedule New Exam"}</DialogTitle>
            <DialogDescription>
              {editingExam ? "Update exam details." : "Fill in the exam details. Branches must match student records."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Exam name */}
            <div>
              <Label className="text-[0.8rem]">Exam Name</Label>
              <Select value={formData.name} onValueChange={(v) => set("name", v)}>
                <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="End Semester Examination">End Semester Examination</SelectItem>
                  <SelectItem value="Mid-Semester Examination">Mid-Semester Examination</SelectItem>
                  <SelectItem value="Supplementary Examination">Supplementary Examination</SelectItem>
                  <SelectItem value="Re-examination">Re-examination</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Code + Course Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">Course Code</Label>
                <Input
                  value={formData.courseCode}
                  onChange={(e) => set("courseCode", e.target.value.toUpperCase())}
                  placeholder="e.g. CS202"
                  className="text-[0.85rem] font-mono"
                />
              </div>
              <div>
                <Label className="text-[0.8rem]">Course Name</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => set("subject", e.target.value)}
                  placeholder="e.g. Software Engineering"
                  className="text-[0.85rem]"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <Label className="text-[0.8rem]">Date</Label>
              <Input type="date" value={formData.date} onChange={(e) => set("date", e.target.value)} className="text-[0.85rem]" />
            </div>

            {/* Shift */}
            <div>
              <Label className="text-[0.8rem]">Shift</Label>
              <Select value={formData.shift} onValueChange={selectShift}>
                <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHIFTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">Start Time</Label>
                <Input type="time" value={formData.startTime} onChange={(e) => set("startTime", e.target.value)} className="text-[0.85rem]" />
              </div>
              <div>
                <Label className="text-[0.8rem]">End Time</Label>
                <Input type="time" value={formData.endTime} onChange={(e) => set("endTime", e.target.value)} className="text-[0.85rem]" />
              </div>
            </div>

            {/* School → Dept → Branch cascade */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[0.8rem]">School</Label>
                  <Select value={formData.school} onValueChange={selectSchool}>
                    <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[0.8rem]">Department</Label>
                  <Select value={formData.department} onValueChange={selectDept}>
                    <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableDepts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Branch multi-select as toggle buttons */}
              <div>
                <Label className="text-[0.8rem] mb-1.5 block">
                  Branches
                  {formData.branches.length > 0 && (
                    <span className="ml-2 text-primary font-mono text-[0.7rem]">({formData.branches.join(", ")})</span>
                  )}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableBranches.map(code => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleBranch(code)}
                      className={`px-3 py-1.5 rounded-lg border text-[0.78rem] font-mono font-semibold transition-colors ${
                        formData.branches.includes(code)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-accent"
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                  {formData.branches.length > 0 && (
                    <button type="button" onClick={() => set("branches",[])} className="px-2 py-1.5 rounded-lg border border-border text-[0.72rem] text-muted-foreground hover:bg-accent">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Year + Semester + Batch */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[0.8rem]">Year</Label>
                <Select value={formData.year} onValueChange={selectYear}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Semester</Label>
                <Select value={String(formData.semester)} onValueChange={v => set("semester", Number(v))}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(YEAR_SEMESTERS[formData.year] || [1,2]).map(s => (
                      <SelectItem key={s} value={String(s)}>Sem {s} ({SEM_ROMAN[s]})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Batch</Label>
                <Select value={formData.batch || "2023-2027"} onValueChange={v => set("batch", v)}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BATCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingExam && (
              <div>
                <Label className="text-[0.8rem]">Status</Label>
                <Select value={formData.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingExam ? "Update" : "Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExamManagement;
