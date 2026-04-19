const SCHOOLS = ["SOICT", "SOM", "SOBT", "SOLJG", "SOVSAS", "SOHSS", "SOE"];
const SCHOOL_FULL_NAMES = {
  SOICT: "School of ICT",
  SOM: "School of Management",
  SOBT: "School of Biotechnology",
  SOLJG: "School of Law, Justice & Governance",
  SOVSAS: "School of Vocational Studies & Applied Sciences",
  SOHSS: "School of Humanities & Social Sciences",
  SOE: "School of Engineering"
};
const DEPARTMENTS_BY_SCHOOL = {
  SOICT: ["CSE", "ECE", "IT"],
  SOM: ["Management"],
  SOBT: ["BT"],
  SOLJG: ["Law"],
  SOVSAS: ["CH", "ES", "FT", "MA", "PH"],
  SOHSS: ["Humanities", "Social Sciences"],
  SOE: ["Mechanical", "Civil", "Electrical"]
};
const DEPARTMENT_FULL_NAMES = {
  CSE: "Computer Science & Engineering",
  ECE: "Electronics & Communication Engineering",
  IT: "Information Technology",
  Management: "Management",
  BT: "Biotechnology",
  Law: "Law",
  CH: "Chemistry",
  ES: "Environmental Sciences",
  FT: "Food Technology",
  MA: "Mathematics",
  PH: "Physics",
  Humanities: "Humanities",
  "Social Sciences": "Social Sciences",
  Mechanical: "Mechanical Engineering",
  Civil: "Civil Engineering",
  Electrical: "Electrical Engineering"
};
const BRANCHES_BY_DEPARTMENT = {
  CSE: ["BCS", "CSE-AI", "CSE-ML", "CSE-DS"],
  ECE: ["B.Tech ECE", "ECE-VLSI"],
  IT: ["B.Tech IT", "IT-Cloud"],
  Management: ["BBA", "MBA"],
  BT: ["B.Tech Biotech", "M.Tech Biotech"],
  Law: ["BA LLB", "BBA LLB"],
  CH: ["B.Sc Chemistry", "M.Sc Chemistry"],
  ES: ["B.Sc Environmental Sciences", "M.Sc Environmental Sciences"],
  FT: ["B.Sc Food Technology", "M.Sc Food Technology"],
  MA: ["B.Sc Mathematics", "M.Sc Mathematics"],
  PH: ["B.Sc Physics", "M.Sc Physics"],
  Humanities: ["BA English", "BA Hindi", "MA English"],
  "Social Sciences": ["BA Political Science", "BA Economics"],
  Mechanical: ["B.Tech ME", "M.Tech ME"],
  Civil: ["B.Tech CE", "M.Tech CE"],
  Electrical: ["B.Tech EE", "M.Tech EE"]
};
const SECTIONS = ["A", "B", "C", "D"];
const YEARS = ["1st", "2nd", "3rd", "4th"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SESSIONS = ["2023-2027", "2024-2028", "2025-2029"];
function getYearFromSemester(sem) {
  if (sem <= 2) return "1st";
  if (sem <= 4) return "2nd";
  if (sem <= 6) return "3rd";
  return "4th";
}
function getSemestersForYear(year) {
  switch (year) {
    case "1st":
      return [1, 2];
    case "2nd":
      return [3, 4];
    case "3rd":
      return [5, 6];
    case "4th":
      return [7, 8];
    default:
      return [1, 2, 3, 4, 5, 6, 7, 8];
  }
}
const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Ananya", "Diya", "Priya", "Riya", "Kavya", "Meera", "Neha", "Pooja", "Shreya", "Tanvi", "Rohan", "Karan", "Rahul", "Amit", "Sunil", "Deepak", "Rajesh", "Manoj", "Vijay", "Suresh", "Sneha", "Nisha", "Swati", "Pallavi", "Ankita", "Divya", "Komal", "Payal", "Simran", "Jyoti"];
const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Rao", "Joshi", "Mishra", "Agarwal", "Chopra", "Malhotra", "Kapoor", "Bhat", "Nair", "Menon", "Iyer", "Pillai", "Das"];
function generateStudents() {
  const students = [];
  let counter = 1;
  const studentConfigs = [
    { school: "SOICT", department: "CSE", branch: "BCS", count: 40 },
    { school: "SOICT", department: "CSE", branch: "CSE-AI", count: 30 },
    { school: "SOICT", department: "CSE", branch: "CSE-ML", count: 25 },
    { school: "SOICT", department: "CSE", branch: "CSE-DS", count: 25 },
    { school: "SOICT", department: "ECE", branch: "B.Tech ECE", count: 30 },
    { school: "SOICT", department: "ECE", branch: "ECE-VLSI", count: 15 },
    { school: "SOICT", department: "IT", branch: "B.Tech IT", count: 25 },
    { school: "SOE", department: "Mechanical", branch: "B.Tech ME", count: 25 },
    { school: "SOE", department: "Civil", branch: "B.Tech CE", count: 20 },
    { school: "SOE", department: "Electrical", branch: "B.Tech EE", count: 20 },
    { school: "SOVSAS", department: "PH", branch: "B.Sc Physics", count: 15 },
    { school: "SOVSAS", department: "CH", branch: "B.Sc Chemistry", count: 15 },
    { school: "SOVSAS", department: "MA", branch: "B.Sc Mathematics", count: 10 },
    { school: "SOM", department: "Management", branch: "BBA", count: 15 },
    { school: "SOBT", department: "BT", branch: "B.Tech Biotech", count: 10 }
  ];
  const sessions = ["2023-2027", "2024-2028", "2025-2029"];
  const sectionsList = ["A", "B", "C", "D"];
  for (const config of studentConfigs) {
    for (let i = 0; i < config.count; i++) {
      const sem = i % 8 + 1;
      const year = getYearFromSemester(sem);
      const section = sectionsList[i % sectionsList.length];
      const session = sessions[i % sessions.length];
      const deptCode = config.department.substring(0, 2).toUpperCase();
      const rollNum = `${deptCode}${sem}${String(counter).padStart(3, "0")}`;
      students.push({
        id: `s-${counter}`,
        rollNumber: rollNum,
        name: `${firstNames[counter % firstNames.length]} ${lastNames[counter % lastNames.length]}`,
        school: config.school,
        department: config.department,
        branch: config.branch,
        semester: sem,
        year,
        section,
        session
      });
      counter++;
    }
  }
  return students;
}
function generateRooms() {
  const buildings = ["Main Block", "CS Block", "EC Block", "Workshop Block"];
  const rooms = [];
  let id = 1;
  for (const building of buildings) {
    for (let floor = 0; floor <= 3; floor++) {
      for (let room = 1; room <= 3; room++) {
        rooms.push({
          id: `r-${id}`,
          roomNumber: `${floor}${String(room).padStart(2, "0")}`,
          building,
          floor,
          capacity: 30 + Math.floor(Math.random() * 31),
          hasProjector: Math.random() > 0.3,
          isAvailable: true
        });
        id++;
      }
    }
  }
  return rooms;
}
function generateFaculty() {
  const designations = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer"];
  const faculty = [];
  const facultyNames = [
    "Dr. Ramesh Kumar",
    "Dr. Suresh Patel",
    "Dr. Anita Sharma",
    "Dr. Pradeep Verma",
    "Prof. Kavitha Rao",
    "Prof. Mohan Das",
    "Dr. Lakshmi Nair",
    "Prof. Rajiv Gupta",
    "Dr. Sunita Mishra",
    "Prof. Arun Joshi",
    "Dr. Meena Reddy",
    "Prof. Vikram Singh",
    "Dr. Deepa Iyer",
    "Prof. Sanjay Chopra",
    "Dr. Rekha Malhotra",
    "Prof. Ashok Kapoor",
    "Dr. Geeta Bhat",
    "Prof. Nitin Agarwal",
    "Dr. Pooja Menon",
    "Prof. Ravi Pillai",
    "Dr. Swati Kulkarni",
    "Prof. Harish Tiwari",
    "Dr. Nandini Hegde",
    "Prof. Sudhir Pandey",
    "Dr. Revathi Krishnan",
    "Prof. Dinesh Saxena",
    "Dr. Asha Banerjee",
    "Prof. Gopal Mehta",
    "Dr. Usha Deshpande",
    "Prof. Manoj Srivastava"
  ];
  const facultyConfigs = [
    { school: "SOICT", department: "CSE", branch: "BCS" },
    { school: "SOICT", department: "CSE", branch: "CSE-AI" },
    { school: "SOICT", department: "ECE", branch: "B.Tech ECE" },
    { school: "SOICT", department: "IT", branch: "B.Tech IT" },
    { school: "SOICT", department: "CSE", branch: "CSE-ML" },
    { school: "SOE", department: "Mechanical", branch: "B.Tech ME" },
    { school: "SOE", department: "Civil", branch: "B.Tech CE" },
    { school: "SOE", department: "Electrical", branch: "B.Tech EE" },
    { school: "SOVSAS", department: "PH", branch: "B.Sc Physics" },
    { school: "SOVSAS", department: "CH", branch: "B.Sc Chemistry" },
    { school: "SOVSAS", department: "MA", branch: "B.Sc Mathematics" },
    { school: "SOVSAS", department: "ES", branch: "B.Sc Environmental Sciences" },
    { school: "SOVSAS", department: "FT", branch: "B.Sc Food Technology" },
    { school: "SOM", department: "Management", branch: "BBA" },
    { school: "SOBT", department: "BT", branch: "B.Tech Biotech" },
    { school: "SOLJG", department: "Law", branch: "BA LLB" },
    { school: "SOHSS", department: "Humanities", branch: "BA English" },
    { school: "SOHSS", department: "Social Sciences", branch: "BA Political Science" },
    { school: "SOICT", department: "CSE", branch: "CSE-DS" },
    { school: "SOICT", department: "ECE", branch: "ECE-VLSI" },
    { school: "SOE", department: "Mechanical", branch: "M.Tech ME" },
    { school: "SOE", department: "Civil", branch: "M.Tech CE" },
    { school: "SOE", department: "Electrical", branch: "M.Tech EE" },
    { school: "SOVSAS", department: "PH", branch: "M.Sc Physics" },
    { school: "SOVSAS", department: "CH", branch: "M.Sc Chemistry" },
    { school: "SOM", department: "Management", branch: "MBA" },
    { school: "SOBT", department: "BT", branch: "M.Tech Biotech" },
    { school: "SOLJG", department: "Law", branch: "BBA LLB" },
    { school: "SOHSS", department: "Humanities", branch: "MA English" },
    { school: "SOICT", department: "IT", branch: "IT-Cloud" }
  ];
  for (let i = 0; i < facultyNames.length; i++) {
    const config = facultyConfigs[i % facultyConfigs.length];
    faculty.push({
      id: `f-${i + 1}`,
      employeeId: `EMP${String(i + 1).padStart(4, "0")}`,
      name: facultyNames[i],
      school: config.school,
      department: config.department,
      branch: config.branch,
      designation: designations[i % designations.length],
      email: `${facultyNames[i].split(" ").pop()?.toLowerCase()}@gbu.ac.in`,
      phone: `98${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`,
      totalDuties: Math.floor(Math.random() * 8),
      isAvailable: Math.random() > 0.1
    });
  }
  return faculty;
}
function generateExams() {
  return [
    {
      id: "e-1",
      name: "Mid-Semester Examination",
      subject: "Data Structures",
      date: "2026-02-23",
      startTime: "09:00",
      endTime: "12:00",
      branches: ["BCS", "CSE-AI"],
      semester: 3,
      status: "scheduled"
    },
    {
      id: "e-2",
      name: "Mid-Semester Examination",
      subject: "Digital Electronics",
      date: "2026-02-23",
      startTime: "09:00",
      endTime: "12:00",
      branches: ["B.Tech ECE"],
      semester: 3,
      status: "scheduled"
    },
    {
      id: "e-3",
      name: "End-Semester Examination",
      subject: "Engineering Mathematics III",
      date: "2026-02-24",
      startTime: "09:00",
      endTime: "12:00",
      branches: ["BCS", "CSE-AI", "B.Tech ECE", "B.Tech ME"],
      semester: 3,
      status: "scheduled"
    },
    {
      id: "e-4",
      name: "Mid-Semester Examination",
      subject: "Thermodynamics",
      date: "2026-02-25",
      startTime: "14:00",
      endTime: "17:00",
      branches: ["B.Tech ME"],
      semester: 5,
      status: "scheduled"
    },
    {
      id: "e-5",
      name: "End-Semester Examination",
      subject: "Database Management Systems",
      date: "2026-02-20",
      startTime: "09:00",
      endTime: "12:00",
      branches: ["BCS", "CSE-DS"],
      semester: 5,
      status: "completed"
    },
    {
      id: "e-6",
      name: "End-Semester Examination",
      subject: "Structural Analysis",
      date: "2026-02-26",
      startTime: "09:00",
      endTime: "12:00",
      branches: ["B.Tech CE"],
      semester: 5,
      status: "scheduled"
    }
  ];
}
const initialStudents = generateStudents();
const initialRooms = generateRooms();
const initialFaculty = generateFaculty();
const initialExams = generateExams();
const initialSeatingAllocations = [];
const initialInvigilationAllocations = [];
const initialAttendanceRecords = [];
const initialReplacementLogs = [
  {
    id: "rep-1",
    examId: "e-5",
    roomId: "r-1",
    originalFacultyId: "f-3",
    replacementFacultyId: "f-12",
    reason: "Medical leave",
    status: "approved",
    requestedAt: "2026-02-19T08:00:00",
    approvedAt: "2026-02-19T09:30:00"
  },
  {
    id: "rep-2",
    examId: "e-1",
    roomId: "r-2",
    originalFacultyId: "f-7",
    replacementFacultyId: "",
    reason: "Family emergency",
    status: "pending",
    requestedAt: "2026-02-19T14:00:00"
  }
];
export {
  BRANCHES_BY_DEPARTMENT,
  DEPARTMENTS_BY_SCHOOL,
  DEPARTMENT_FULL_NAMES,
  SCHOOLS,
  SCHOOL_FULL_NAMES,
  SECTIONS,
  SEMESTERS,
  SESSIONS,
  YEARS,
  getSemestersForYear,
  getYearFromSemester,
  initialAttendanceRecords,
  initialExams,
  initialFaculty,
  initialInvigilationAllocations,
  initialReplacementLogs,
  initialRooms,
  initialSeatingAllocations,
  initialStudents
};
