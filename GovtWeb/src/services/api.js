import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== AUTH =====
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
};

// ===== ADMIN =====
export const adminAPI = {
  // Stats
  getStats: () => api.get('/admin/stats'),
  
  // Departments
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  getDepartmentStats: (id) => api.get(`/admin/departments/${id}/stats`),
  getDepartmentReports: (id, status) => 
    api.get(`/admin/departments/${id}/reports`, { params: { status } }),
  getDepartmentWorkers: (id) => api.get(`/admin/departments/${id}/workers`),
  
  // Reports
  getPendingReports: () => api.get('/admin/reports/pending'),
  getAllReports: (status, departmentId) => 
    api.get('/admin/reports', { params: { status, department_id: departmentId } }),
  approveReport: (id, data) => api.post(`/admin/reports/${id}/approve`, data),
  rejectReport: (id, reason) => api.post(`/admin/reports/${id}/reject`, { reason }),
  assignWorker: (id, data) => api.post(`/admin/reports/${id}/assign`, data),
  getReportHistory: (id) => api.get(`/admin/reports/${id}/history`),
  suggestDepartment: (category) => api.get(`/admin/suggest-department/${category}`),
  
  // Workers
  getAllWorkers: () => api.get('/admin/workers'),
  updateWorkerStatus: (id, status) => 
    api.put(`/admin/workers/${id}/status`, { worker_status: status }),
};

// ===== REPORTS =====
export const reportsAPI = {
  getAll: (status, category) => 
    api.get('/reports', { params: { status, category } }),
  getById: (id) => api.get(`/reports/${id}`),
  update: (id, data) => api.put(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`),
};

// ===== USERS =====
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getWorkers: () => api.get('/users/role/worker'),
};

export default api;
