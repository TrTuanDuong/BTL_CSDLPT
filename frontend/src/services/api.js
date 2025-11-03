import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Tạo axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - thêm token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu token hết hạn (401) và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Gọi API refresh token
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('accessToken', access);

        // Retry request với token mới
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại - đăng xuất
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Chỉ redirect nếu không phải đang ở trang login
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => axios.post(`${API_URL}/auth/login/`, credentials),
  register: (userData) => api.post('/api/users/', userData),
  logout: (refreshToken) => api.post('/api/users/logout/', { refresh_token: refreshToken }),
  getProfile: () => api.get('/api/users/profile/'),
  updateProfile: (data) => api.put('/api/users/update_profile/', data),
  changePassword: (data) => api.post('/api/users/change_password/', data),
};

// Movies API
export const moviesAPI = {
  getAll: (params) => api.get('/api/movies/', { params }),
  getById: (id) => api.get(`/api/movies/${id}/`),
  create: (data) => api.post('/api/movies/', data),
  update: (id, data) => api.put(`/api/movies/${id}/`, data),
  delete: (id) => api.delete(`/api/movies/${id}/`),
};

// Genres API
export const genresAPI = {
  getAll: () => api.get('/api/genres/'),
  create: (data) => api.post('/api/genres/', data),
  update: (id, data) => api.put(`/api/genres/${id}/`, data),
  delete: (id) => api.delete(`/api/genres/${id}/`),
};

// Showtimes API
export const showtimesAPI = {
  getAll: (params) => api.get('/api/showtime/', { params }),
  getById: (id) => api.get(`/api/showtime/${id}/`),
  getSeats: (id) => api.get(`/api/showtime/${id}/seats/`),
  getByMovie: (movieId) => api.get('/api/showtime/by_movie/', { params: { movie_id: movieId } }),
  getToday: () => api.get('/api/showtime/today/'),
  getUpcoming: () => api.get('/api/showtime/upcoming/'),
  adminAll: () => api.get('/api/showtime/admin_all/'), // ✅ THÊM: Endpoint phân nhóm theo trạng thái
  create: (data) => api.post('/api/showtime/', data),
  update: (id, data) => api.put(`/api/showtime/${id}/`, data),
  delete: (id) => api.delete(`/api/showtime/${id}/`),
};

// Auditoriums API
export const auditoriumsAPI = {
  getAll: () => api.get('/api/auditoriums/'),
  getById: (id) => api.get(`/api/auditoriums/${id}/`),
  getSeats: (id) => api.get(`/api/auditoriums/${id}/seats/`),
  create: (data) => api.post('/api/auditoriums/', data),
  update: (id, data) => api.put(`/api/auditoriums/${id}/`, data),
  delete: (id) => api.delete(`/api/auditoriums/${id}/`),
  regenerateSeats: (id) => api.post(`/api/auditoriums/${id}/regenerate_seats/`),
};

// Bookings API
export const bookingsAPI = {
  getAll: (params) => api.get('/api/booking/', { params }),
  getById: (id) => api.get(`/api/booking/${id}/`),
  create: (data) => api.post('/api/booking/', data),
  cancel: (id) => api.post(`/api/booking/${id}/cancel/`),
  getHistory: (params) => api.get('/api/booking/history/', { params }),
  getUpcoming: () => api.get('/api/booking/upcoming/'),
};

// Payments API
export const paymentsAPI = {
  getAll: (params) => api.get('/api/payments/', { params }),
  getById: (id) => api.get(`/api/payments/${id}/`),
  create: (data) => api.post('/api/payments/', data),
  refund: (id, data) => api.post(`/api/payments/${id}/refund/`, data),
  getReceipt: (id) => api.get(`/api/payments/${id}/receipt/`),
  getHistory: () => api.get('/api/payments/history/'),
};

export default api;