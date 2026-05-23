import axios from 'axios';
import { supabase } from '../utils/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const BACKEND_URL = API_URL.replace('/api', '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 600000, 
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        supabase.auth.signOut();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Autenticación
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Recetas
export const recipesAPI = {
  getAll: (params) => api.get('/recipes/mine', { params }),
  getById: (id) => api.get(`/recipes/${id}`),
  getPopular: (limit = 10) => api.get('/recipes/popular', { params: { limit } }),
  create: (formData, config = {}) => api.post('/recipes', formData, config),
  update: (id, formData, config = {}) => api.put(`/recipes/${id}`, formData, config),
  delete: (id) => api.delete(`/recipes/${id}`),
};

// Regiones
export const regionsAPI = {
  getAll: () => api.get('/regions'),
  getById: (id) => api.get(`/regions/${id}`),
  getProvinces: (id) => api.get(`/regions/${id}/provinces`),
};

// Provincias
export const provincesAPI = {
  getAll: (params) => api.get('/provinces', { params }),
  getById: (id) => api.get(`/provinces/${id}`),
};

// Dashboard / Stats
export const dashboardAPI = {
  getStats: (region) => api.get('/dashboard/stats', { params: { region, mine: 'true' } }),
};

// Feedback
export const feedbackAPI = {
  getAll: (params) => api.get('/feedback', { params }),
  getByRecipe: (recipeId) => api.get(`/feedback/recipe/${recipeId}`),
  create: (data) => api.post('/feedback', data),
  delete: (id) => api.delete(`/feedback/${id}`),
};

// Health
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
