import { create } from 'zustand';

// Definimos los roles permitidos
export type Role = "Admin" | "Cajero" | "Mesero";

// Estructura de los usuarios
export interface User {
  id?: number | string;
  username: string;
  name?: string;
  address?: string; //direccion
  phone?: string; //telefono
  accountNumber?: string;
  role?: Role;
}

// Son los tipos que se van a pasar para typescript
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user?: User) => void;
  logout: () => void;
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

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('jwt_token') : false,
  user: getStoredUser(),
  
  // Función para iniciar sesión
  login: (token: string, user?: User) => {
    localStorage.setItem('jwt_token', token);
    // Si no se pasa usuario en el login simulado, asignamos uno por defecto tipo Admin para pruebas
    const userInfo: User = user || { 
      username: "admin", 
      name: "Administrador Principal", 
      role: "Admin" 
    };
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    set({ token, isAuthenticated: true, user: userInfo });
  },
  
  // Función para cerrar sesión
  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    set({ token: null, isAuthenticated: false, user: null });
  },
}));