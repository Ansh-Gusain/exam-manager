import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { toast } from 'sonner';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [exams, setExams] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [seatingAllocations, setSeatingAllocations] = useState([]);
  const [invigilationAllocations, setInvigilationAllocations] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [replacementLogs, setReplacementLogs] = useState([]);
  const [currentRole, setCurrentRole] = useState('admin');
  const [loggedInFacultyId, setLoggedInFacultyId] = useState(null);
  const [loggedInStudentId, setLoggedInStudentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  // Normalize API response — handles both array and {data:[]} shapes
  // Also converts numeric IDs to strings for consistent comparisons
  const normalize = (res) => {
    // Handle null/undefined
    if (!res) return [];
    
    // Extract array from response
    let arr;
    if (Array.isArray(res)) {
      arr = res;
    } else if (res.data && Array.isArray(res.data)) {
      arr = res.data;
    } else if (res.allocations && Array.isArray(res.allocations)) {
      arr = res.allocations;
    } else {
      // If it's a single object, wrap it in an array
      arr = typeof res === 'object' ? [res] : [];
    }
    
    return arr.map(item => {
      if (!item || typeof item !== 'object') return item;
      const out = { ...item };
      // Stringify IDs for consistent === comparisons in components
      if (out.id !== undefined)          out.id          = String(out.id);
      if (out.examId !== undefined)      out.examId      = String(out.examId);
      if (out.exam_id !== undefined)     out.examId      = String(out.exam_id);
      if (out.roomId !== undefined)      out.roomId      = String(out.roomId);
      if (out.room_id !== undefined)     out.roomId      = String(out.room_id);
      if (out.studentId !== undefined)   out.studentId   = String(out.studentId);
      if (out.student_id !== undefined)  out.studentId   = String(out.student_id);
      if (out.facultyId !== undefined)   out.facultyId   = String(out.facultyId);
      if (out.faculty_id !== undefined)  out.facultyId   = String(out.faculty_id);
      if (out.seat_number !== undefined) out.seatNumber  = Number(out.seat_number);
      if (out.seatNumber !== undefined)  out.seatNumber  = Number(out.seatNumber);
      if (out.total_duties !== undefined) out.totalDuties = Number(out.total_duties);
      if (out.is_available !== undefined) out.isAvailable = Boolean(out.is_available);
      if (out.has_projector !== undefined) out.hasProjector = Boolean(out.has_projector);
      if (out.rows_count !== undefined)  out.rowsCount   = Number(out.rows_count);
      if (out.cols_count !== undefined)  out.colsCount   = Number(out.cols_count);
      if (out.start_time !== undefined)  out.startTime   = out.start_time;
      if (out.end_time !== undefined)    out.endTime     = out.end_time;
      if (out.course_code !== undefined) out.courseCode  = out.course_code;
      if (out.employee_id !== undefined) out.employeeId  = out.employee_id;
      // Ensure semester is always a number for === comparisons
      if (out.semester !== undefined)    out.semester    = Number(out.semester);
      // Ensure roll_number is always mapped to rollNumber
      if (out.roll_number !== undefined) out.rollNumber  = out.roll_number;
      return out;
    });
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setDataError(null);
    try {
      const [s, f, r, e, seat, invig, att, rep] = await Promise.all([
        api.students.list(),
        api.faculty.list(),
        api.rooms.list(),
        api.exams.list(),
        api.seating.list(),
        api.invigilation.list(),
        api.attendance.list(),
        api.replacements.list(),
      ]);
      setStudents(normalize(s));
      setFaculty(normalize(f));
      setRooms(normalize(r));
      setExams(normalize(e));
      setSeatingAllocations(normalize(seat));
      setInvigilationAllocations(normalize(invig));
      setAttendanceRecords(normalize(att));
      setReplacementLogs(normalize(rep));
    } catch (err) {
      const msg = err.message || 'Failed to load data';
      setDataError(msg);
      toast.error('Could not load data: ' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Partial refresh helpers — avoid reloading everything for single-entity changes
  const refreshStudents    = useCallback(async () => { try { setStudents(normalize(await api.students.list())); } catch {} }, []);
  const refreshFaculty     = useCallback(async () => { try { setFaculty(normalize(await api.faculty.list())); } catch {} }, []);
  const refreshRooms       = useCallback(async () => { try { setRooms(normalize(await api.rooms.list())); } catch {} }, []);
  const refreshExams       = useCallback(async () => { try { setExams(normalize(await api.exams.list())); } catch {} }, []);
  const refreshSeating     = useCallback(async () => { try { setSeatingAllocations(normalize(await api.seating.list())); } catch {} }, []);
  const refreshInvigilation= useCallback(async () => { try { setInvigilationAllocations(normalize(await api.invigilation.list())); } catch {} }, []);
  const refreshAttendance  = useCallback(async () => { try { setAttendanceRecords(normalize(await api.attendance.list())); } catch {} }, []);
  const refreshReplacements= useCallback(async () => { try { setReplacementLogs(normalize(await api.replacements.list())); } catch {} }, []);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) refreshAll();
  }, [refreshAll]);

  return (
    <StoreContext.Provider value={{
      students, setStudents,
      rooms, setRooms,
      exams, setExams,
      faculty, setFaculty,
      seatingAllocations, setSeatingAllocations,
      invigilationAllocations, setInvigilationAllocations,
      attendanceRecords, setAttendanceRecords,
      replacementLogs, setReplacementLogs,
      currentRole, setCurrentRole,
      loggedInFacultyId, setLoggedInFacultyId,
      loggedInStudentId, setLoggedInStudentId,
      loading, dataError, refreshAll,
      refreshStudents, refreshFaculty, refreshRooms, refreshExams,
      refreshSeating, refreshInvigilation, refreshAttendance, refreshReplacements,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
