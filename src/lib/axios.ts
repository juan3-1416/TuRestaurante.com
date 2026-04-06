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