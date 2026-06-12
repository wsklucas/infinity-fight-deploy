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
export const getMyStudent = () => api.get('/students/me').then(r => r.data)
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
export const saveEvaluation = (id: string) =>
  api.post(`/evaluations/${id}/save`).then(r => r.data)
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

// Finance
export const getMyPayments = () => api.get('/finance/my-payments').then(r => r.data)
export const getPayments = (month: number, year: number) =>
  api.get('/finance/payments', { params: { month, year } }).then(r => r.data)
export const createPayment = (data: { student_id: string; plan: string; amount: number; month: number; year: number }) =>
  api.post('/finance/payments', data).then(r => r.data)
export const togglePayment = (id: string) =>
  api.patch(`/finance/payments/${id}/toggle`).then(r => r.data)
export const getExpenses = (month: number, year: number) =>
  api.get('/finance/expenses', { params: { month, year } }).then(r => r.data)
export const createExpense = (data: { description: string; amount: number; month: number; year: number }) =>
  api.post('/finance/expenses', data).then(r => r.data)
export const getFinanceSummary = (month: number, year: number) =>
  api.get('/finance/summary', { params: { month, year } }).then(r => r.data)
export const getFinanceHistory = () =>
  api.get('/finance/history').then(r => r.data)

// Lessons
export const getLessons = (params?: { from?: string; to?: string }) =>
  api.get('/lessons', { params }).then(r => r.data)
export const createLesson = (data: { title: string; type: string; date: string; time: string; duration_minutes?: number; student_ids?: string[] }) =>
  api.post('/lessons', data).then(r => r.data)
export const updateLessonStudents = (id: string, student_ids: string[], action: 'add' | 'remove') =>
  api.patch(`/lessons/${id}/students`, { student_ids, action }).then(r => r.data)
export const updateLessonStatus = (id: string, status: string) =>
  api.patch(`/lessons/${id}/status`, { status }).then(r => r.data)
export const deleteLesson = (id: string) =>
  api.delete(`/lessons/${id}`).then(r => r.data)

// Instructors
export const createInstructor = (data: { name: string; email: string }) =>
  api.post('/instructors', data).then(r => r.data)

// Sublevels
export const getSublevels = () => api.get('/sublevels').then(r => r.data)
export const getSublevel = (id: string) => api.get(`/sublevels/${id}`).then(r => r.data)
export const getFicha = (id: string) => api.get(`/sublevels/${id}/ficha`).then(r => r.data)

// History
export const getHistory = (limit?: number) =>
  api.get('/history', { params: limit ? { limit } : undefined }).then(r => r.data)

// Intake
export const submitIntakeAssessment = (data: {
  studentId: string
  triageData: Record<string, unknown>
  blockResults: Array<{ sublevelId: string; criterionResults: Array<{ criterionId: string; state: string }> }>
  focusNotes: string
}) => api.post('/intake', data).then(r => r.data)

export const getStudentIntake = (studentId: string) =>
  api.get(`/intake/student/${studentId}`).then(r => r.data)

// Account
export const firstPassword = (newPassword: string) =>
  api.patch('/auth/first-password', { newPassword }).then(r => r.data)

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.patch('/auth/password', { currentPassword, newPassword }).then(r => r.data)

export const resetStudentPassword = (studentId: string) =>
  api.patch(`/students/${studentId}/reset-password`).then(r => r.data)

// Academy settings
export const getAcademySettings = () => api.get('/academy/settings').then(r => r.data)
export const updateAcademySettings = (data: {
  pixKey?: string | null
  pixKeyType?: string | null
  pixRecipientName?: string | null
  pixBank?: string | null
}) => api.patch('/academy/settings', data).then(r => r.data)

// FichaItems (admin only)
export const createFichaItem = (data: { sublevelId: string; category: string; title: string; description?: string }) =>
  api.post('/ficha-items', data).then(r => r.data)
export const updateFichaItem = (id: string, data: { title?: string; description?: string | null; category?: string; sublevelId?: string }) =>
  api.patch(`/ficha-items/${id}`, data).then(r => r.data)
export const deleteFichaItem = (id: string) =>
  api.delete(`/ficha-items/${id}`)
export const duplicateFichaItem = (id: string, targetSublevelId: string) =>
  api.patch(`/ficha-items/${id}/duplicate`, { targetSublevelId }).then(r => r.data)
export const reorderFichaItems = (ids: string[]) =>
  api.patch('/ficha-items/reorder', { ids }).then(r => r.data)
