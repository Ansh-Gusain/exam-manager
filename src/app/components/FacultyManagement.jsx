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
import { Textarea } from "./ui/textarea";
import { Search, Plus, Upload, Download, X, CalendarOff, CheckCircle } from "lucide-react";

const SCHOOLS = ["SOICT","SOM","SOE","SOLGJ","SOHSS","SOVSAS"];
const SCHOOL_DEPT = {
  "SOICT":  ["Computer Science","Information Technology","Electronics"],
  "SOM":    ["Management","Business Administration"],
  "SOE":    ["Mechanical Engineering","Civil Engineering","Chemical Engineering"],
  "SOLGJ":  ["Law"],
  "SOHSS":  ["Humanities","Social Sciences","Psychology"],
  "SOVSAS": ["Visual Arts","Performing Arts"],
};
const DESIGNATIONS = ["Professor","Associate Professor","Assistant Professor","Lecturer","Lab Instructor"];

const STATUS_BADGE = {
  available:     "bg-green-100 text-green-700",
  on_leave:      "bg-amber-100 text-amber-700",
  not_available: "bg-red-100 text-red-700",
};
const STATUS_LABEL = {
  available:     "Available",
  on_leave:      "On Leave",
  not_available: "Not Available",
};

const EMPTY_FORM = {
  phone:"", name:"", school:"SOICT", department:"Computer Science",
  designation:"Assistant Professor", email:"", status:"available"
};

export function FacultyManagement() {
  const { faculty, setFaculty, refreshFaculty, invigilationAllocations } = useStore();
  const fileRef = useRef(null);

  const [search,       setSearch]       = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [deptFilter,   setDeptFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,         setPage]         = useState(0);
  const pageSize = 20;

  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [formData,     setFormData]     = useState(EMPTY_FORM);

  const [leaveOpen,    setLeaveOpen]    = useState(false);
  const [leaveTarget,  setLeaveTarget]  = useState(null);
  const [leaveStatus,  setLeaveStatus]  = useState("on_leave");
  const [leaveReason,  setLeaveReason]  = useState("");

  const [uploadOpen,   setUploadOpen]   = useState(false);
  const [preview,      setPreview]      = useState([]);
  const [uploading,    setUploading]    = useState(false);

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const availableDepts = useMemo(() =>
    schoolFilter === "all" ? Object.values(SCHOOL_DEPT).flat() : (SCHOOL_DEPT[schoolFilter] || []),
    [schoolFilter]
  );

  // Compute actual duty counts from live invigilation allocations (not stale stored counter)
  const dutyCount = useMemo(() => {
    const map = {};
    for (const ia of invigilationAllocations) {
      map[String(ia.facultyId)] = (map[String(ia.facultyId)] || 0) + 1;
    }
    return map;
  }, [invigilationAllocations]);

  const filtered = useMemo(() => faculty.filter(f => {
    const q = search.toLowerCase();
    return (f.name?.toLowerCase().includes(q) || f.phone?.includes(q)) &&
      (schoolFilter === "all" || f.school      === schoolFilter) &&
      (deptFilter   === "all" || f.department  === deptFilter) &&
      (statusFilter === "all" || f.status      === statusFilter);
  }).sort((a,b) => a.name?.localeCompare(b.name)),
  [faculty, search, schoolFilter, deptFilter, statusFilter]);

  const paged      = filtered.slice(page * pageSize, (page+1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const clearFilters = () => { setSearch(""); setSchoolFilter("all"); setDeptFilter("all"); setStatusFilter("all"); setPage(0); };
  const hasFilters = search || schoolFilter !== "all" || deptFilter !== "all" || statusFilter !== "all";

  // Add faculty
  const handleAdd = async () => {
    if (!formData.phone || !formData.name) { toast.error("Phone and name are required"); return; }
    try {
      const created = await api.faculty.create(formData);
      setFaculty(prev => [...prev, created]);
      setDialogOpen(false);
      setFormData(EMPTY_FORM);
      toast.success("Faculty added");
    } catch (err) { toast.error(err.message || "Failed to add faculty"); }
  };

  // Set leave status
  const handleLeave = async () => {
    if (!leaveTarget) return;
    try {
      await api.faculty.setLeave(leaveTarget.id, leaveStatus, leaveReason);
      await refreshFaculty();
      toast.success(`${leaveTarget.name} status updated to "${STATUS_LABEL[leaveStatus]}"`);
      setLeaveOpen(false);
      setLeaveTarget(null);
      setLeaveReason("");
    } catch (err) { toast.error(err.message || "Failed to update status"); }
  };

  // Excel upload
  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const wb = XLSX.read(evt.target.result, { type:"binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval:"" });
      const parsed = rows.map(row => ({
        phone:       String(row['Phone'] || row['phone'] || "").trim(),
        name:        String(row['Name'] || row['name'] || "").trim(),
        school:      String(row['School'] || row['school'] || "SOICT").trim(),
        department:  String(row['Department'] || row['department'] || "").trim(),
        designation: String(row['Designation'] || row['designation'] || "Assistant Professor").trim(),
        email:       String(row['Email'] || row['email'] || "").trim(),
        status:      "available",
      }));
      setPreview(parsed);
      setUploadOpen(true);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleUpload = async () => {
    const valid = preview.filter(f => f.phone && f.name);
    if (!valid.length) return;
    setUploading(true);
    try {
      const res = await api.faculty.bulk(valid);
      await refreshFaculty();
      toast.success(`${res.count ?? valid.length} faculty imported`);
      setUploadOpen(false); setPreview([]);
    } catch (err) { toast.error(err.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Phone","Name","School","Department","Designation","Email"],
      ["9876543210","Dr. Rajesh Sharma","SOICT","Computer Science","Professor","rajesh@gbu.ac.in"],
      ["9876543211","Dr. Priya Verma","SOICT","Information Technology","Associate Professor","priya@gbu.ac.in"],
    ]);
    ws["!cols"] = [12,22,8,22,22,26].map(w=>({wch:w}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty");
    XLSX.writeFile(wb, "faculty_template.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1>Faculty Management</h1>
          <p className="text-[0.8rem] text-muted-foreground">{faculty.length} total · {filtered.length} shown</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="w-4 h-4 mr-1" /> Template</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-1" /> Import Excel</Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          <Button size="sm" onClick={() => { setFormData(EMPTY_FORM); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add Faculty</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 px-4 space-y-3">
          {/* Search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or phone..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-10 text-[0.85rem]" />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-[0.8rem]">
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Filter row 1: School + Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[0.75rem] text-muted-foreground mb-1 block">School</Label>
              <Select value={schoolFilter} onValueChange={v => { setSchoolFilter(v); setDeptFilter("all"); setPage(0); }}>
                <SelectTrigger className="h-10 text-[0.85rem]"><SelectValue placeholder="All Schools" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[0.75rem] text-muted-foreground mb-1 block">Department</Label>
              <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setPage(0); }}>
                <SelectTrigger className="h-10 text-[0.85rem]"><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {availableDepts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter row 2: Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-[0.75rem] text-muted-foreground mb-1 block">Status</Label>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="h-10 text-[0.85rem]"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="not_available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  {["Phone","Name","School","Department","Designation","Email","Status","Duties","Action"].map(h =>
                    <TableHead key={h} className="text-[0.75rem] whitespace-nowrap">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0
                  ? <TableRow><TableCell colSpan={9} className="text-center text-[0.8rem] text-muted-foreground py-10">No faculty found.</TableCell></TableRow>
                  : paged.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="text-[0.78rem] font-mono">{f.phone}</TableCell>
                      <TableCell className="text-[0.78rem] font-medium">{f.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[0.65rem]">{f.school}</Badge></TableCell>
                      <TableCell className="text-[0.78rem]">{f.department}</TableCell>
                      <TableCell className="text-[0.78rem]">{f.designation}</TableCell>
                      <TableCell className="text-[0.75rem] text-muted-foreground">{f.email}</TableCell>
                      <TableCell>
                        <div>
                          <Badge className={`text-[0.65rem] ${STATUS_BADGE[f.status] || STATUS_BADGE.available}`}>
                            {STATUS_LABEL[f.status] || "Available"}
                          </Badge>
                          {f.leave_reason && (
                            <p className="text-[0.65rem] text-muted-foreground mt-0.5 max-w-[120px] truncate" title={f.leave_reason}>{f.leave_reason}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[0.78rem] font-mono font-semibold">{dutyCount[String(f.id)] || 0}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => { setLeaveTarget(f); setLeaveStatus(f.status === 'available' ? 'on_leave' : 'available'); setLeaveReason(f.leave_reason || ""); setLeaveOpen(true); }}
                          className="flex items-center gap-1 px-2 py-1 rounded border border-border hover:bg-accent text-[0.72rem] text-muted-foreground"
                        >
                          {f.status === 'available' ? <CalendarOff className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {f.status === 'available' ? 'Leave' : 'Restore'}
                        </button>
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

      {/* Add Faculty Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Faculty</DialogTitle>
            <DialogDescription>Phone number is the unique identifier.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">Phone (10-digit)</Label>
                <Input value={formData.phone} onChange={e=>set("phone",e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="9876543210" className="text-[0.85rem] font-mono" />
              </div>
              <div>
                <Label className="text-[0.8rem]">Full Name</Label>
                <Input value={formData.name} onChange={e=>set("name",e.target.value)} placeholder="Dr. Full Name" className="text-[0.85rem]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">School</Label>
                <Select value={formData.school} onValueChange={v => setFormData(p => ({ ...p, school: v, department: (SCHOOL_DEPT[v]||[])[0]||"" }))}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{SCHOOLS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Department</Label>
                <Select value={formData.department} onValueChange={v=>set("department",v)}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(SCHOOL_DEPT[formData.school]||[]).map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">Designation</Label>
                <Select value={formData.designation} onValueChange={v=>set("designation",v)}>
                  <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>{DESIGNATIONS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[0.8rem]">Email</Label>
                <Input value={formData.email} onChange={e=>set("email",e.target.value)} placeholder="email@gbu.ac.in" className="text-[0.85rem]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Faculty</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave / Status Dialog */}
      <Dialog open={leaveOpen} onOpenChange={open => { if (!open) { setLeaveTarget(null); setLeaveReason(""); } setLeaveOpen(open); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Status — {leaveTarget?.name}</DialogTitle>
            <DialogDescription>Change availability status and provide a reason if needed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[0.8rem]">Status</Label>
              <Select value={leaveStatus} onValueChange={setLeaveStatus}>
                <SelectTrigger className="text-[0.85rem]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="not_available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {leaveStatus !== "available" && (
              <div>
                <Label className="text-[0.8rem]">Reason</Label>
                <Textarea value={leaveReason} onChange={e=>setLeaveReason(e.target.value)} placeholder="e.g. Medical leave, Conference, Personal..." className="text-[0.85rem]" rows={3} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setLeaveOpen(false)}>Cancel</Button>
            <Button onClick={handleLeave}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Preview — {preview.length} rows</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1 border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Phone","Name","School","Department","Designation","Email"].map(h=>
                    <TableHead key={h} className="text-[0.72rem]">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((f,i)=>(
                  <TableRow key={i} className={f.phone && f.name ? "" : "opacity-40"}>
                    <TableCell className="text-[0.72rem] font-mono">{f.phone}</TableCell>
                    <TableCell className="text-[0.72rem]">{f.name}</TableCell>
                    <TableCell className="text-[0.72rem]">{f.school}</TableCell>
                    <TableCell className="text-[0.72rem]">{f.department}</TableCell>
                    <TableCell className="text-[0.72rem]">{f.designation}</TableCell>
                    <TableCell className="text-[0.72rem]">{f.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading||preview.length===0}>
              <Upload className="w-4 h-4 mr-1" />{uploading ? "Importing..." : `Import ${preview.filter(f=>f.phone&&f.name).length} Faculty`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FacultyManagement;
