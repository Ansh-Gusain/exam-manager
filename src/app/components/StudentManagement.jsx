import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Plus, Upload, X, Download, AlertCircle, CheckCircle2 } from "lucide-react";

// ── School → Department → Branch mapping ─────────────────────────────────────
const SCHOOL_DEPT = {
  "SOICT":  ["Computer Science","Information Technology","Electronics"],
  "SOM":    ["Management","Business Administration"],
  "SOE":    ["Mechanical Engineering","Civil Engineering","Chemical Engineering"],
  "SOLGJ":  ["Law"],
  "SOHSS":  ["Humanities","Social Sciences","Psychology"],
  "SOVSAS": ["Visual Arts","Performing Arts"],
};
const SCHOOLS    = Object.keys(SCHOOL_DEPT);
const DEPT_BRANCH = {
  "Computer Science":        ["CSE","AI","DS","CYB","ML","ICS"],
  "Information Technology":  ["BCA","BIT"],
  "Electronics":             ["ECE","EC-AIML"],
  "Management":              ["MBA"],
  "Business Administration": ["BBA"],
  "Mechanical Engineering":  ["ME"],
  "Civil Engineering":       ["CE"],
  "Chemical Engineering":    ["CHE"],
  "Law":                     ["LLB","BA-LLB"],
  "Humanities":              ["BA"],
  "Social Sciences":         ["BSc"],
  "Psychology":              ["BSc-Psy"],
  "Visual Arts":             ["BFA"],
  "Performing Arts":         ["BPA"],
};
const ALL_BRANCHES = Object.values(DEPT_BRANCH).flat();

// Semester to Roman numeral
const SEM_ROMAN = { 1:"I", 2:"II", 3:"III", 4:"IV", 5:"V", 6:"VI", 7:"VII", 8:"VIII" };

const YEARS    = ["1st Year","2nd Year","3rd Year","4th Year","5th Year"];
const SESSIONS = ["2024-2025","2025-2026","2026-2027","2023-2024","2022-2023"];
const BATCHES  = ["2021-2025","2022-2026","2023-2027","2024-2028","2024-2029","2025-2029","2020-2024"];

const COL_MAP = {
  'roll number':'rollNumber','rollnumber':'rollNumber','roll no':'rollNumber','roll_number':'rollNumber','enrollment':'rollNumber',
  'name':'name','student name':'name','full name':'name',
  'school':'school',
  'department':'department','dept':'department',
  'branch':'branch','programme':'branch','program':'branch',
  'semester':'semester','sem':'semester',
  'year':'year',
  'session':'session',
  'batch':'batch',
  'type':'type','student type':'type','student':'type',
};

const EMPTY_FORM = {
  rollNumber:"", name:"", school:"SOICT",
  department:"Computer Science", branch:"CSE",
  semester:1, year:"1st Year",
  session:"2025-2026", batch:"2024-2028", type:"regular"
};

export function StudentManagement() {
  const { students, setStudents, refreshAll } = useStore();
  const fileRef = useRef(null);

  const [search,          setSearch]          = useState("");
  const [schoolFilter,    setSchoolFilter]     = useState("all");
  const [deptFilter,      setDeptFilter]       = useState("all");
  const [branchFilter,    setBranchFilter]     = useState("all");
  const [semFilter,       setSemFilter]        = useState("all");
  const [typeFilter,      setTypeFilter]       = useState("all");
  const [batchFilter,     setBatchFilter]      = useState("all");
  const [sessionFilter,   setSessionFilter]    = useState("all");
  const [page,            setPage]             = useState(0);
  const pageSize = 20;

  const [dialogOpen,      setDialogOpen]       = useState(false);
  const [formData,        setFormData]         = useState(EMPTY_FORM);

  const [uploadOpen,      setUploadOpen]       = useState(false);
  const [preview,         setPreview]          = useState([]);
  const [errors,          setErrors]           = useState([]);
  const [uploading,       setUploading]        = useState(false);

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  // Branches available for selected dept filter
  const availableDepts = useMemo(() =>
    schoolFilter === "all" ? Object.keys(DEPT_BRANCH) : (SCHOOL_DEPT[schoolFilter] || []),
    [schoolFilter]
  );

  const availableBranches = useMemo(() => {
    if (deptFilter !== "all") return DEPT_BRANCH[deptFilter] || [];
    if (schoolFilter !== "all") return (SCHOOL_DEPT[schoolFilter] || []).flatMap(d => DEPT_BRANCH[d] || []);
    return ALL_BRANCHES;
  }, [deptFilter, schoolFilter]);

  // Unique batches and semesters from data
  const batches   = useMemo(() => [...new Set(students.map(s => s.batch).filter(Boolean))].sort(), [students]);
  const semesters = useMemo(() => [...new Set(students.map(s => s.semester))].sort((a,b)=>a-b), [students]);
  const sessions  = useMemo(() => [...new Set(students.map(s => s.session))].sort(), [students]);

  const filtered = useMemo(() => students.filter(s => {
    const q = search.toLowerCase();
    const rn = s.roll_number || s.rollNumber || "";
    return (s.name?.toLowerCase().includes(q) || rn.toLowerCase().includes(q)) &&
      (schoolFilter  === "all" || s.school     === schoolFilter) &&
      (deptFilter    === "all" || s.department === deptFilter) &&
      (branchFilter  === "all" || s.branch     === branchFilter) &&
      (semFilter     === "all" || String(s.semester) === semFilter) &&
      (typeFilter    === "all" || s.type       === typeFilter) &&
      (batchFilter   === "all" || s.batch      === batchFilter) &&
      (sessionFilter === "all" || s.session    === sessionFilter);
  }).sort((a,b) => (a.roll_number||a.rollNumber||"").localeCompare(b.roll_number||b.rollNumber||"")),
  [students, search, schoolFilter, deptFilter, branchFilter, semFilter, typeFilter, batchFilter, sessionFilter]);

  const paged      = filtered.slice(page * pageSize, (page+1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const clearFilters = () => {
    setSearch(""); setSchoolFilter("all"); setDeptFilter("all"); setBranchFilter("all");
    setSemFilter("all"); setTypeFilter("all"); setBatchFilter("all"); setSessionFilter("all"); setPage(0);
  };
  const hasFilters = search || schoolFilter !== "all" || deptFilter !== "all" || branchFilter !== "all" ||
    semFilter !== "all" || typeFilter !== "all" || batchFilter !== "all" || sessionFilter !== "all";

  // Add student
  const handleAdd = async () => {
    if (!formData.rollNumber || !formData.name) { toast.error("Roll number and name are required"); return; }
    try {
      const created = await api.students.create(formData);
      setStudents(prev => [...prev, created]);
      setDialogOpen(false);
      setFormData(EMPTY_FORM);
      toast.success("Student added");
    } catch (err) { toast.error(err.message || "Failed to add student"); }
  };

  // Excel file selected
  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const wb = XLSX.read(evt.target.result, { type:"binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval:"" });
      const errs = [];
      const parsed = rows.map((row, i) => {
        const norm = {};
        for (const [k, v] of Object.entries(row)) {
          const mapped = COL_MAP[k.toLowerCase().trim()];
          if (mapped) norm[mapped] = String(v).trim();
        }
        if (norm.semester) norm.semester = Number(norm.semester);
        if (!norm.batch && norm.session) norm.batch = norm.session;
        if (!norm.type) norm.type = "regular";
        const missing = ["rollNumber","name","school","department","branch","semester","session"].filter(f => !norm[f]);
        if (missing.length) errs.push(`Row ${i+2}: missing ${missing.join(", ")}`);
        return norm;
      });
      setPreview(parsed);
      setErrors(errs);
      setUploadOpen(true);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleUpload = async () => {
    const valid = preview.filter(s => s.rollNumber && s.name && s.school && s.department && s.branch && s.semester && s.session);
    if (!valid.length) return;
    setUploading(true);
    try {
      const res = await api.students.bulk(valid);
      await refreshAll();
      toast.success(`${res.count ?? valid.length} students imported`);
      setUploadOpen(false); setPreview([]); setErrors([]);
    } catch (err) { toast.error(err.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Roll Number","Name","School","Department","Branch","Semester","Year","Session","Batch","Type"],
      ["235UCS026","Ansh Gusain","SOICT","Computer Science","CSE",6,"3rd Year","2025-2026","2023-2027","regular"],
      ["235UCS027","Priya Sharma","SOICT","Computer Science","CSE",6,"3rd Year","2025-2026","2023-2027","regular"],
      ["R235UCS028","Rahul Verma","SOICT","Computer Science","CSE",4,"2nd Year","2025-2026","2023-2027","repeater"],
    ]);
    ws["!cols"] = [14,20,8,18,8,10,10,12,12,10].map(w=>({wch:w}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_template.xlsx");
  };

  const validCount = preview.filter(s => s.rollNumber && s.name && s.school && s.department && s.branch && s.semester && s.session).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1>Student Management</h1>
          <p className="text-[0.8rem] text-muted-foreground">{students.length} total · {filtered.length} shown</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-1" /> Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" /> Import Excel
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          <Button size="sm" onClick={() => { setFormData(EMPTY_FORM); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3 px-4 space-y-2">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or roll number..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9 text-[0.85rem]" />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-[0.8rem]">
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
          {/* Row 1: School → Department → Branch (cascading) */}
          <div className="grid grid-cols-3 gap-2">
            <Select value={schoolFilter} onValueChange={v => { setSchoolFilter(v); setDeptFilter("all"); setBranchFilter("all"); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="School" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setBranchFilter("all"); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {availableDepts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={v => { setBranchFilter(v); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {availableBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Row 2: Batch, Semester, Session, Type */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={batchFilter} onValueChange={v => { setBatchFilter(v); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Batch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={semFilter} onValueChange={v => { setSemFilter(v); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map(s => <SelectItem key={s} value={String(s)}>Sem {s} ({SEM_ROMAN[s]})</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sessionFilter} onValueChange={v => { setSessionFilter(v); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Session" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
              <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="repeater">Repeater</SelectItem>
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
                  {["Roll Number","Name","School","Department","Branch","Year","Semester","Session","Batch","Type"].map(h =>
                    <TableHead key={h} className="text-[0.75rem] whitespace-nowrap">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0
                  ? <TableRow><TableCell colSpan={10} className="text-center text-[0.8rem] text-muted-foreground py-10">No students found. Import via Excel or add manually.</TableCell></TableRow>
                  : paged.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-[0.78rem] font-mono font-semibold">{s.roll_number || s.rollNumber}</TableCell>
                      <TableCell className="text-[0.78rem]">{s.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[0.65rem]">{s.school}</Badge></TableCell>
                      <TableCell className="text-[0.78rem]">{s.department}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[0.65rem] font-mono">{s.branch}</Badge></TableCell>
                      <TableCell className="text-[0.78rem]">{s.year}</TableCell>
                      <TableCell className="text-[0.78rem] font-mono">{SEM_ROMAN[s.semester] || s.semester}</TableCell>
                      <TableCell className="text-[0.78rem]">{s.session}</TableCell>
                      <TableCell className="text-[0.78rem]">{s.batch}</TableCell>
                      <TableCell>
                        <Badge className={`text-[0.65rem] ${s.type === 'repeater' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {s.type === 'repeater' ? 'Repeater' : 'Regular'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-[0.75rem] text-muted-foreground">
                Showing {page * pageSize + 1}–{Math.min((page+1)*pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page===0} onClick={()=>setPage(p=>p-1)} className="text-[0.75rem] h-7">Previous</Button>
                <Button variant="outline" size="sm" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)} className="text-[0.75rem] h-7">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Fill in the student details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">Roll Number</Label>
                <Input value={formData.rollNumber} onChange={e=>set("rollNumber",e.target.value)} placeholder="e.g. 235UCS026" className="text-[0.85rem] font-mono" />
              </div>
              <div>
                <Label className="text-[0.8rem]">Full Name</Label>
                <Input value={formData.name} onChange={e=>set("name",e.target.value)} placeholder="Student name" className="text-[0.85rem]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[0.8rem]">School</Label>
                <Select value={formData.school} onValueChange={v => setFormData(p => ({ ...p, school: v, department: (SCHOOL_DEPT[v]||[])[0]||"", branch: (DEPT_BRANCH[(SCHOOL_DEPT[v]||[])[0]]||[])[0]||"" }))}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{SCHOOLS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Department</Label>
                <Select value={formData.department} onValueChange={v => setFormData(p => ({ ...p, department: v, branch: (DEPT_BRANCH[v]||[])[0]||"" }))}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(SCHOOL_DEPT[formData.school]||Object.keys(DEPT_BRANCH)).map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Branch</Label>
                <Select value={formData.branch} onValueChange={v=>set("branch",v)}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(DEPT_BRANCH[formData.department]||ALL_BRANCHES).map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">Year</Label>
                <Select value={formData.year} onValueChange={v=>set("year",v)}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y=><SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Semester</Label>
                <Select value={String(formData.semester)} onValueChange={v=>set("semester",Number(v))}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(s=><SelectItem key={s} value={String(s)}>Sem {s} ({SEM_ROMAN[s]})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">Session (Academic Year)</Label>
                <Select value={formData.session} onValueChange={v=>set("session",v)}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{SESSIONS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Batch (Programme Duration)</Label>
                <Select value={formData.batch} onValueChange={v=>set("batch",v)}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{BATCHES.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[0.8rem]">Student Type</Label>
              <Select value={formData.type} onValueChange={v=>set("type",v)}>
                <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="repeater">Repeater</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Preview — {preview.length} rows ({validCount} valid)</DialogTitle>
            <DialogDescription>Review before importing. Existing roll numbers will be updated.</DialogDescription>
          </DialogHeader>
          {errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-[0.78rem] text-amber-800">
              <p className="font-medium flex items-center gap-1 mb-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.length} row(s) will be skipped:</p>
              {errors.slice(0,5).map((e,i)=><p key={i}>{e}</p>)}
              {errors.length > 5 && <p>...and {errors.length-5} more</p>}
            </div>
          )}
          <div className="overflow-auto flex-1 border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Roll No","Name","School","Dept","Branch","Sem","Year","Session","Batch","Type","Status"].map(h=>
                    <TableHead key={h} className="text-[0.72rem] whitespace-nowrap">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((s,i)=>{
                  const valid = s.rollNumber && s.name && s.school && s.department && s.branch && s.semester && s.session;
                  return (
                    <TableRow key={i} className={valid?"":"opacity-40"}>
                      <TableCell className="text-[0.72rem] font-mono">{s.rollNumber}</TableCell>
                      <TableCell className="text-[0.72rem]">{s.name}</TableCell>
                      <TableCell className="text-[0.72rem]">{s.school}</TableCell>
                      <TableCell className="text-[0.72rem]">{s.department}</TableCell>
                      <TableCell className="text-[0.72rem]">{s.branch}</TableCell>
                      <TableCell className="text-[0.72rem]">{s.semester}</TableCell>
                      <TableCell className="text-[0.72rem]">{s.year}</TableCell>
                      <TableCell className="text-[0.72rem]">{s.session}</TableCell>
                      <TableCell className="text-[0.72rem]">{s.batch}</TableCell>
                      <TableCell>
                        <Badge className={`text-[0.65rem] ${s.type==='repeater'?'bg-orange-100 text-orange-700':'bg-green-100 text-green-700'}`}>
                          {s.type||'regular'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {valid
                          ? <Badge className="bg-green-100 text-green-700 text-[0.65rem]"><CheckCircle2 className="w-3 h-3 mr-1"/>OK</Badge>
                          : <Badge variant="destructive" className="text-[0.65rem]"><AlertCircle className="w-3 h-3 mr-1"/>Skip</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading||validCount===0}>
              <Upload className="w-4 h-4 mr-1" />
              {uploading ? "Importing..." : `Import ${validCount} Students`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentManagement;
