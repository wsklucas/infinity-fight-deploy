import axios from 'axios'
import Cookies from 'js-cookie'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = Cookies.get('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = Cookies.get('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refresh_token: refresh })
          Cookies.set('access_token', data.access_token, { expires: 1/96 }) // 15min
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(r => r.data)

export const logout = (refresh_token: string) =>
  api.post('/auth/logout', { refresh_token })

// Students
export const getStudents = (status?: 'active' | 'inactive') =>
  api.get('/students', { params: status ? { status } : undefined }).then(r => r.data)
export const getStudent = (id: string) => api.get(`/students/${id}`).then(r => r.data)
export const createStudent = (data: { name: string; email: string }) =>
  api.post('/students', data).then(r => r.data)
export const updateStudent = (id: string, data: any) =>
  api.patch(`/students/${id}`, data).then(r => r.data)
export const updateStudentStatus = (id: string, active: boolean) =>
  api.patch(`/students/${id}/status`, { active }).then(r => r.data)

// Evaluations
export const createEvaluation = (data: { student_id: string; sublevel_id: string; type: string }) =>
  api.post('/evaluations', data).then(r => r.data)
export const updateEvaluationItems = (id: string, items: any[]) =>
  api.patch(`/evaluations/${id}/items`, { items }).then(r => r.data)
export const confirmAdvance = (id: string) =>
  api.post(`/evaluations/${id}/advance`).then(r => r.data)
export const getStudentEvaluations = (studentId: string) =>
  api.get(`/evaluations/student/${studentId}`).then(r => r.data)
export const submitIntake = (data: any) =>
  api.post('/evaluations/intake', data).then(r => r.data)

// Progress
export const getStudentProgress = (studentId: string) =>
  api.get(`/progress/student/${studentId}`).then(r => r.data)
export const getCurrentProgress = (studentId: string) =>
  api.get(`/progress/student/${studentId}/current`).then(r => r.data)

// Checkins
export const checkin = () => api.post('/checkins').then(r => r.data)
export const getCheckins = (studentId: string) =>
  api.get(`/checkins/student/${studentId}`).then(r => r.data)

// Feedbacks
export const sendFeedback = (student_id: string, text: string) =>
  api.post('/feedbacks', { student_id, text }).then(r => r.data)
export const getFeedbacks = (studentId: string) =>
  api.get(`/feedbacks/student/${studentId}`).then(r => r.data)

// Instructors
export const createInstructor = (data: { name: string; email: string; password: string }) =>
  api.post('/instructors', data).then(r => r.data)

// Sublevels
export const getSublevels = () => api.get('/sublevels').then(r => r.data)
export const getSublevel = (id: string) => api.get(`/sublevels/${id}`).then(r => r.data)
