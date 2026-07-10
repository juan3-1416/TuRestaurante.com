import { create } from 'zustand';
import { apiClient } from '@/lib/axios';

// Definimos los roles permitidos
export type Role = "ADMIN" | "CASHIER" | "WAITER";

export interface User {
  id?: number | string;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  address?: string;
  phone_number?: string;
  bank_account_number?: string;
  role: Role;
  is_active?: boolean;
}

// Son los tipos que se van a pasar para typescript
interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, refreshToken?: string, user?: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user_info');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('jwt_token') : false,
  user: getStoredUser(),
  
  // Función para iniciar sesión
  login: (token: string, refreshToken?: string, user?: User) => {
    localStorage.setItem('jwt_token', token);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    
    set({ token, refreshToken: refreshToken || null, isAuthenticated: true });

    if (user) {
      localStorage.setItem('user_info', JSON.stringify(user));
      set({ user });
    } else {
      get().fetchUser();
    }
  },
  
  // Función para cerrar sesión
  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    set({ token: null, refreshToken: null, isAuthenticated: false, user: null });
  },

  // Obtener perfil del usuario desde el Backend
  fetchUser: async () => {
    try {
      const response = await apiClient.get('/users/me/');
      const userInfo = response.data;
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      set({ user: userInfo });
    } catch (error) {
      console.error("Error obteniendo perfil del usuario", error);
      // Opcionalmente llamar a logout() si da 401
    }
  }
}));