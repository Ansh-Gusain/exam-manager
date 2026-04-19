import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useStore } from "../lib/store";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "./ui/dialog";
import {
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  User
} from "lucide-react";
import { toast } from "sonner";
function ReplacementManagement() {
  const {
    exams,
    rooms,
    faculty,
    invigilationAllocations,
    replacementLogs,
    setReplacementLogs,
    setInvigilationAllocations
  } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    examId: "",
    roomId: "",
    originalFacultyId: "",
    reason: ""
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = replacementLogs.filter(
    (r) => statusFilter === "all" || r.status === statusFilter
  );
  const pendingCount = replacementLogs.filter((r) => r.status === "pending").length;
  const openRequest = () => {
    setFormData({ examId: "", roomId: "", originalFacultyId: "", reason: "" });
    setDialogOpen(true);
  };
  const handleRequest = () => {
    if (!formData.examId || !formData.originalFacultyId || !formData.reason) return;
    const newLog = {
      id: `rep-${Date.now()}`,
      examId: formData.examId,
      roomId: formData.roomId,
      originalFacultyId: formData.originalFacultyId,
      replacementFacultyId: "",
      reason: formData.reason,
      status: "pending",
      requestedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    setReplacementLogs((prev) => [...prev, newLog]);
    setDialogOpen(false);
    toast.success("Replacement request submitted.");
  };
  const handleApprove = (logId) => {
    const log = replacementLogs.find((r) => r.id === logId);
    if (!log) return;
    const availableFaculty = faculty.filter(
      (f) => f.isAvailable && f.id !== log.originalFacultyId && !invigilationAllocations.some(
        (ia) => ia.examId === log.examId && ia.facultyId === f.id
      )
    );
    if (availableFaculty.length === 0) {
      toast.error("No available faculty for replacement.");
      return;
    }
    const replacement = availableFaculty.sort(
      (a, b) => a.totalDuties - b.totalDuties
    )[0];
    setReplacementLogs(
      (prev) => prev.map(
        (r) => r.id === logId ? {
          ...r,
          status: "approved",
          replacementFacultyId: replacement.id,
          approvedAt: (/* @__PURE__ */ new Date()).toISOString()
        } : r
      )
    );
    setInvigilationAllocations(
      (prev) => prev.map(
        (ia) => ia.examId === log.examId && ia.roomId === log.roomId && ia.facultyId === log.originalFacultyId ? { ...ia, facultyId: replacement.id } : ia
      )
    );
    toast.success(`Approved. ${replacement.name} assigned as replacement.`);
  };
  const handleReject = (logId) => {
    setReplacementLogs(
      (prev) => prev.map((r) => r.id === logId ? { ...r, status: "rejected" } : r)
    );
    toast.success("Replacement request rejected.");
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", { children: "Replacement Management" }) }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: openRequest, children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-1" }),
        " New Request"
      ] })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-3 px-4", children: /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
      /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[160px] h-9 text-[0.85rem]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter status" }) }),
      /* @__PURE__ */ jsxs(SelectContent, { children: [
        /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Statuses" }),
        /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Pending" }),
        /* @__PURE__ */ jsx(SelectItem, { value: "approved", children: "Approved" }),
        /* @__PURE__ */ jsx(SelectItem, { value: "rejected", children: "Rejected" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Exam" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Original Faculty" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Replacement" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Reason" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Requested" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-[0.75rem]", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: filtered.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 7, className: "text-center text-muted-foreground text-[0.85rem] py-8", children: "No replacement requests found." }) }) : filtered.map((log) => {
        const exam = exams.find((e) => e.id === log.examId);
        const origFac = faculty.find(
          (f) => f.id === log.originalFacultyId
        );
        const repFac = faculty.find(
          (f) => f.id === log.replacementFacultyId
        );
        return /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxs(TableCell, { className: "text-[0.8rem]", children: [
            exam?.subject || "\u2014",
            /* @__PURE__ */ jsx("span", { className: "block text-[0.7rem] text-muted-foreground", children: exam?.date })
          ] }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem]", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(User, { className: "w-3 h-3 text-muted-foreground" }),
            origFac?.name || "\u2014"
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem]", children: repFac ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3 text-green-600" }),
            repFac.name
          ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "\u2014" }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-[0.8rem] max-w-[200px] truncate", children: log.reason }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-[0.75rem] text-muted-foreground", children: new Date(log.requestedAt).toLocaleString() }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
            Badge,
            {
              className: `text-[0.7rem] ${log.status === "approved" ? "bg-green-100 text-green-700" : log.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`,
              children: [
                log.status === "approved" && /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 mr-1" }),
                log.status === "pending" && /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 mr-1" }),
                log.status === "rejected" && /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3 mr-1" }),
                log.status
              ]
            }
          ) }),
          /* @__PURE__ */ jsx(TableCell, { children: log.status === "pending" && /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "sm",
                className: "h-6 px-2 text-[0.7rem]",
                onClick: () => handleApprove(log.id),
                children: "Approve"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "sm",
                variant: "outline",
                className: "h-6 px-2 text-[0.7rem]",
                onClick: () => handleReject(log.id),
                children: "Reject"
              }
            )
          ] }) })
        ] }, log.id);
      }) })
    ] }) }) }) }),
    /* @__PURE__ */ jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Request Invigilator Replacement" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Please provide the details for the replacement request." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[0.8rem]", children: "Exam" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.examId,
              onValueChange: (v) => setFormData({ ...formData, examId: v }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "text-[0.85rem]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select exam" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: exams.filter((e) => e.status === "scheduled").map((exam) => /* @__PURE__ */ jsxs(SelectItem, { value: exam.id, children: [
                  exam.subject,
                  " \u2014 ",
                  exam.date
                ] }, exam.id)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[0.8rem]", children: "Faculty to Replace" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.originalFacultyId,
              onValueChange: (v) => setFormData({ ...formData, originalFacultyId: v }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "text-[0.85rem]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select faculty" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: faculty.map((f) => /* @__PURE__ */ jsxs(SelectItem, { value: f.id, children: [
                  f.name,
                  " (",
                  f.department,
                  ")"
                ] }, f.id)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[0.8rem]", children: "Reason" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: formData.reason,
              onChange: (e) => setFormData({ ...formData, reason: e.target.value }),
              placeholder: "Reason for replacement...",
              className: "text-[0.85rem]",
              rows: 3
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDialogOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: handleRequest, children: "Submit Request" })
      ] })
    ] }) })
  ] });
}
export {
  ReplacementManagement
};
