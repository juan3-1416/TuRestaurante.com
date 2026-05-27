import { create } from 'zustand';

// Definimos la estructura del usuario
export interface User {
  id?: number | string;
  username: string;
  name?: string;
  email?: string;
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
    const userInfo = user || { username: "cajero", name: "Cajero Principal" };
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