import axios from "axios";

export const apiClient = axios.create({
    // Aqui pondremos la URL de nuestro backend
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

//Configuracion para inyectar el token JWT en las peticiones
apiClient.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
    if (token && config.headers){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

// Interceptor para refrescar el token si caduca
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

      if (refreshToken) {
        try {
          const response = await axios.post(`${apiClient.defaults.baseURL}/users/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          localStorage.setItem('jwt_token', newAccessToken);
          
          if (response.data.refresh) {
            localStorage.setItem('refresh_token', response.data.refresh);
          }

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch {
          // Si el refresh token caducó o es inválido, cerramos sesión
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);