import { create } from 'zustand';

// Son los tipos que se van a pasar para typescript
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('jwt_token') : false,
  
  // Función para iniciar sesión
  login: (token: string) => {
    localStorage.setItem('jwt_token', token);
    set({ token, isAuthenticated: true });
  },
  
  // Función para cerrar sesión
  logout: () => {
    localStorage.removeItem('jwt_token');
    set({ token: null, isAuthenticated: false });
  },
}));