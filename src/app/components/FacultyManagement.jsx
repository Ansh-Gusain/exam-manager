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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "./ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "./ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "./ui/select";
import { Search, Plus, Upload, Download, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const DESIGNATIONS = [
  "Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Lab Instructor"
];

const EMPTY_FORM = {
  employeeId: "", name: "", school: "SOICT", department: "CSE",
  branch: "CSE", designation: "Assistant Professor", email: "", phone: ""
};

// ── Download sample Excel template ──────────────────────────────────────────
function downloadTemplate() {
  const headers = [["Employee ID", "Name", "School", "Department", "Branch", "Designation", "Email", "Phone"]];
  const sample = [
    ["EMP001", "Dr. Rajesh Kumar", "SOICT", "Computer Science", "CSE", "Professor", "rajesh@gbu.ac.in", "9876543210"],
    ["EMP002", "Dr. Priya Sharma", "SOICT", "Computer Science", "AI",  "Associate Professor", "priya@gbu.ac.in", "9876543211"],
    ["EMP003", "Mr. Amit Singh",   "SOICT", "Electronics",      "ECE", "Assistant Professor", "amit@gbu.ac.in",  "9876543212"],
  ];
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...sample]);
  ws["!cols"] = [14,22,8,20,8,22,26,14].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Faculty");
  XLSX.writeFile(wb, "faculty_template.xlsx");
}

// ── Parse uploaded Excel file ────────────────────────────────────────────────
function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: "binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (rows.length < 2) { reject(new Error("File is empty")); return; }

        // Skip header row
        const data = rows.slice(1).filter(r => r.some(c => c !== "")).map((r, i) => ({
          employeeId:  String(r[0] || "").trim(),
          name:        String(r[1] || "").trim(),
          school:      String(r[2] || "SOICT").trim(),
          department:  String(r[3] || "").trim(),
          branch:      String(r[4] || "").trim(),
          designation: String(r[5] || "Assistant Professor").trim(),
          email:       String(r[6] || "").trim(),
          phone:       String(r[7] || "").trim(),
          _row:        i + 2,
        }));
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
}

export function FacultyManagement() {
  const { faculty, setFaculty, refreshFaculty } = useStore();
  const [search, setSearch]         = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [page, setPage]             = useState(0);

  // Upload state
  const [preview, setPreview]       = useState([]);   // parsed rows
  const [errors, setErrors]         = useState([]);   // validation errors
  const [uploading, setUploading]   = useState(false);
  const fileRef = useRef(null);
  const pageSize = 15;

  const filtered = useMemo(() =>
    faculty.filter(f =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      f.department?.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.employeeId?.localeCompare(b.employeeId)),
    [faculty, search]
  );

  const paged      = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  // ── Single add ──────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!formData.employeeId || !formData.name) {
      toast.error("Employee ID and Name are required");
      return;
    }
    try {
      const created = await api.faculty.create({ ...formData, totalDuties: 0, isAvailable: true });
      setFaculty(prev => [...prev, created]);
      setDialogOpen(false);
      setFormData(EMPTY_FORM);
      toast.success("Faculty added");
    } catch (err) {
      toast.error(err.message || "Failed to add faculty");
    }
  };

  // ── File selected ────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcel(file);
      // Validate
      const errs = [];
      rows.forEach((r, i) => {
        if (!r.employeeId) errs.push(`Row ${r._row}: Employee ID is missing`);
        if (!r.name)       errs.push(`Row ${r._row}: Name is missing`);
        if (!r.department) errs.push(`Row ${r._row}: Department is missing`);
      });
      setPreview(rows);
      setErrors(errs);
    } catch (err) {
      toast.error(err.message || "Failed to parse file");
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  // ── Bulk submit ──────────────────────────────────────────────────────────
  const handleBulkUpload = async () => {
    if (preview.length === 0) return;
    setUploading(true);
    try {
      const payload = preview.map(({ _row, ...r }) => ({
        ...r,
        email:       r.email || `${r.employeeId.toLowerCase()}@gbu.ac.in`,
        totalDuties: 0,
        isAvailable: true,
      }));
      const res = await api.faculty.bulk(payload);
      await refreshFaculty();
      toast.success(`${res.count ?? payload.length} faculty imported successfully`);
      setUploadOpen(false);
      setPreview([]);
      setErrors([]);
    } catch (err) {
      toast.error(err.message || "Bulk upload failed");
    } finally {
      setUploading(false);
    }
  };

  const openUpload = () => {
    setPreview([]);
    setErrors([]);
    setUploadOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1>Faculty Management</h1>
          <p className="text-[0.8rem] text-muted-foreground">{faculty.length} faculty members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openUpload}>
            <Upload className="w-4 h-4 mr-1" /> Bulk Upload Excel
          </Button>
          <Button size="sm" onClick={() => { setFormData(EMPTY_FORM); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Faculty
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, employee ID or department..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 h-9 text-[0.85rem]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
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
                  <TableHead className="text-[0.75rem]">Employee ID</TableHead>
                  <TableHead className="text-[0.75rem]">Name</TableHead>
                  <TableHead className="text-[0.75rem]">School</TableHead>
                  <TableHead className="text-[0.75rem]">Department</TableHead>
                  <TableHead className="text-[0.75rem]">Branch</TableHead>
                  <TableHead className="text-[0.75rem]">Designation</TableHead>
                  <TableHead className="text-[0.75rem]">Email</TableHead>
                  <TableHead className="text-[0.75rem]">Duties</TableHead>
                  <TableHead className="text-[0.75rem]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-[0.8rem] text-muted-foreground py-12">
                      No faculty records. Use "Bulk Upload Excel" to import faculty data.
                    </TableCell>
                  </TableRow>
                ) : paged.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="text-[0.78rem] font-mono">{f.employeeId}</TableCell>
                    <TableCell className="text-[0.78rem] font-medium">{f.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[0.68rem]">{f.school}</Badge></TableCell>
                    <TableCell className="text-[0.78rem]">{f.department}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[0.68rem]">{f.branch}</Badge></TableCell>
                    <TableCell className="text-[0.78rem]">{f.designation}</TableCell>
                    <TableCell className="text-[0.78rem] text-muted-foreground">{f.email}</TableCell>
                    <TableCell className="text-[0.78rem]">{f.totalDuties ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={f.isAvailable ? "default" : "destructive"} className="text-[0.65rem]">
                        {f.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-[0.75rem] text-muted-foreground">
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-[0.75rem] h-7">Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="text-[0.75rem] h-7">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Single Add Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Faculty</DialogTitle>
            <DialogDescription>Enter faculty details manually.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">Employee ID</Label>
                <Input value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} placeholder="e.g. EMP001" className="text-[0.85rem]" />
              </div>
              <div>
                <Label className="text-[0.8rem]">Full Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Dr. Full Name" className="text-[0.85rem]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[0.8rem]">School</Label>
                <Input value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="text-[0.85rem]" />
              </div>
              <div>
                <Label className="text-[0.8rem]">Department</Label>
                <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="text-[0.85rem]" />
              </div>
              <div>
                <Label className="text-[0.8rem]">Branch</Label>
                <Input value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="text-[0.85rem]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[0.8rem]">Designation</Label>
                <Select value={formData.designation} onValueChange={v => setFormData({...formData, designation: v})}>
                  <SelectTrigger className="text-[0.8rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DESIGNATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Email</Label>
                <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@gbu.ac.in" className="text-[0.85rem]" />
              </div>
              <div>
                <Label className="text-[0.8rem]">Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" className="text-[0.85rem]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Faculty</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Upload Dialog ── */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload Faculty via Excel</DialogTitle>
            <DialogDescription>
              Upload an Excel file (.xlsx / .xls) with faculty data. Download the template to see the required format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step 1: Download template */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-[0.8rem] font-semibold mb-2">Step 1 — Download Template</p>
              <p className="text-[0.75rem] text-muted-foreground mb-3">
                The Excel file must have these columns in order:
                <span className="font-mono ml-1 text-primary">Employee ID, Name, School, Department, Branch, Designation, Email, Phone</span>
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-1" /> Download Sample Template
              </Button>
            </div>

            {/* Step 2: Upload file */}
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
              <p className="text-[0.8rem] font-semibold mb-2">Step 2 — Upload Your File</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" /> Choose Excel File
              </Button>
              {preview.length > 0 && (
                <p className="text-[0.75rem] text-green-600 mt-2 font-medium">
                  ✓ {preview.length} rows loaded
                </p>
              )}
            </div>

            {/* Validation errors */}
            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 space-y-1">
                <p className="text-[0.8rem] font-semibold text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.length} validation error{errors.length !== 1 ? "s" : ""}
                </p>
                {errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-[0.75rem] text-destructive">{e}</p>
                ))}
                {errors.length > 5 && <p className="text-[0.75rem] text-muted-foreground">...and {errors.length - 5} more</p>}
              </div>
            )}

            {/* Preview table */}
            {preview.length > 0 && (
              <div>
                <p className="text-[0.8rem] font-semibold mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Preview (first 5 rows)
                </p>
                <div className="overflow-x-auto rounded border border-border">
                  <table className="w-full text-[0.72rem] border-collapse">
                    <thead>
                      <tr className="bg-muted/60">
                        {["Employee ID","Name","School","Department","Branch","Designation","Email","Phone"].map(h => (
                          <th key={h} className="border border-border px-2 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 5).map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="border border-border px-2 py-1 font-mono">{r.employeeId}</td>
                          <td className="border border-border px-2 py-1">{r.name}</td>
                          <td className="border border-border px-2 py-1">{r.school}</td>
                          <td className="border border-border px-2 py-1">{r.department}</td>
                          <td className="border border-border px-2 py-1">{r.branch}</td>
                          <td className="border border-border px-2 py-1">{r.designation}</td>
                          <td className="border border-border px-2 py-1">{r.email}</td>
                          <td className="border border-border px-2 py-1">{r.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.length > 5 && (
                  <p className="text-[0.72rem] text-muted-foreground mt-1">...and {preview.length - 5} more rows</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkUpload}
              disabled={preview.length === 0 || errors.length > 0 || uploading}
            >
              {uploading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Uploading...</> : `Upload ${preview.length} Faculty`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FacultyManagement;
