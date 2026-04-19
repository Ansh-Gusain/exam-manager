import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
  SCHOOLS, DEPARTMENTS_BY_SCHOOL, BRANCHES_BY_DEPARTMENT,
  SECTIONS, YEARS, SEMESTERS, SESSIONS, getYearFromSemester, getSemestersForYear
} from "../lib/data";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Plus, Upload, Filter, X, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from "lucide-react";

const COLUMN_MAP = {
  'roll number': 'rollNumber', 'rollnumber': 'rollNumber', 'roll no': 'rollNumber',
  'roll_number': 'rollNumber', 'enrollment': 'rollNumber', 'enrolment': 'rollNumber',
  'name': 'name', 'student name': 'name', 'full name': 'name', 'student_name': 'name',
  'school': 'school',
  'department': 'department', 'dept': 'department',
  'branch': 'branch', 'programme': 'branch', 'program': 'branch',
  'semester': 'semester', 'sem': 'semester',
  'year': 'year',
  'section': 'section', 'sec': 'section',
  'session': 'session', 'batch': 'session',
};

export function StudentManagement() {  const { students, setStudents, refreshAll } = useStore();
  const fileInputRef = useRef(null);

  // filters
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // add student dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const defaultForm = { rollNumber: "", name: "", school: "SOICT", department: "CSE", branch: "BCS", semester: 3, year: "2nd", section: "A", session: "2024-2028" };
  const [formData, setFormData] = useState(defaultForm);

  // excel upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [uploading, setUploading] = useState(false);

  // --- filter helpers ---
  const filterDepartments = useMemo(() => {
    if (schoolFilter === "all") return [...new Set(students.map(s => s.department))].sort();
    return DEPARTMENTS_BY_SCHOOL[schoolFilter] || [];
  }, [schoolFilter, students]);

  const filterBranches = useMemo(() => {
    if (departmentFilter === "all") {
      if (schoolFilter === "all") return [...new Set(students.map(s => s.branch))].sort();
      return (DEPARTMENTS_BY_SCHOOL[schoolFilter] || []).flatMap(d => BRANCHES_BY_DEPARTMENT[d] || []);
    }
    return BRANCHES_BY_DEPARTMENT[departmentFilter] || [];
  }, [departmentFilter, schoolFilter, students]);

  const filterSemesters = useMemo(() => yearFilter === "all" ? SEMESTERS : getSemestersForYear(yearFilter), [yearFilter]);

  const clearAllFilters = () => {
    setSearch(""); setSchoolFilter("all"); setDepartmentFilter("all"); setBranchFilter("all");
    setSemesterFilter("all"); setYearFilter("all"); setSectionFilter("all"); setSessionFilter("all"); setPage(0);
  };
  const hasActiveFilters = schoolFilter !== "all" || departmentFilter !== "all" || branchFilter !== "all" ||
    semesterFilter !== "all" || yearFilter !== "all" || sectionFilter !== "all" || sessionFilter !== "all" || search !== "";

  const filtered = useMemo(() => students.filter(s => {
    const q = search.toLowerCase();
    return (s.name?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q)) &&
      (schoolFilter === "all" || s.school === schoolFilter) &&
      (departmentFilter === "all" || s.department === departmentFilter) &&
      (branchFilter === "all" || s.branch === branchFilter) &&
      (semesterFilter === "all" || s.semester === Number(semesterFilter)) &&
      (yearFilter === "all" || s.year === yearFilter) &&
      (sectionFilter === "all" || s.section === sectionFilter) &&
      (sessionFilter === "all" || s.session === sessionFilter);
  }).sort((a, b) => {
    const yo = { "1st": 1, "2nd": 2, "3rd": 3, "4th": 4 };
    return (yo[a.year] || 0) - (yo[b.year] || 0) || a.semester - b.semester ||
      a.section?.localeCompare(b.section) || a.rollNumber?.localeCompare(b.rollNumber);
  }), [students, search, schoolFilter, departmentFilter, branchFilter, semesterFilter, yearFilter, sectionFilter, sessionFilter]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  // --- add student ---
  const handleFormSchoolChange = v => {
    const dept = (DEPARTMENTS_BY_SCHOOL[v] || [])[0] || "";
    const branch = (BRANCHES_BY_DEPARTMENT[dept] || [])[0] || "";
    setFormData({ ...formData, school: v, department: dept, branch });
  };
  const handleFormDeptChange = v => {
    const branch = (BRANCHES_BY_DEPARTMENT[v] || [])[0] || "";
    setFormData({ ...formData, department: v, branch });
  };

  const handleAdd = async () => {
    if (!formData.rollNumber || !formData.name) return;
    try {
      const created = await api.students.create(formData);
      setStudents(prev => [...prev, created]);
      setDialogOpen(false);
      setFormData(defaultForm);
      toast.success("Student added");
    } catch (err) {
      toast.error(err.message || "Failed to add student");
    }
  };

  // --- excel upload ---
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const errors = [];
      const parsed = rows.map((row, i) => {
        const norm = {};
        for (const [k, v] of Object.entries(row)) {
          const mapped = COLUMN_MAP[k.toLowerCase().trim()];
          if (mapped) norm[mapped] = String(v).trim();
        }
        if (norm.semester && !norm.year) norm.year = getYearFromSemester(Number(norm.semester));
        if (norm.semester) norm.semester = Number(norm.semester);
        const missing = ["rollNumber","name","school","department","branch","semester","section","session"].filter(f => !norm[f]);
        if (missing.length) errors.push(`Row ${i + 2}: missing ${missing.join(", ")}`);
        return norm;
      });
      setUploadPreview(parsed);
      setUploadErrors(errors);
      setUploadDialogOpen(true);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleUploadConfirm = async () => {
    const valid = uploadPreview.filter(s => s.rollNumber && s.name && s.school && s.department && s.branch && s.semester && s.section && s.session);
    if (!valid.length) return;
    setUploading(true);
    try {
      const res = await api.students.bulk(valid);
      await refreshAll();
      toast.success(`${res.count ?? valid.length} students imported successfully`);
      setUploadDialogOpen(false);
      setUploadPreview([]);
      setUploadErrors([]);
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Roll Number","Name","School","Department","Branch","Semester","Section","Session"],
      ["BCS2401001","John Doe","SOICT","CSE","BCS",3,"A","2024-2028"],
      ["BCS2401002","Jane Smith","SOICT","CSE","BCS",3,"A","2024-2028"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_template.xlsx");
  };

  const formDepts = DEPARTMENTS_BY_SCHOOL[formData.school] || [];
  const formBranches = BRANCHES_BY_DEPARTMENT[formData.department] || [];
  const formSemesters = getSemestersForYear(formData.year);
  const validCount = uploadPreview.filter(s => s.rollNumber && s.name && s.school && s.department && s.branch && s.semester && s.section && s.session).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1>Student Management</h1>
          <p className="text-[0.8rem] text-muted-foreground">{filtered.length} students found</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" /> Upload Excel
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3 px-4 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or roll number..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9 text-[0.85rem]" />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-9 text-[0.8rem]">
                <X className="w-3 h-3 mr-1" /> Clear Filters
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Select value={schoolFilter} onValueChange={v => { setSchoolFilter(v); setDepartmentFilter("all"); setBranchFilter("all"); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><Filter className="w-3 h-3 mr-1 shrink-0" /><SelectValue placeholder="School" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={v => { setDepartmentFilter(v); setBranchFilter("all"); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {filterDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={v => { setBranchFilter(v); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {filterBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={yearFilter} onValueChange={v => { setYearFilter(v); setSemesterFilter("all"); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {YEARS.map(y => <SelectItem key={y} value={y}>{y} Year</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={semesterFilter} onValueChange={v => { setSemesterFilter(v); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {filterSemesters.map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={v => { setSectionFilter(v); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {SECTIONS.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sessionFilter} onValueChange={v => { setSessionFilter(v); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Session" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Roll No.","Name","School","Dept","Branch","Year","Sem","Sec","Session"].map(h =>
                    <TableHead key={h} className="text-[0.75rem]">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0
                  ? <TableRow><TableCell colSpan={9} className="text-center text-[0.8rem] text-muted-foreground py-8">No students found.</TableCell></TableRow>
                  : paged.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-[0.78rem] font-mono">{s.rollNumber}</TableCell>
                      <TableCell className="text-[0.78rem]">{s.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[0.68rem]">{s.school}</Badge></TableCell>
                      <TableCell className="text-[0.78rem]">{s.department}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[0.68rem]">{s.branch}</Badge></TableCell>
                      <TableCell className="text-[0.78rem]">{s.year}</TableCell>
                      <TableCell className="text-[0.78rem]">{s.semester}</TableCell>
                      <TableCell className="text-[0.78rem]">{s.section}</TableCell>
                      <TableCell className="text-[0.78rem]">{s.session}</TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-[0.75rem] text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="text-[0.75rem] h-7">Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="text-[0.75rem] h-7">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Excel Upload Preview Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Preview Import — {uploadPreview.length} rows
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Review before importing. Duplicate roll numbers will be updated.</span>
              <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-[0.75rem]">
                <Download className="w-3 h-3 mr-1" /> Download Template
              </Button>
            </DialogDescription>
          </DialogHeader>

          {uploadErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-[0.78rem] text-amber-800 space-y-1">
              <p className="font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {uploadErrors.length} row(s) will be skipped:
              </p>
              {uploadErrors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
              {uploadErrors.length > 5 && <p>...and {uploadErrors.length - 5} more</p>}
            </div>
          )}

          <div className="overflow-auto flex-1 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Roll No.","Name","School","Dept","Branch","Sem","Section","Session","Status"].map(h =>
                    <TableHead key={h} className="text-[0.72rem]">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadPreview.map((s, i) => {
                  const valid = s.rollNumber && s.name && s.school && s.department && s.branch && s.semester && s.section && s.session;
                  return (
                    <TableRow key={i} className={valid ? "" : "opacity-40"}>
                      <TableCell className="text-[0.75rem] font-mono">{s.rollNumber}</TableCell>
                      <TableCell className="text-[0.75rem]">{s.name}</TableCell>
                      <TableCell className="text-[0.75rem]">{s.school}</TableCell>
                      <TableCell className="text-[0.75rem]">{s.department}</TableCell>
                      <TableCell className="text-[0.75rem]">{s.branch}</TableCell>
                      <TableCell className="text-[0.75rem]">{s.semester}</TableCell>
                      <TableCell className="text-[0.75rem]">{s.section}</TableCell>
                      <TableCell className="text-[0.75rem]">{s.session}</TableCell>
                      <TableCell>
                        {valid
                          ? <Badge className="bg-green-100 text-green-700 text-[0.65rem]"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>
                          : <Badge variant="destructive" className="text-[0.65rem]"><AlertCircle className="w-3 h-3 mr-1" />Skip</Badge>
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadConfirm} disabled={uploading || validCount === 0}>
              <Upload className="w-4 h-4 mr-1" />
              {uploading ? "Importing..." : `Import ${validCount} Students`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>School, Department, and Branch are cascading fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">Roll Number</Label>
                <Input value={formData.rollNumber} onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} placeholder="e.g., BCS2401001" className="text-[0.85rem]" />
              </div>
              <div>
                <Label className="text-[0.8rem]">Full Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Student name" className="text-[0.85rem]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[0.8rem]">School</Label>
                <Select value={formData.school} onValueChange={handleFormSchoolChange}>
                  <SelectTrigger className="text-[0.8rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Department</Label>
                <Select value={formData.department} onValueChange={handleFormDeptChange}>
                  <SelectTrigger className="text-[0.8rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{formDepts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Branch</Label>
                <Select value={formData.branch} onValueChange={v => setFormData({ ...formData, branch: v })}>
                  <SelectTrigger className="text-[0.8rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{formBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="text-[0.8rem]">Year</Label>
                <Select value={formData.year} onValueChange={v => setFormData({ ...formData, year: v, semester: getSemestersForYear(v)[0] })}>
                  <SelectTrigger className="text-[0.8rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Semester</Label>
                <Select value={String(formData.semester)} onValueChange={v => setFormData({ ...formData, semester: Number(v), year: getYearFromSemester(Number(v)) })}>
                  <SelectTrigger className="text-[0.8rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{formSemesters.map(s => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Section</Label>
                <Select value={formData.section} onValueChange={v => setFormData({ ...formData, section: v })}>
                  <SelectTrigger className="text-[0.8rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Session</Label>
                <Select value={formData.session} onValueChange={v => setFormData({ ...formData, session: v })}>
                  <SelectTrigger className="text-[0.8rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentManagement;
