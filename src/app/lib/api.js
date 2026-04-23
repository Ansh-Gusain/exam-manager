// API base URL - update this if your XAMPP path differs
export const API_BASE = 'http://localhost/exam-manager/backend';

function getToken() {
  return localStorage.getItem('jwt_token');
}

export function setToken(token) {
  localStorage.setItem('jwt_token', token);
}

export function clearToken() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('jwt_user');
}

export function getStoredUser() {
  try {
    const u = localStorage.getItem('jwt_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem('jwt_user', JSON.stringify(user));
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned invalid response (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed: ${res.status}`);
  }

  return data;
}

// Auth
export const api = {
  auth: {
    login: (identifier, password) =>
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
    signup: (name, email, password, role) =>
      request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password, role }) }),
    googleAuth: (credential) =>
      request('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
    forgotPassword: (email) =>
      request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token, password) =>
      request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
    verifyResetToken: (token) =>
      request(`/api/auth/verify-reset?token=${token}`),
    me: () => request('/api/auth/me'),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
  },

  dashboard: {
    get: () => request('/api/dashboard'),
  },

  students: {
    list: (params = {}) => request('/api/students?' + new URLSearchParams(params)),
    get: (id) => request(`/api/students/${id}`),
    create: (data) => request('/api/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/students/${id}`, { method: 'DELETE' }),
    bulk: (students) => request('/api/students/bulk', { method: 'POST', body: JSON.stringify({ students }) }),
  },

  faculty: {
    list: (params = {}) => request('/api/faculty?' + new URLSearchParams(params)),
    get: (id) => request(`/api/faculty/${id}`),
    create: (data) => request('/api/faculty', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/faculty/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/faculty/${id}`, { method: 'DELETE' }),
    bulk: (faculty) => request('/api/faculty/bulk', { method: 'POST', body: JSON.stringify({ faculty }) }),
    setLeave: (id, status, reason) => request(`/api/faculty/${id}/leave`, { method: 'POST', body: JSON.stringify({ status, reason }) }),
  },

  rooms: {
    list: (params = {}) => request('/api/rooms?' + new URLSearchParams(params)),
    create: (data) => request('/api/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/rooms/${id}`, { method: 'DELETE' }),
  },

  exams: {
    list: (params = {}) => request('/api/exams?' + new URLSearchParams(params)),
    get: (id) => request(`/api/exams/${id}`),
    create: (data) => request('/api/exams', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/exams/${id}`, { method: 'DELETE' }),
  },

  seating: {
    list: (params = {}) => request('/api/seating?' + new URLSearchParams(params)),
    allocate: (examId) => request('/api/seating/allocate', { method: 'POST', body: JSON.stringify({ examId: Number(examId) }) }),
    allocateByDate: (date, shift) => request('/api/seating/allocate-by-date', { method: 'POST', body: JSON.stringify({ date, shift }) }),
    clearByExam: (examId) => request(`/api/seating/exam/${examId}`, { method: 'DELETE' }),
    clearByDate: (date, shift) => request(`/api/seating/date/${encodeURIComponent(date)}?shift=${encodeURIComponent(shift || '')}`, { method: 'DELETE' }),
  },

  invigilation: {
    list: (params = {}) => request('/api/invigilation?' + new URLSearchParams(params)),
    allocate: (examId) => request('/api/invigilation/allocate', { method: 'POST', body: JSON.stringify({ examId: Number(examId) }) }),
    allocateByDate: (date) => request('/api/invigilation/allocate-by-date', { method: 'POST', body: JSON.stringify({ date }) }),
    update: (id, facultyId) => request(`/api/invigilation/${id}`, { method: 'PUT', body: JSON.stringify({ facultyId: Number(facultyId) }) }),
    updateRoom: (roomId, examId, chiefFacultyId, assistantFacultyId) => request('/api/invigilation/update-room', {
      method: 'POST',
      body: JSON.stringify({ roomId: Number(roomId), examId: Number(examId), chiefFacultyId: Number(chiefFacultyId), assistantFacultyId: Number(assistantFacultyId) })
    }),
    clearByExam: (examId) => request(`/api/invigilation/exam/${examId}`, { method: 'DELETE' }),
  },

  attendance: {
    list: (params = {}) => request('/api/attendance?' + new URLSearchParams(params)),
    generate: (examId, roomId) => request('/api/attendance/generate', { method: 'POST', body: JSON.stringify({ examId: Number(examId), roomId: Number(roomId) }) }),
    update: (id, data) => request(`/api/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    markAllPresent: (examId, roomId) => request('/api/attendance/mark-all-present', { method: 'POST', body: JSON.stringify({ examId: Number(examId), roomId: Number(roomId) }) }),
  },

  replacements: {
    list: (params = {}) => request('/api/replacements?' + new URLSearchParams(params)),
    create: (data) => request('/api/replacements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/replacements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  reports: {
    roomUtilization: () => request('/api/reports/room-utilization'),
    facultyDuties: () => request('/api/reports/faculty-duties'),
    attendance: () => request('/api/reports/attendance'),
    distribution: () => request('/api/reports/distribution'),
  },

  academic: {
    schools: () => request('/api/academic/schools'),
    departments: (school) => request('/api/academic/departments' + (school ? `?school=${school}` : '')),
    branches: (department) => request('/api/academic/branches' + (department ? `?department=${department}` : '')),
    structure: () => request('/api/academic/structure'),
  },
};
