import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  School,
  BookOpen,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Building2,
  User,
  Clock,
  Award,
  FlaskConical,
  FolderOpen,
  Layers,
  ArrowLeft
} from "lucide-react";
import { Button } from "./ui/button";
import { schools } from "../lib/academic-data";
const typeColors = {
  core: "bg-blue-100 text-blue-700",
  elective: "bg-amber-100 text-amber-700",
  lab: "bg-green-100 text-green-700",
  project: "bg-purple-100 text-purple-700"
};
const typeLabels = {
  core: "Core",
  elective: "Elective",
  lab: "Lab",
  project: "Project"
};
function CourseTable({ courses, semLabel }) {
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  return /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-accent/50 px-4 py-2 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[0.8rem] font-medium", children: semLabel }),
      /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[0.65rem]", children: [
        totalCredits,
        " Credits \u2022 ",
        courses.length,
        " Courses"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-[0.8rem]", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/30", children: [
        /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Code" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Course Name" }),
        /* @__PURE__ */ jsx("th", { className: "text-center px-4 py-2 font-medium text-muted-foreground", children: "Credits" }),
        /* @__PURE__ */ jsx("th", { className: "text-center px-4 py-2 font-medium text-muted-foreground", children: "Type" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: courses.map((course) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-border last:border-0 hover:bg-accent/30 transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2 font-mono text-[0.75rem]", children: course.code }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: course.name }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-center font-medium", children: course.credits }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-center", children: /* @__PURE__ */ jsx(Badge, { className: `text-[0.6rem] ${typeColors[course.type]}`, children: typeLabels[course.type] }) })
      ] }, course.code)) })
    ] }) })
  ] });
}
function YearView({ year, programmeShortName }) {
  const [expanded, setExpanded] = useState(false);
  const allCourses = [...year.semester1, ...year.semester2];
  const totalCredits = allCourses.reduce((sum, c) => sum + c.credits, 0);
  return /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg overflow-hidden", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setExpanded(!expanded),
        className: "w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center", children: /* @__PURE__ */ jsx(Layers, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-[0.85rem] font-medium", children: [
                "Year ",
                year.year
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-[0.7rem] text-muted-foreground", children: [
                "Semester ",
                year.year * 2 - 1,
                " & ",
                year.year * 2,
                " \u2022 ",
                allCourses.length,
                " Courses \u2022 ",
                totalCredits,
                " Credits"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex gap-1", children: [
              /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[0.6rem]", children: [
                year.semester1.length,
                " courses in Sem ",
                year.year * 2 - 1
              ] }),
              /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[0.6rem]", children: [
                year.semester2.length,
                " courses in Sem ",
                year.year * 2
              ] })
            ] }),
            expanded ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 text-muted-foreground" })
          ] })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxs("div", { className: "p-4 pt-0 space-y-4", children: [
      /* @__PURE__ */ jsx(
        CourseTable,
        {
          courses: year.semester1,
          semLabel: `Semester ${year.year * 2 - 1}`
        }
      ),
      /* @__PURE__ */ jsx(
        CourseTable,
        {
          courses: year.semester2,
          semLabel: `Semester ${year.year * 2}`
        }
      )
    ] })
  ] });
}
function ProgrammeView({ programme, onBack }) {
  const allCourses = programme.curriculum.flatMap((y) => [...y.semester1, ...y.semester2]);
  const coreCount = allCourses.filter((c) => c.type === "core").length;
  const electiveCount = allCourses.filter((c) => c.type === "elective").length;
  const labCount = allCourses.filter((c) => c.type === "lab").length;
  const projectCount = allCourses.filter((c) => c.type === "project").length;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "text-[0.8rem] -ml-2", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-1" }),
      " Back to Programmes"
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-[1rem]", children: programme.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-[0.8rem] text-muted-foreground mt-1", children: [
            programme.degree,
            " \u2022 ",
            programme.duration,
            " Year",
            programme.duration > 1 ? "s" : "",
            " Programme"
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Badge, { className: "text-[0.7rem] bg-indigo-100 text-indigo-700 shrink-0", children: [
          programme.totalCredits,
          " Total Credits"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2.5 rounded-lg bg-blue-50", children: [
            /* @__PURE__ */ jsx(BookOpen, { className: "w-4 h-4 text-blue-600" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[0.85rem] font-semibold text-blue-700", children: coreCount }),
              /* @__PURE__ */ jsx("p", { className: "text-[0.65rem] text-blue-600", children: "Core Courses" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2.5 rounded-lg bg-amber-50", children: [
            /* @__PURE__ */ jsx(FolderOpen, { className: "w-4 h-4 text-amber-600" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[0.85rem] font-semibold text-amber-700", children: electiveCount }),
              /* @__PURE__ */ jsx("p", { className: "text-[0.65rem] text-amber-600", children: "Electives" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2.5 rounded-lg bg-green-50", children: [
            /* @__PURE__ */ jsx(FlaskConical, { className: "w-4 h-4 text-green-600" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[0.85rem] font-semibold text-green-700", children: labCount }),
              /* @__PURE__ */ jsx("p", { className: "text-[0.65rem] text-green-600", children: "Lab Courses" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2.5 rounded-lg bg-purple-50", children: [
            /* @__PURE__ */ jsx(Award, { className: "w-4 h-4 text-purple-600" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[0.85rem] font-semibold text-purple-700", children: projectCount }),
              /* @__PURE__ */ jsx("p", { className: "text-[0.65rem] text-purple-600", children: "Projects" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: programme.curriculum.map((year) => /* @__PURE__ */ jsx(YearView, { year, programmeShortName: programme.shortName }, year.year)) })
      ] })
    ] })
  ] });
}
function AcademicStructure() {
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedProgramme, setSelectedProgramme] = useState(null);
  if (selectedProgramme && selectedSchool && selectedBranch) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { children: "Academic Structure" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[0.75rem] text-muted-foreground mt-1 flex-wrap", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setSelectedSchool(null);
            setSelectedBranch(null);
            setSelectedProgramme(null);
          }, className: "hover:text-foreground transition-colors", children: "Schools" }),
          /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setSelectedBranch(null);
            setSelectedProgramme(null);
          }, className: "hover:text-foreground transition-colors", children: selectedSchool.shortName }),
          /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setSelectedProgramme(null), className: "hover:text-foreground transition-colors", children: selectedBranch.shortName }),
          /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
          /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: selectedProgramme.shortName })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        ProgrammeView,
        {
          programme: selectedProgramme,
          onBack: () => setSelectedProgramme(null)
        }
      )
    ] });
  }
  if (selectedSchool) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { children: "Academic Structure" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[0.75rem] text-muted-foreground mt-1", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setSelectedSchool(null);
            setSelectedBranch(null);
          }, className: "hover:text-foreground transition-colors", children: "Schools" }),
          /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
          selectedBranch ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setSelectedBranch(null), className: "hover:text-foreground transition-colors", children: selectedSchool.shortName }),
            /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
            /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: selectedBranch.shortName })
          ] }) : /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: selectedSchool.shortName })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => {
        if (selectedBranch) setSelectedBranch(null);
        else setSelectedSchool(null);
      }, className: "text-[0.8rem] -ml-2", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-1" }),
        " Back to ",
        selectedBranch ? "Branches" : "Schools"
      ] }),
      !selectedBranch ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Card, { className: `border-l-4 ${selectedSchool.color.replace("text-", "border-")}`, children: /* @__PURE__ */ jsx(CardContent, { className: "py-4 px-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-xl ${selectedSchool.iconBg} flex items-center justify-center shrink-0`, children: /* @__PURE__ */ jsx(School, { className: `w-6 h-6 ${selectedSchool.color}` }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-[1rem] font-semibold", children: selectedSchool.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-[0.8rem] text-muted-foreground", children: [
              /* @__PURE__ */ jsx(User, { className: "w-3 h-3 inline mr-1" }),
              "Dean: ",
              selectedSchool.dean,
              " \u2022 ",
              selectedSchool.branches.length,
              " Department",
              selectedSchool.branches.length > 1 ? "s" : "",
              " \u2022 ",
              selectedSchool.branches.reduce((sum, b) => sum + b.programmes.length, 0),
              " Programmes"
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3", children: selectedSchool.branches.map((branch) => /* @__PURE__ */ jsx(
          Card,
          {
            className: "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all",
            onClick: () => setSelectedBranch(branch),
            children: /* @__PURE__ */ jsxs(CardContent, { className: "py-4 px-5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-lg ${selectedSchool.iconBg} flex items-center justify-center`, children: /* @__PURE__ */ jsx(Building2, { className: `w-5 h-5 ${selectedSchool.color}` }) }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[0.85rem] font-medium truncate", children: branch.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-[0.7rem] text-muted-foreground truncate", children: [
                    "HoD: ",
                    branch.hod
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[0.65rem]", children: [
                  branch.programmes.length,
                  " Programme",
                  branch.programmes.length > 1 ? "s" : ""
                ] }),
                /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 text-muted-foreground" })
              ] })
            ] })
          },
          branch.id
        )) })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Card, { className: `border-l-4 ${selectedSchool.color.replace("text-", "border-")}`, children: /* @__PURE__ */ jsx(CardContent, { className: "py-4 px-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-xl ${selectedSchool.iconBg} flex items-center justify-center shrink-0`, children: /* @__PURE__ */ jsx(Building2, { className: `w-6 h-6 ${selectedSchool.color}` }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-[1rem] font-semibold", children: selectedBranch.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-[0.8rem] text-muted-foreground", children: [
              /* @__PURE__ */ jsx(User, { className: "w-3 h-3 inline mr-1" }),
              "HoD: ",
              selectedBranch.hod,
              " \u2022 ",
              selectedBranch.programmes.length,
              " Programme",
              selectedBranch.programmes.length > 1 ? "s" : ""
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: selectedBranch.programmes.map((programme) => {
          const allCourses = programme.curriculum.flatMap((y) => [...y.semester1, ...y.semester2]);
          return /* @__PURE__ */ jsx(
            Card,
            {
              className: "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all",
              onClick: () => setSelectedProgramme(programme),
              children: /* @__PURE__ */ jsx(CardContent, { className: "py-4 px-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(GraduationCap, { className: "w-5 h-5" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[0.85rem] font-medium", children: programme.name }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mt-1", children: [
                      /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[0.6rem]", children: [
                        /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 mr-0.5" }),
                        " ",
                        programme.duration,
                        " Year",
                        programme.duration > 1 ? "s" : ""
                      ] }),
                      /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[0.6rem]", children: [
                        /* @__PURE__ */ jsx(Award, { className: "w-3 h-3 mr-0.5" }),
                        " ",
                        programme.totalCredits,
                        " Credits"
                      ] }),
                      /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[0.6rem]", children: [
                        /* @__PURE__ */ jsx(BookOpen, { className: "w-3 h-3 mr-0.5" }),
                        " ",
                        allCourses.length,
                        " Courses"
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5 text-muted-foreground shrink-0" })
              ] }) })
            },
            programme.id
          );
        }) })
      ] })
    ] });
  }
  const totalBranches = schools.reduce((sum, s) => sum + s.branches.length, 0);
  const totalProgrammes = schools.reduce((sum, s) => sum + s.branches.reduce((bs, b) => bs + b.programmes.length, 0), 0);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", { children: "Academic Structure" }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsx(Card, { className: "py-3", children: /* @__PURE__ */ jsxs(CardContent, { className: "px-4 py-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-2", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600", children: /* @__PURE__ */ jsx(School, { className: "w-4 h-4" }) }) }),
        /* @__PURE__ */ jsx("p", { className: "text-[1.25rem]", children: schools.length }),
        /* @__PURE__ */ jsx("p", { className: "text-[0.7rem] text-muted-foreground", children: "Schools" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "py-3", children: /* @__PURE__ */ jsxs(CardContent, { className: "px-4 py-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-2", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600", children: /* @__PURE__ */ jsx(Building2, { className: "w-4 h-4" }) }) }),
        /* @__PURE__ */ jsx("p", { className: "text-[1.25rem]", children: totalBranches }),
        /* @__PURE__ */ jsx("p", { className: "text-[0.7rem] text-muted-foreground", children: "Departments" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "py-3", children: /* @__PURE__ */ jsxs(CardContent, { className: "px-4 py-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-2", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600", children: /* @__PURE__ */ jsx(GraduationCap, { className: "w-4 h-4" }) }) }),
        /* @__PURE__ */ jsx("p", { className: "text-[1.25rem]", children: totalProgrammes }),
        /* @__PURE__ */ jsx("p", { className: "text-[0.7rem] text-muted-foreground", children: "Programmes" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: schools.map((school) => {
      const branchCount = school.branches.length;
      const progCount = school.branches.reduce((sum, b) => sum + b.programmes.length, 0);
      return /* @__PURE__ */ jsx(
        Card,
        {
          className: "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group",
          onClick: () => setSelectedSchool(school),
          children: /* @__PURE__ */ jsxs(CardContent, { className: "py-5 px-5", children: [
            /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-xl ${school.iconBg} flex items-center justify-center mb-3`, children: /* @__PURE__ */ jsx(School, { className: `w-6 h-6 ${school.color}` }) }),
            /* @__PURE__ */ jsx(Badge, { className: `text-[0.6rem] mb-2 ${school.iconBg} ${school.color}`, children: school.shortName }),
            /* @__PURE__ */ jsx("p", { className: "text-[0.85rem] font-medium leading-tight mb-1", children: school.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-[0.7rem] text-muted-foreground mb-3", children: [
              "Dean: ",
              school.dean
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[0.6rem]", children: [
                branchCount,
                " Dept",
                branchCount > 1 ? "s" : ""
              ] }),
              /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[0.6rem]", children: [
                progCount,
                " Prog",
                progCount > 1 ? "s" : ""
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-3 text-[0.75rem] text-muted-foreground group-hover:text-foreground transition-colors", children: [
              /* @__PURE__ */ jsx("span", { children: "Explore" }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" })
            ] })
          ] })
        },
        school.id
      );
    }) })
  ] });
}
export {
  AcademicStructure
};
