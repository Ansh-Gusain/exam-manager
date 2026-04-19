const schools = [
  {
    id: "soict",
    name: "School of Information & Communication Technology",
    shortName: "SOICT",
    dean: "Prof. Rajiv Gupta",
    color: "text-blue-700",
    iconBg: "bg-blue-50",
    branches: [
      {
        id: "soict-cse",
        name: "Computer Science & Engineering",
        shortName: "CSE",
        hod: "Dr. Ramesh Kumar",
        programmes: [
          {
            id: "btech-cse",
            name: "Bachelor of Technology in Computer Science & Engineering",
            shortName: "B.Tech CSE",
            duration: 4,
            degree: "B.Tech",
            totalCredits: 160,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "CS101", name: "Introduction to Programming", credits: 4, type: "core" },
                  { code: "MA101", name: "Engineering Mathematics I", credits: 4, type: "core" },
                  { code: "PH101", name: "Engineering Physics", credits: 3, type: "core" },
                  { code: "EE101", name: "Basic Electrical Engineering", credits: 3, type: "core" },
                  { code: "ME101", name: "Engineering Graphics", credits: 2, type: "core" },
                  { code: "CS101L", name: "Programming Lab", credits: 2, type: "lab" },
                  { code: "PH101L", name: "Physics Lab", credits: 1, type: "lab" }
                ],
                semester2: [
                  { code: "CS102", name: "Data Structures", credits: 4, type: "core" },
                  { code: "MA102", name: "Engineering Mathematics II", credits: 4, type: "core" },
                  { code: "CH101", name: "Engineering Chemistry", credits: 3, type: "core" },
                  { code: "EC101", name: "Basic Electronics", credits: 3, type: "core" },
                  { code: "HS101", name: "Communication Skills", credits: 2, type: "core" },
                  { code: "CS102L", name: "Data Structures Lab", credits: 2, type: "lab" },
                  { code: "CH101L", name: "Chemistry Lab", credits: 1, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "CS201", name: "Object Oriented Programming", credits: 4, type: "core" },
                  { code: "CS202", name: "Discrete Mathematics", credits: 4, type: "core" },
                  { code: "CS203", name: "Computer Organization", credits: 3, type: "core" },
                  { code: "CS204", name: "Database Management Systems", credits: 4, type: "core" },
                  { code: "MA201", name: "Probability & Statistics", credits: 3, type: "core" },
                  { code: "CS201L", name: "OOP Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "CS205", name: "Operating Systems", credits: 4, type: "core" },
                  { code: "CS206", name: "Design & Analysis of Algorithms", credits: 4, type: "core" },
                  { code: "CS207", name: "Computer Networks", credits: 4, type: "core" },
                  { code: "CS208", name: "Theory of Computation", credits: 3, type: "core" },
                  { code: "CS209", name: "Software Engineering", credits: 3, type: "core" },
                  { code: "CS205L", name: "OS Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "CS301", name: "Compiler Design", credits: 4, type: "core" },
                  { code: "CS302", name: "Artificial Intelligence", credits: 4, type: "core" },
                  { code: "CS303", name: "Web Technologies", credits: 3, type: "core" },
                  { code: "CSE01", name: "Elective I \u2013 Cloud Computing", credits: 3, type: "elective" },
                  { code: "CSE02", name: "Elective II \u2013 Cyber Security", credits: 3, type: "elective" },
                  { code: "CS301L", name: "Compiler Design Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "CS304", name: "Machine Learning", credits: 4, type: "core" },
                  { code: "CS305", name: "Distributed Systems", credits: 3, type: "core" },
                  { code: "CS306", name: "Information Security", credits: 3, type: "core" },
                  { code: "CSE03", name: "Elective III \u2013 Big Data Analytics", credits: 3, type: "elective" },
                  { code: "CSE04", name: "Elective IV \u2013 IoT", credits: 3, type: "elective" },
                  { code: "CS304L", name: "ML Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 4,
                semester1: [
                  { code: "CS401", name: "Deep Learning", credits: 4, type: "core" },
                  { code: "CSE05", name: "Elective V \u2013 Blockchain", credits: 3, type: "elective" },
                  { code: "CSE06", name: "Elective VI \u2013 NLP", credits: 3, type: "elective" },
                  { code: "CS491", name: "Major Project Phase I", credits: 6, type: "project" },
                  { code: "CS492", name: "Seminar", credits: 2, type: "project" }
                ],
                semester2: [
                  { code: "CSE07", name: "Elective VII \u2013 Quantum Computing", credits: 3, type: "elective" },
                  { code: "CS493", name: "Major Project Phase II", credits: 10, type: "project" },
                  { code: "CS494", name: "Industrial Training Report", credits: 2, type: "project" }
                ]
              }
            ]
          },
          {
            id: "mtech-cse",
            name: "Master of Technology in Computer Science & Engineering",
            shortName: "M.Tech CSE",
            duration: 2,
            degree: "M.Tech",
            totalCredits: 72,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "MCS501", name: "Advanced Algorithms", credits: 4, type: "core" },
                  { code: "MCS502", name: "Advanced Database Systems", credits: 4, type: "core" },
                  { code: "MCS503", name: "Advanced Computer Architecture", credits: 4, type: "core" },
                  { code: "MCSE01", name: "Elective I", credits: 4, type: "elective" },
                  { code: "MCS501L", name: "Research Methodology", credits: 2, type: "core" }
                ],
                semester2: [
                  { code: "MCS504", name: "Advanced Machine Learning", credits: 4, type: "core" },
                  { code: "MCS505", name: "Cloud & Distributed Computing", credits: 4, type: "core" },
                  { code: "MCSE02", name: "Elective II", credits: 4, type: "elective" },
                  { code: "MCSE03", name: "Elective III", credits: 4, type: "elective" },
                  { code: "MCS506L", name: "Seminar", credits: 2, type: "project" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "MCS601", name: "Dissertation Phase I", credits: 12, type: "project" },
                  { code: "MCSE04", name: "Elective IV", credits: 4, type: "elective" }
                ],
                semester2: [
                  { code: "MCS602", name: "Dissertation Phase II", credits: 16, type: "project" }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "soict-it",
        name: "Information Technology",
        shortName: "IT",
        hod: "Dr. Anita Sharma",
        programmes: [
          {
            id: "btech-it",
            name: "Bachelor of Technology in Information Technology",
            shortName: "B.Tech IT",
            duration: 4,
            degree: "B.Tech",
            totalCredits: 160,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "IT101", name: "Fundamentals of IT", credits: 4, type: "core" },
                  { code: "MA101", name: "Engineering Mathematics I", credits: 4, type: "core" },
                  { code: "PH101", name: "Engineering Physics", credits: 3, type: "core" },
                  { code: "IT102", name: "Programming in C", credits: 4, type: "core" },
                  { code: "IT101L", name: "IT Fundamentals Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "IT103", name: "Data Structures & Algorithms", credits: 4, type: "core" },
                  { code: "MA102", name: "Engineering Mathematics II", credits: 4, type: "core" },
                  { code: "IT104", name: "Digital Logic Design", credits: 3, type: "core" },
                  { code: "IT105", name: "Python Programming", credits: 3, type: "core" },
                  { code: "IT103L", name: "DSA Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "IT201", name: "Object Oriented Programming", credits: 4, type: "core" },
                  { code: "IT202", name: "Database Systems", credits: 4, type: "core" },
                  { code: "IT203", name: "Computer Organization", credits: 3, type: "core" },
                  { code: "IT204", name: "Discrete Structures", credits: 3, type: "core" },
                  { code: "IT201L", name: "OOP Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "IT205", name: "Operating Systems", credits: 4, type: "core" },
                  { code: "IT206", name: "Computer Networks", credits: 4, type: "core" },
                  { code: "IT207", name: "Software Engineering", credits: 3, type: "core" },
                  { code: "IT208", name: "Web Development", credits: 3, type: "core" },
                  { code: "IT205L", name: "OS & Network Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "IT301", name: "Information Security", credits: 4, type: "core" },
                  { code: "IT302", name: "Data Mining", credits: 3, type: "core" },
                  { code: "ITE01", name: "Elective I \u2013 Mobile Computing", credits: 3, type: "elective" },
                  { code: "ITE02", name: "Elective II \u2013 DevOps", credits: 3, type: "elective" },
                  { code: "IT301L", name: "Security Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "IT303", name: "Cloud Computing", credits: 4, type: "core" },
                  { code: "IT304", name: "Artificial Intelligence", credits: 3, type: "core" },
                  { code: "ITE03", name: "Elective III", credits: 3, type: "elective" },
                  { code: "ITE04", name: "Elective IV", credits: 3, type: "elective" },
                  { code: "IT303L", name: "Cloud Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 4,
                semester1: [
                  { code: "ITE05", name: "Elective V", credits: 3, type: "elective" },
                  { code: "ITE06", name: "Elective VI", credits: 3, type: "elective" },
                  { code: "IT491", name: "Major Project Phase I", credits: 6, type: "project" },
                  { code: "IT492", name: "Seminar", credits: 2, type: "project" }
                ],
                semester2: [
                  { code: "IT493", name: "Major Project Phase II", credits: 10, type: "project" },
                  { code: "IT494", name: "Internship Report", credits: 2, type: "project" }
                ]
              }
            ]
          },
          {
            id: "bca",
            name: "Bachelor of Computer Applications",
            shortName: "BCA",
            duration: 3,
            degree: "BCA",
            totalCredits: 120,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "BCA101", name: "Computer Fundamentals", credits: 4, type: "core" },
                  { code: "BCA102", name: "Programming in C", credits: 4, type: "core" },
                  { code: "BCA103", name: "Mathematics I", credits: 3, type: "core" },
                  { code: "BCA104", name: "Digital Electronics", credits: 3, type: "core" },
                  { code: "BCA101L", name: "C Programming Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "BCA105", name: "Data Structures", credits: 4, type: "core" },
                  { code: "BCA106", name: "OOP with Java", credits: 4, type: "core" },
                  { code: "BCA107", name: "Mathematics II", credits: 3, type: "core" },
                  { code: "BCA108", name: "Operating Systems", credits: 3, type: "core" },
                  { code: "BCA105L", name: "Java Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "BCA201", name: "DBMS", credits: 4, type: "core" },
                  { code: "BCA202", name: "Web Technologies", credits: 4, type: "core" },
                  { code: "BCA203", name: "Computer Networks", credits: 3, type: "core" },
                  { code: "BCA204", name: "Software Engineering", credits: 3, type: "core" },
                  { code: "BCA201L", name: "DBMS Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "BCA205", name: "Python Programming", credits: 4, type: "core" },
                  { code: "BCA206", name: "Computer Graphics", credits: 3, type: "core" },
                  { code: "BCAE01", name: "Elective I", credits: 3, type: "elective" },
                  { code: "BCA205L", name: "Python Lab", credits: 2, type: "lab" },
                  { code: "BCA207", name: "Mini Project", credits: 4, type: "project" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "BCA301", name: "Cloud Computing", credits: 3, type: "core" },
                  { code: "BCAE02", name: "Elective II", credits: 3, type: "elective" },
                  { code: "BCAE03", name: "Elective III", credits: 3, type: "elective" },
                  { code: "BCA391", name: "Major Project Phase I", credits: 6, type: "project" }
                ],
                semester2: [
                  { code: "BCAE04", name: "Elective IV", credits: 3, type: "elective" },
                  { code: "BCA392", name: "Major Project Phase II", credits: 8, type: "project" },
                  { code: "BCA393", name: "Internship", credits: 4, type: "project" }
                ]
              }
            ]
          },
          {
            id: "mca",
            name: "Master of Computer Applications",
            shortName: "MCA",
            duration: 2,
            degree: "MCA",
            totalCredits: 80,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "MCA501", name: "Advanced Java Programming", credits: 4, type: "core" },
                  { code: "MCA502", name: "Advanced DBMS", credits: 4, type: "core" },
                  { code: "MCA503", name: "Data Structures & Algorithms", credits: 4, type: "core" },
                  { code: "MCA504", name: "Computer Networks", credits: 3, type: "core" },
                  { code: "MCA501L", name: "Java Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "MCA505", name: "Software Engineering", credits: 4, type: "core" },
                  { code: "MCA506", name: "Web Technologies", credits: 4, type: "core" },
                  { code: "MCA507", name: "Machine Learning", credits: 3, type: "core" },
                  { code: "MCAE01", name: "Elective I", credits: 3, type: "elective" },
                  { code: "MCA506L", name: "Web Tech Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "MCAE02", name: "Elective II", credits: 3, type: "elective" },
                  { code: "MCAE03", name: "Elective III", credits: 3, type: "elective" },
                  { code: "MCA691", name: "Major Project Phase I", credits: 8, type: "project" }
                ],
                semester2: [
                  { code: "MCA692", name: "Major Project Phase II", credits: 12, type: "project" },
                  { code: "MCA693", name: "Internship", credits: 4, type: "project" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "som",
    name: "School of Management",
    shortName: "SOM",
    dean: "Prof. Sanjay Chopra",
    color: "text-emerald-700",
    iconBg: "bg-emerald-50",
    branches: [
      {
        id: "som-mgmt",
        name: "Management Studies",
        shortName: "MGMT",
        hod: "Prof. Ashok Kapoor",
        programmes: [
          {
            id: "bba",
            name: "Bachelor of Business Administration",
            shortName: "BBA",
            duration: 3,
            degree: "BBA",
            totalCredits: 120,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "BBA101", name: "Principles of Management", credits: 4, type: "core" },
                  { code: "BBA102", name: "Business Economics", credits: 4, type: "core" },
                  { code: "BBA103", name: "Financial Accounting", credits: 4, type: "core" },
                  { code: "BBA104", name: "Business Communication", credits: 3, type: "core" },
                  { code: "BBA105", name: "Computer Applications", credits: 3, type: "core" }
                ],
                semester2: [
                  { code: "BBA106", name: "Organizational Behavior", credits: 4, type: "core" },
                  { code: "BBA107", name: "Business Statistics", credits: 4, type: "core" },
                  { code: "BBA108", name: "Cost Accounting", credits: 4, type: "core" },
                  { code: "BBA109", name: "Business Law", credits: 3, type: "core" },
                  { code: "BBA110", name: "Environmental Studies", credits: 2, type: "core" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "BBA201", name: "Marketing Management", credits: 4, type: "core" },
                  { code: "BBA202", name: "Financial Management", credits: 4, type: "core" },
                  { code: "BBA203", name: "Human Resource Management", credits: 4, type: "core" },
                  { code: "BBA204", name: "Operations Management", credits: 3, type: "core" },
                  { code: "BBA205", name: "Business Research Methods", credits: 3, type: "core" }
                ],
                semester2: [
                  { code: "BBA206", name: "Strategic Management", credits: 4, type: "core" },
                  { code: "BBA207", name: "International Business", credits: 3, type: "core" },
                  { code: "BBAE01", name: "Elective I", credits: 3, type: "elective" },
                  { code: "BBAE02", name: "Elective II", credits: 3, type: "elective" },
                  { code: "BBA208", name: "Summer Internship", credits: 4, type: "project" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "BBA301", name: "Entrepreneurship Development", credits: 4, type: "core" },
                  { code: "BBAE03", name: "Elective III", credits: 3, type: "elective" },
                  { code: "BBAE04", name: "Elective IV", credits: 3, type: "elective" },
                  { code: "BBA391", name: "Project Phase I", credits: 4, type: "project" }
                ],
                semester2: [
                  { code: "BBAE05", name: "Elective V", credits: 3, type: "elective" },
                  { code: "BBA392", name: "Project Phase II", credits: 6, type: "project" },
                  { code: "BBA393", name: "Comprehensive Viva", credits: 2, type: "project" }
                ]
              }
            ]
          },
          {
            id: "mba",
            name: "Master of Business Administration",
            shortName: "MBA",
            duration: 2,
            degree: "MBA",
            totalCredits: 96,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "MBA501", name: "Managerial Economics", credits: 4, type: "core" },
                  { code: "MBA502", name: "Organizational Behavior", credits: 4, type: "core" },
                  { code: "MBA503", name: "Financial Accounting & Analysis", credits: 4, type: "core" },
                  { code: "MBA504", name: "Marketing Management", credits: 4, type: "core" },
                  { code: "MBA505", name: "Quantitative Techniques", credits: 4, type: "core" }
                ],
                semester2: [
                  { code: "MBA506", name: "Financial Management", credits: 4, type: "core" },
                  { code: "MBA507", name: "Human Resource Management", credits: 4, type: "core" },
                  { code: "MBA508", name: "Operations Management", credits: 4, type: "core" },
                  { code: "MBA509", name: "Business Research Methods", credits: 4, type: "core" },
                  { code: "MBA510", name: "Summer Internship", credits: 6, type: "project" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "MBA601", name: "Strategic Management", credits: 4, type: "core" },
                  { code: "MBAE01", name: "Specialization Elective I", credits: 4, type: "elective" },
                  { code: "MBAE02", name: "Specialization Elective II", credits: 4, type: "elective" },
                  { code: "MBAE03", name: "Specialization Elective III", credits: 4, type: "elective" },
                  { code: "MBA691", name: "Dissertation Phase I", credits: 4, type: "project" }
                ],
                semester2: [
                  { code: "MBAE04", name: "Specialization Elective IV", credits: 4, type: "elective" },
                  { code: "MBAE05", name: "Open Elective", credits: 4, type: "elective" },
                  { code: "MBA692", name: "Dissertation Phase II", credits: 8, type: "project" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "soljg",
    name: "School of Law, Justice & Governance",
    shortName: "SOLJG",
    dean: "Prof. Vikram Singh",
    color: "text-amber-700",
    iconBg: "bg-amber-50",
    branches: [
      {
        id: "soljg-law",
        name: "Law",
        shortName: "LAW",
        hod: "Dr. Deepa Iyer",
        programmes: [
          {
            id: "ballb",
            name: "BA LLB (Hons.)",
            shortName: "BA LLB",
            duration: 5,
            degree: "BA LLB",
            totalCredits: 200,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "LAW101", name: "Legal Methods", credits: 4, type: "core" },
                  { code: "LAW102", name: "Law of Contracts I", credits: 4, type: "core" },
                  { code: "BA101", name: "Political Science I", credits: 3, type: "core" },
                  { code: "BA102", name: "Economics I", credits: 3, type: "core" },
                  { code: "BA103", name: "English I", credits: 3, type: "core" }
                ],
                semester2: [
                  { code: "LAW103", name: "Law of Contracts II", credits: 4, type: "core" },
                  { code: "LAW104", name: "Constitutional Law I", credits: 4, type: "core" },
                  { code: "BA104", name: "Political Science II", credits: 3, type: "core" },
                  { code: "BA105", name: "Sociology I", credits: 3, type: "core" },
                  { code: "BA106", name: "History I", credits: 3, type: "core" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "LAW201", name: "Constitutional Law II", credits: 4, type: "core" },
                  { code: "LAW202", name: "Family Law I", credits: 4, type: "core" },
                  { code: "LAW203", name: "Law of Torts", credits: 3, type: "core" },
                  { code: "BA201", name: "Economics II", credits: 3, type: "core" },
                  { code: "BA202", name: "Sociology II", credits: 3, type: "core" }
                ],
                semester2: [
                  { code: "LAW204", name: "Family Law II", credits: 4, type: "core" },
                  { code: "LAW205", name: "Criminal Law I", credits: 4, type: "core" },
                  { code: "LAW206", name: "Property Law", credits: 3, type: "core" },
                  { code: "BA203", name: "Political Science III", credits: 3, type: "core" },
                  { code: "BA204", name: "History II", credits: 3, type: "core" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "LAW301", name: "Criminal Law II", credits: 4, type: "core" },
                  { code: "LAW302", name: "Jurisprudence", credits: 4, type: "core" },
                  { code: "LAW303", name: "Administrative Law", credits: 3, type: "core" },
                  { code: "LAW304", name: "Labour Law I", credits: 3, type: "core" }
                ],
                semester2: [
                  { code: "LAW305", name: "Labour Law II", credits: 3, type: "core" },
                  { code: "LAW306", name: "Environmental Law", credits: 3, type: "core" },
                  { code: "LAW307", name: "Company Law", credits: 4, type: "core" },
                  { code: "LAW308", name: "Civil Procedure Code", credits: 4, type: "core" }
                ]
              },
              {
                year: 4,
                semester1: [
                  { code: "LAW401", name: "Criminal Procedure Code", credits: 4, type: "core" },
                  { code: "LAW402", name: "Law of Evidence", credits: 4, type: "core" },
                  { code: "LAWE01", name: "Elective I \u2013 IPR", credits: 3, type: "elective" },
                  { code: "LAWE02", name: "Elective II \u2013 Taxation", credits: 3, type: "elective" }
                ],
                semester2: [
                  { code: "LAW403", name: "International Law", credits: 4, type: "core" },
                  { code: "LAW404", name: "Human Rights Law", credits: 3, type: "core" },
                  { code: "LAWE03", name: "Elective III \u2013 ADR", credits: 3, type: "elective" },
                  { code: "LAW491", name: "Moot Court & Internship", credits: 4, type: "project" }
                ]
              },
              {
                year: 5,
                semester1: [
                  { code: "LAWE04", name: "Elective IV \u2013 Cyber Law", credits: 3, type: "elective" },
                  { code: "LAWE05", name: "Elective V \u2013 Banking Law", credits: 3, type: "elective" },
                  { code: "LAW591", name: "Dissertation Phase I", credits: 6, type: "project" }
                ],
                semester2: [
                  { code: "LAW592", name: "Dissertation Phase II", credits: 8, type: "project" },
                  { code: "LAW593", name: "Legal Aid Clinic & Internship", credits: 4, type: "project" }
                ]
              }
            ]
          },
          {
            id: "llm",
            name: "Master of Laws",
            shortName: "LLM",
            duration: 1,
            degree: "LLM",
            totalCredits: 40,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "LLM501", name: "Research Methodology", credits: 4, type: "core" },
                  { code: "LLM502", name: "Law & Social Transformation", credits: 4, type: "core" },
                  { code: "LLME01", name: "Specialization Paper I", credits: 4, type: "elective" },
                  { code: "LLME02", name: "Specialization Paper II", credits: 4, type: "elective" }
                ],
                semester2: [
                  { code: "LLME03", name: "Specialization Paper III", credits: 4, type: "elective" },
                  { code: "LLME04", name: "Specialization Paper IV", credits: 4, type: "elective" },
                  { code: "LLM591", name: "Dissertation", credits: 16, type: "project" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "sobt",
    name: "School of Biotechnology",
    shortName: "SOBT",
    dean: "Dr. Lakshmi Nair",
    color: "text-pink-700",
    iconBg: "bg-pink-50",
    branches: [
      {
        id: "sobt-biotech",
        name: "Biotechnology",
        shortName: "BT",
        hod: "Dr. Meena Reddy",
        programmes: [
          {
            id: "btech-bt",
            name: "Bachelor of Technology in Biotechnology",
            shortName: "B.Tech BT",
            duration: 4,
            degree: "B.Tech",
            totalCredits: 160,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "BT101", name: "Biology for Engineers", credits: 4, type: "core" },
                  { code: "BT102", name: "Chemistry I", credits: 4, type: "core" },
                  { code: "MA101", name: "Mathematics I", credits: 4, type: "core" },
                  { code: "BT103", name: "Introduction to Biotechnology", credits: 3, type: "core" },
                  { code: "BT101L", name: "Biology Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "BT104", name: "Biochemistry", credits: 4, type: "core" },
                  { code: "BT105", name: "Cell Biology", credits: 4, type: "core" },
                  { code: "MA102", name: "Mathematics II", credits: 4, type: "core" },
                  { code: "BT106", name: "Microbiology", credits: 3, type: "core" },
                  { code: "BT104L", name: "Biochemistry Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "BT201", name: "Molecular Biology", credits: 4, type: "core" },
                  { code: "BT202", name: "Genetics", credits: 4, type: "core" },
                  { code: "BT203", name: "Immunology", credits: 3, type: "core" },
                  { code: "BT204", name: "Biostatistics", credits: 3, type: "core" },
                  { code: "BT201L", name: "Molecular Biology Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "BT205", name: "Genetic Engineering", credits: 4, type: "core" },
                  { code: "BT206", name: "Bioprocess Engineering", credits: 4, type: "core" },
                  { code: "BT207", name: "Bioinformatics", credits: 3, type: "core" },
                  { code: "BT208", name: "Plant Biotechnology", credits: 3, type: "core" },
                  { code: "BT205L", name: "Genetic Engineering Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "BT301", name: "Animal Biotechnology", credits: 4, type: "core" },
                  { code: "BT302", name: "Environmental Biotechnology", credits: 3, type: "core" },
                  { code: "BTE01", name: "Elective I \u2013 Genomics", credits: 3, type: "elective" },
                  { code: "BTE02", name: "Elective II \u2013 Proteomics", credits: 3, type: "elective" },
                  { code: "BT301L", name: "Animal Cell Culture Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "BT303", name: "Pharmaceutical Biotechnology", credits: 4, type: "core" },
                  { code: "BT304", name: "Food Biotechnology", credits: 3, type: "core" },
                  { code: "BTE03", name: "Elective III", credits: 3, type: "elective" },
                  { code: "BTE04", name: "Elective IV", credits: 3, type: "elective" },
                  { code: "BT303L", name: "Pharma Biotech Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 4,
                semester1: [
                  { code: "BTE05", name: "Elective V \u2013 Nanobiotechnology", credits: 3, type: "elective" },
                  { code: "BT491", name: "Major Project Phase I", credits: 8, type: "project" },
                  { code: "BT492", name: "Seminar", credits: 2, type: "project" }
                ],
                semester2: [
                  { code: "BT493", name: "Major Project Phase II", credits: 10, type: "project" },
                  { code: "BT494", name: "Industrial Training", credits: 4, type: "project" }
                ]
              }
            ]
          },
          {
            id: "msc-bt",
            name: "Master of Science in Biotechnology",
            shortName: "M.Sc BT",
            duration: 2,
            degree: "M.Sc",
            totalCredits: 72,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "MSB501", name: "Advanced Molecular Biology", credits: 4, type: "core" },
                  { code: "MSB502", name: "Advanced Biochemistry", credits: 4, type: "core" },
                  { code: "MSB503", name: "Advanced Immunology", credits: 4, type: "core" },
                  { code: "MSB504", name: "Research Methodology", credits: 3, type: "core" },
                  { code: "MSB501L", name: "Advanced Lab I", credits: 3, type: "lab" }
                ],
                semester2: [
                  { code: "MSB505", name: "Advanced Genetic Engineering", credits: 4, type: "core" },
                  { code: "MSB506", name: "Advanced Bioinformatics", credits: 4, type: "core" },
                  { code: "MSBE01", name: "Elective I", credits: 3, type: "elective" },
                  { code: "MSB505L", name: "Advanced Lab II", credits: 3, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "MSBE02", name: "Elective II", credits: 3, type: "elective" },
                  { code: "MSB691", name: "Dissertation Phase I", credits: 12, type: "project" }
                ],
                semester2: [
                  { code: "MSB692", name: "Dissertation Phase II", credits: 16, type: "project" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "sovsas",
    name: "School of Vocational Studies & Applied Sciences",
    shortName: "SOVSAS",
    dean: "Dr. Sunita Mishra",
    color: "text-cyan-700",
    iconBg: "bg-cyan-50",
    branches: [
      {
        id: "sovsas-physics",
        name: "Physics",
        shortName: "PHY",
        hod: "Dr. Revathi Krishnan",
        programmes: [
          {
            id: "bsc-phy",
            name: "Bachelor of Science in Physics",
            shortName: "B.Sc Physics",
            duration: 3,
            degree: "B.Sc",
            totalCredits: 120,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "PHY101", name: "Mechanics", credits: 4, type: "core" },
                  { code: "PHY102", name: "Mathematical Physics I", credits: 4, type: "core" },
                  { code: "CHM101", name: "Inorganic Chemistry", credits: 3, type: "core" },
                  { code: "MAT101", name: "Calculus", credits: 3, type: "core" },
                  { code: "PHY101L", name: "Physics Lab I", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "PHY103", name: "Electromagnetism", credits: 4, type: "core" },
                  { code: "PHY104", name: "Waves & Optics", credits: 4, type: "core" },
                  { code: "MAT102", name: "Linear Algebra", credits: 3, type: "core" },
                  { code: "PHY103L", name: "Physics Lab II", credits: 2, type: "lab" },
                  { code: "HS101", name: "English", credits: 2, type: "core" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "PHY201", name: "Thermal Physics", credits: 4, type: "core" },
                  { code: "PHY202", name: "Mathematical Physics II", credits: 4, type: "core" },
                  { code: "PHY203", name: "Digital Electronics", credits: 3, type: "core" },
                  { code: "PHY201L", name: "Physics Lab III", credits: 2, type: "lab" },
                  { code: "PHY203L", name: "Electronics Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "PHY204", name: "Quantum Mechanics I", credits: 4, type: "core" },
                  { code: "PHY205", name: "Statistical Mechanics", credits: 4, type: "core" },
                  { code: "PHY206", name: "Solid State Physics", credits: 3, type: "core" },
                  { code: "PHY204L", name: "Physics Lab IV", credits: 2, type: "lab" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "PHY301", name: "Quantum Mechanics II", credits: 4, type: "core" },
                  { code: "PHY302", name: "Nuclear & Particle Physics", credits: 4, type: "core" },
                  { code: "PHYE01", name: "Elective I \u2013 Astrophysics", credits: 3, type: "elective" },
                  { code: "PHY391", name: "Project Phase I", credits: 4, type: "project" }
                ],
                semester2: [
                  { code: "PHY303", name: "Atomic & Molecular Physics", credits: 4, type: "core" },
                  { code: "PHYE02", name: "Elective II \u2013 Photonics", credits: 3, type: "elective" },
                  { code: "PHY392", name: "Project Phase II", credits: 6, type: "project" }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "sovsas-chem",
        name: "Chemistry",
        shortName: "CHEM",
        hod: "Dr. Asha Banerjee",
        programmes: [
          {
            id: "bsc-chem",
            name: "Bachelor of Science in Chemistry",
            shortName: "B.Sc Chemistry",
            duration: 3,
            degree: "B.Sc",
            totalCredits: 120,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "CHM101", name: "Inorganic Chemistry I", credits: 4, type: "core" },
                  { code: "CHM102", name: "Organic Chemistry I", credits: 4, type: "core" },
                  { code: "CHM103", name: "Physical Chemistry I", credits: 4, type: "core" },
                  { code: "MAT101", name: "Mathematics I", credits: 3, type: "core" },
                  { code: "CHM101L", name: "Chemistry Lab I", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "CHM104", name: "Inorganic Chemistry II", credits: 4, type: "core" },
                  { code: "CHM105", name: "Organic Chemistry II", credits: 4, type: "core" },
                  { code: "CHM106", name: "Physical Chemistry II", credits: 4, type: "core" },
                  { code: "CHM104L", name: "Chemistry Lab II", credits: 2, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "CHM201", name: "Coordination Chemistry", credits: 4, type: "core" },
                  { code: "CHM202", name: "Spectroscopy", credits: 4, type: "core" },
                  { code: "CHM203", name: "Quantum Chemistry", credits: 3, type: "core" },
                  { code: "CHM201L", name: "Chemistry Lab III", credits: 3, type: "lab" }
                ],
                semester2: [
                  { code: "CHM204", name: "Organic Synthesis", credits: 4, type: "core" },
                  { code: "CHM205", name: "Thermodynamics & Kinetics", credits: 4, type: "core" },
                  { code: "CHM206", name: "Polymer Chemistry", credits: 3, type: "core" },
                  { code: "CHM204L", name: "Chemistry Lab IV", credits: 3, type: "lab" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "CHM301", name: "Advanced Inorganic Chemistry", credits: 4, type: "core" },
                  { code: "CHME01", name: "Elective I \u2013 Analytical Chemistry", credits: 3, type: "elective" },
                  { code: "CHM391", name: "Project Phase I", credits: 4, type: "project" }
                ],
                semester2: [
                  { code: "CHME02", name: "Elective II \u2013 Green Chemistry", credits: 3, type: "elective" },
                  { code: "CHM392", name: "Project Phase II", credits: 6, type: "project" }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "sovsas-math",
        name: "Mathematics",
        shortName: "MATH",
        hod: "Prof. Gopal Mehta",
        programmes: [
          {
            id: "bsc-math",
            name: "Bachelor of Science in Mathematics",
            shortName: "B.Sc Mathematics",
            duration: 3,
            degree: "B.Sc",
            totalCredits: 120,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "MAT101", name: "Calculus & Analytical Geometry", credits: 4, type: "core" },
                  { code: "MAT102", name: "Algebra I", credits: 4, type: "core" },
                  { code: "PHY101", name: "Physics I", credits: 3, type: "core" },
                  { code: "CS101", name: "Programming Fundamentals", credits: 3, type: "core" },
                  { code: "MAT101L", name: "Math Computing Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "MAT103", name: "Real Analysis I", credits: 4, type: "core" },
                  { code: "MAT104", name: "Differential Equations", credits: 4, type: "core" },
                  { code: "MAT105", name: "Probability & Statistics", credits: 3, type: "core" },
                  { code: "MAT103L", name: "Computational Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "MAT201", name: "Real Analysis II", credits: 4, type: "core" },
                  { code: "MAT202", name: "Linear Algebra", credits: 4, type: "core" },
                  { code: "MAT203", name: "Number Theory", credits: 3, type: "core" },
                  { code: "MAT204", name: "Numerical Methods", credits: 3, type: "core" },
                  { code: "MAT204L", name: "Numerical Methods Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "MAT205", name: "Complex Analysis", credits: 4, type: "core" },
                  { code: "MAT206", name: "Abstract Algebra", credits: 4, type: "core" },
                  { code: "MAT207", name: "Discrete Mathematics", credits: 3, type: "core" },
                  { code: "MAT208", name: "Operations Research", credits: 3, type: "core" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "MAT301", name: "Topology", credits: 4, type: "core" },
                  { code: "MATE01", name: "Elective I \u2013 Mathematical Modeling", credits: 3, type: "elective" },
                  { code: "MAT391", name: "Project Phase I", credits: 4, type: "project" }
                ],
                semester2: [
                  { code: "MAT302", name: "Functional Analysis", credits: 4, type: "core" },
                  { code: "MATE02", name: "Elective II \u2013 Cryptography", credits: 3, type: "elective" },
                  { code: "MAT392", name: "Project Phase II", credits: 6, type: "project" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "sohss",
    name: "School of Humanities & Social Sciences",
    shortName: "SOHSS",
    dean: "Prof. Harish Tiwari",
    color: "text-violet-700",
    iconBg: "bg-violet-50",
    branches: [
      {
        id: "sohss-english",
        name: "English",
        shortName: "ENG",
        hod: "Dr. Nandini Hegde",
        programmes: [
          {
            id: "ba-eng",
            name: "Bachelor of Arts in English",
            shortName: "BA English",
            duration: 3,
            degree: "BA",
            totalCredits: 120,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "ENG101", name: "Introduction to Literature", credits: 4, type: "core" },
                  { code: "ENG102", name: "English Language & Linguistics", credits: 4, type: "core" },
                  { code: "ENG103", name: "British Literature I", credits: 3, type: "core" },
                  { code: "HS101", name: "Indian History", credits: 3, type: "core" },
                  { code: "PS101", name: "Political Science I", credits: 3, type: "core" }
                ],
                semester2: [
                  { code: "ENG104", name: "British Literature II", credits: 4, type: "core" },
                  { code: "ENG105", name: "Literary Criticism", credits: 4, type: "core" },
                  { code: "ENG106", name: "Indian Writing in English", credits: 3, type: "core" },
                  { code: "SOC101", name: "Sociology I", credits: 3, type: "core" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "ENG201", name: "American Literature", credits: 4, type: "core" },
                  { code: "ENG202", name: "Romantic & Victorian Poetry", credits: 4, type: "core" },
                  { code: "ENG203", name: "Drama Studies", credits: 3, type: "core" },
                  { code: "ENGE01", name: "Elective I", credits: 3, type: "elective" }
                ],
                semester2: [
                  { code: "ENG204", name: "Modern & Postmodern Literature", credits: 4, type: "core" },
                  { code: "ENG205", name: "Postcolonial Literature", credits: 4, type: "core" },
                  { code: "ENGE02", name: "Elective II", credits: 3, type: "elective" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "ENG301", name: "Literary Theory", credits: 4, type: "core" },
                  { code: "ENGE03", name: "Elective III \u2013 Creative Writing", credits: 3, type: "elective" },
                  { code: "ENG391", name: "Dissertation Phase I", credits: 6, type: "project" }
                ],
                semester2: [
                  { code: "ENGE04", name: "Elective IV \u2013 Film Studies", credits: 3, type: "elective" },
                  { code: "ENG392", name: "Dissertation Phase II", credits: 8, type: "project" }
                ]
              }
            ]
          },
          {
            id: "ma-eng",
            name: "Master of Arts in English",
            shortName: "MA English",
            duration: 2,
            degree: "MA",
            totalCredits: 72,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "MAE501", name: "Advanced Literary Theory", credits: 4, type: "core" },
                  { code: "MAE502", name: "Shakespeare Studies", credits: 4, type: "core" },
                  { code: "MAE503", name: "Research Methodology", credits: 3, type: "core" },
                  { code: "MAEE01", name: "Elective I", credits: 4, type: "elective" }
                ],
                semester2: [
                  { code: "MAE504", name: "Comparative Literature", credits: 4, type: "core" },
                  { code: "MAE505", name: "Cultural Studies", credits: 4, type: "core" },
                  { code: "MAEE02", name: "Elective II", credits: 4, type: "elective" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "MAEE03", name: "Elective III", credits: 4, type: "elective" },
                  { code: "MAE691", name: "Dissertation Phase I", credits: 10, type: "project" }
                ],
                semester2: [
                  { code: "MAE692", name: "Dissertation Phase II", credits: 14, type: "project" }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "sohss-econ",
        name: "Economics",
        shortName: "ECON",
        hod: "Prof. Dinesh Saxena",
        programmes: [
          {
            id: "ba-econ",
            name: "Bachelor of Arts in Economics",
            shortName: "BA Economics",
            duration: 3,
            degree: "BA",
            totalCredits: 120,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "ECO101", name: "Microeconomics I", credits: 4, type: "core" },
                  { code: "ECO102", name: "Indian Economy", credits: 3, type: "core" },
                  { code: "MAT101", name: "Mathematics for Economics I", credits: 4, type: "core" },
                  { code: "HS101", name: "History I", credits: 3, type: "core" },
                  { code: "PS101", name: "Political Science I", credits: 3, type: "core" }
                ],
                semester2: [
                  { code: "ECO103", name: "Macroeconomics I", credits: 4, type: "core" },
                  { code: "ECO104", name: "Statistics for Economics", credits: 4, type: "core" },
                  { code: "MAT102", name: "Mathematics for Economics II", credits: 3, type: "core" },
                  { code: "SOC101", name: "Sociology I", credits: 3, type: "core" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "ECO201", name: "Microeconomics II", credits: 4, type: "core" },
                  { code: "ECO202", name: "Macroeconomics II", credits: 4, type: "core" },
                  { code: "ECO203", name: "Econometrics I", credits: 4, type: "core" },
                  { code: "ECO204", name: "Development Economics", credits: 3, type: "core" }
                ],
                semester2: [
                  { code: "ECO205", name: "International Economics", credits: 4, type: "core" },
                  { code: "ECO206", name: "Public Finance", credits: 3, type: "core" },
                  { code: "ECOE01", name: "Elective I \u2013 Behavioral Economics", credits: 3, type: "elective" },
                  { code: "ECO207", name: "Econometrics II", credits: 3, type: "core" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "ECO301", name: "Money & Banking", credits: 4, type: "core" },
                  { code: "ECOE02", name: "Elective II \u2013 Environmental Economics", credits: 3, type: "elective" },
                  { code: "ECO391", name: "Project Phase I", credits: 4, type: "project" }
                ],
                semester2: [
                  { code: "ECOE03", name: "Elective III \u2013 Financial Economics", credits: 3, type: "elective" },
                  { code: "ECO392", name: "Project Phase II", credits: 6, type: "project" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "soe",
    name: "School of Engineering",
    shortName: "SOE",
    dean: "Prof. Mohan Das",
    color: "text-orange-700",
    iconBg: "bg-orange-50",
    branches: [
      {
        id: "soe-ece",
        name: "Electronics & Communication Engineering",
        shortName: "ECE",
        hod: "Dr. Pradeep Verma",
        programmes: [
          {
            id: "btech-ece",
            name: "Bachelor of Technology in ECE",
            shortName: "B.Tech ECE",
            duration: 4,
            degree: "B.Tech",
            totalCredits: 160,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "EC101", name: "Basic Electronics", credits: 4, type: "core" },
                  { code: "MA101", name: "Engineering Mathematics I", credits: 4, type: "core" },
                  { code: "PH101", name: "Engineering Physics", credits: 3, type: "core" },
                  { code: "CS101", name: "Programming in C", credits: 3, type: "core" },
                  { code: "EC101L", name: "Electronics Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "EC102", name: "Circuit Theory", credits: 4, type: "core" },
                  { code: "EC103", name: "Digital Electronics", credits: 4, type: "core" },
                  { code: "MA102", name: "Engineering Mathematics II", credits: 4, type: "core" },
                  { code: "EC102L", name: "Circuit Lab", credits: 2, type: "lab" },
                  { code: "EC103L", name: "Digital Electronics Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "EC201", name: "Signals & Systems", credits: 4, type: "core" },
                  { code: "EC202", name: "Analog Circuits", credits: 4, type: "core" },
                  { code: "EC203", name: "Electromagnetic Theory", credits: 4, type: "core" },
                  { code: "EC204", name: "Microprocessors", credits: 3, type: "core" },
                  { code: "EC201L", name: "Analog Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "EC205", name: "Digital Signal Processing", credits: 4, type: "core" },
                  { code: "EC206", name: "Communication Systems", credits: 4, type: "core" },
                  { code: "EC207", name: "Control Systems", credits: 3, type: "core" },
                  { code: "EC208", name: "VLSI Design", credits: 3, type: "core" },
                  { code: "EC205L", name: "DSP Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "EC301", name: "Wireless Communication", credits: 4, type: "core" },
                  { code: "EC302", name: "Antenna & Wave Propagation", credits: 3, type: "core" },
                  { code: "ECE01", name: "Elective I \u2013 Embedded Systems", credits: 3, type: "elective" },
                  { code: "ECE02", name: "Elective II \u2013 Image Processing", credits: 3, type: "elective" },
                  { code: "EC301L", name: "Communication Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "EC303", name: "Optical Communication", credits: 4, type: "core" },
                  { code: "EC304", name: "Microwave Engineering", credits: 3, type: "core" },
                  { code: "ECE03", name: "Elective III \u2013 Robotics", credits: 3, type: "elective" },
                  { code: "ECE04", name: "Elective IV \u2013 IoT", credits: 3, type: "elective" },
                  { code: "EC303L", name: "Optical Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 4,
                semester1: [
                  { code: "ECE05", name: "Elective V \u2013 5G Networks", credits: 3, type: "elective" },
                  { code: "EC491", name: "Major Project Phase I", credits: 8, type: "project" },
                  { code: "EC492", name: "Seminar", credits: 2, type: "project" }
                ],
                semester2: [
                  { code: "EC493", name: "Major Project Phase II", credits: 10, type: "project" },
                  { code: "EC494", name: "Industrial Training", credits: 4, type: "project" }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "soe-me",
        name: "Mechanical Engineering",
        shortName: "ME",
        hod: "Prof. Ravi Pillai",
        programmes: [
          {
            id: "btech-me",
            name: "Bachelor of Technology in Mechanical Engineering",
            shortName: "B.Tech ME",
            duration: 4,
            degree: "B.Tech",
            totalCredits: 160,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "ME101", name: "Engineering Mechanics", credits: 4, type: "core" },
                  { code: "MA101", name: "Engineering Mathematics I", credits: 4, type: "core" },
                  { code: "PH101", name: "Engineering Physics", credits: 3, type: "core" },
                  { code: "ME102", name: "Engineering Graphics & CAD", credits: 3, type: "core" },
                  { code: "ME102L", name: "Workshop Practice", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "ME103", name: "Thermodynamics I", credits: 4, type: "core" },
                  { code: "ME104", name: "Material Science", credits: 4, type: "core" },
                  { code: "MA102", name: "Engineering Mathematics II", credits: 4, type: "core" },
                  { code: "ME103L", name: "Thermo Lab", credits: 2, type: "lab" },
                  { code: "CS101", name: "Programming Basics", credits: 2, type: "core" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "ME201", name: "Strength of Materials", credits: 4, type: "core" },
                  { code: "ME202", name: "Fluid Mechanics", credits: 4, type: "core" },
                  { code: "ME203", name: "Manufacturing Processes I", credits: 3, type: "core" },
                  { code: "ME204", name: "Kinematics of Machines", credits: 3, type: "core" },
                  { code: "ME201L", name: "Material Testing Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "ME205", name: "Thermodynamics II", credits: 4, type: "core" },
                  { code: "ME206", name: "Machine Design I", credits: 4, type: "core" },
                  { code: "ME207", name: "Manufacturing Processes II", credits: 3, type: "core" },
                  { code: "ME208", name: "Dynamics of Machines", credits: 3, type: "core" },
                  { code: "ME205L", name: "Fluid Mechanics Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "ME301", name: "Heat Transfer", credits: 4, type: "core" },
                  { code: "ME302", name: "Machine Design II", credits: 3, type: "core" },
                  { code: "MEE01", name: "Elective I \u2013 Robotics", credits: 3, type: "elective" },
                  { code: "MEE02", name: "Elective II \u2013 CAD/CAM", credits: 3, type: "elective" },
                  { code: "ME301L", name: "Heat Transfer Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "ME303", name: "IC Engines", credits: 4, type: "core" },
                  { code: "ME304", name: "Industrial Engineering", credits: 3, type: "core" },
                  { code: "MEE03", name: "Elective III \u2013 CFD", credits: 3, type: "elective" },
                  { code: "MEE04", name: "Elective IV \u2013 FEM", credits: 3, type: "elective" },
                  { code: "ME303L", name: "IC Engine Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 4,
                semester1: [
                  { code: "MEE05", name: "Elective V \u2013 Renewable Energy", credits: 3, type: "elective" },
                  { code: "ME491", name: "Major Project Phase I", credits: 8, type: "project" },
                  { code: "ME492", name: "Seminar", credits: 2, type: "project" }
                ],
                semester2: [
                  { code: "ME493", name: "Major Project Phase II", credits: 10, type: "project" },
                  { code: "ME494", name: "Industrial Training", credits: 4, type: "project" }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "soe-ce",
        name: "Civil Engineering",
        shortName: "CE",
        hod: "Dr. Usha Deshpande",
        programmes: [
          {
            id: "btech-ce",
            name: "Bachelor of Technology in Civil Engineering",
            shortName: "B.Tech CE",
            duration: 4,
            degree: "B.Tech",
            totalCredits: 160,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "CE101", name: "Engineering Mechanics", credits: 4, type: "core" },
                  { code: "MA101", name: "Engineering Mathematics I", credits: 4, type: "core" },
                  { code: "CE102", name: "Engineering Geology", credits: 3, type: "core" },
                  { code: "CE103", name: "Surveying I", credits: 3, type: "core" },
                  { code: "CE103L", name: "Surveying Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "CE104", name: "Building Materials", credits: 4, type: "core" },
                  { code: "CE105", name: "Fluid Mechanics", credits: 4, type: "core" },
                  { code: "MA102", name: "Engineering Mathematics II", credits: 4, type: "core" },
                  { code: "CE104L", name: "Material Testing Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "CE201", name: "Structural Analysis I", credits: 4, type: "core" },
                  { code: "CE202", name: "Geotechnical Engineering I", credits: 4, type: "core" },
                  { code: "CE203", name: "Concrete Technology", credits: 3, type: "core" },
                  { code: "CE204", name: "Hydraulics", credits: 3, type: "core" },
                  { code: "CE201L", name: "Structures Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "CE205", name: "Structural Analysis II", credits: 4, type: "core" },
                  { code: "CE206", name: "Geotechnical Engineering II", credits: 3, type: "core" },
                  { code: "CE207", name: "Transportation Engineering", credits: 4, type: "core" },
                  { code: "CE208", name: "Environmental Engineering", credits: 3, type: "core" },
                  { code: "CE207L", name: "Transportation Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "CE301", name: "RCC Design", credits: 4, type: "core" },
                  { code: "CE302", name: "Water Resources Engineering", credits: 3, type: "core" },
                  { code: "CEE01", name: "Elective I \u2013 Earthquake Engineering", credits: 3, type: "elective" },
                  { code: "CEE02", name: "Elective II \u2013 GIS", credits: 3, type: "elective" },
                  { code: "CE301L", name: "Design Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "CE303", name: "Steel Structures", credits: 4, type: "core" },
                  { code: "CE304", name: "Construction Management", credits: 3, type: "core" },
                  { code: "CEE03", name: "Elective III \u2013 Bridge Engineering", credits: 3, type: "elective" },
                  { code: "CEE04", name: "Elective IV \u2013 Green Building", credits: 3, type: "elective" }
                ]
              },
              {
                year: 4,
                semester1: [
                  { code: "CEE05", name: "Elective V \u2013 Smart Infrastructure", credits: 3, type: "elective" },
                  { code: "CE491", name: "Major Project Phase I", credits: 8, type: "project" },
                  { code: "CE492", name: "Seminar", credits: 2, type: "project" }
                ],
                semester2: [
                  { code: "CE493", name: "Major Project Phase II", credits: 10, type: "project" },
                  { code: "CE494", name: "Industrial Training", credits: 4, type: "project" }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "soe-ee",
        name: "Electrical Engineering",
        shortName: "EE",
        hod: "Prof. Manoj Srivastava",
        programmes: [
          {
            id: "btech-ee",
            name: "Bachelor of Technology in Electrical Engineering",
            shortName: "B.Tech EE",
            duration: 4,
            degree: "B.Tech",
            totalCredits: 160,
            curriculum: [
              {
                year: 1,
                semester1: [
                  { code: "EE101", name: "Basic Electrical Engineering", credits: 4, type: "core" },
                  { code: "MA101", name: "Engineering Mathematics I", credits: 4, type: "core" },
                  { code: "PH101", name: "Engineering Physics", credits: 3, type: "core" },
                  { code: "EE102", name: "Circuit Analysis", credits: 3, type: "core" },
                  { code: "EE101L", name: "Electrical Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "EE103", name: "Electromagnetic Fields", credits: 4, type: "core" },
                  { code: "EE104", name: "Electrical Machines I", credits: 4, type: "core" },
                  { code: "MA102", name: "Engineering Mathematics II", credits: 4, type: "core" },
                  { code: "EE104L", name: "Machines Lab I", credits: 2, type: "lab" }
                ]
              },
              {
                year: 2,
                semester1: [
                  { code: "EE201", name: "Electrical Machines II", credits: 4, type: "core" },
                  { code: "EE202", name: "Power Systems I", credits: 4, type: "core" },
                  { code: "EE203", name: "Control Systems", credits: 4, type: "core" },
                  { code: "EE204", name: "Analog Electronics", credits: 3, type: "core" },
                  { code: "EE201L", name: "Machines Lab II", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "EE205", name: "Power Systems II", credits: 4, type: "core" },
                  { code: "EE206", name: "Power Electronics", credits: 4, type: "core" },
                  { code: "EE207", name: "Signals & Systems", credits: 3, type: "core" },
                  { code: "EE208", name: "Measurement & Instrumentation", credits: 3, type: "core" },
                  { code: "EE205L", name: "Power Systems Lab", credits: 2, type: "lab" }
                ]
              },
              {
                year: 3,
                semester1: [
                  { code: "EE301", name: "Electrical Drives", credits: 4, type: "core" },
                  { code: "EE302", name: "Digital Signal Processing", credits: 3, type: "core" },
                  { code: "EEE01", name: "Elective I \u2013 Renewable Energy", credits: 3, type: "elective" },
                  { code: "EEE02", name: "Elective II \u2013 Smart Grid", credits: 3, type: "elective" },
                  { code: "EE301L", name: "Drives Lab", credits: 2, type: "lab" }
                ],
                semester2: [
                  { code: "EE303", name: "High Voltage Engineering", credits: 4, type: "core" },
                  { code: "EE304", name: "Power System Protection", credits: 3, type: "core" },
                  { code: "EEE03", name: "Elective III \u2013 Electric Vehicles", credits: 3, type: "elective" },
                  { code: "EEE04", name: "Elective IV \u2013 Microgrids", credits: 3, type: "elective" }
                ]
              },
              {
                year: 4,
                semester1: [
                  { code: "EEE05", name: "Elective V \u2013 AI in Power Systems", credits: 3, type: "elective" },
                  { code: "EE491", name: "Major Project Phase I", credits: 8, type: "project" },
                  { code: "EE492", name: "Seminar", credits: 2, type: "project" }
                ],
                semester2: [
                  { code: "EE493", name: "Major Project Phase II", credits: 10, type: "project" },
                  { code: "EE494", name: "Industrial Training", credits: 4, type: "project" }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];
export {
  schools
};
