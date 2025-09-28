import axios, { AxiosResponse } from 'axios'
import toast from 'react-hot-toast'
import { ApiResponse } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('401エラー発生 - 認証切れ')
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Instead of immediate redirect, show alert first
      if (!window.location.pathname.includes('/login')) {
        toast.error('認証が切れました。ログインページに移動します。')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
      return Promise.reject(error)
    }

    const message = error.response?.data?.error || 'An error occurred'
    toast.error(message)
    return Promise.reject(error)
  }
)

export default api