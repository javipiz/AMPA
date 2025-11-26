import { AppRole, User } from "../types";
import { getUsers } from "./storageService";

export const login = (username: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    // Simulate network delay for better UX
    setTimeout(() => {
      const users = getUsers();
      const user = users.find((u: any) => u.username === username && u.password === password);
      
      if (user) {
        // Return user without password
        const { password, ...safeUser } = user;
        resolve(safeUser);
      } else {
        reject(new Error('Credenciales incorrectas'));
      }
    }, 800);
  });
};

export const logout = (): void => {
  // Clear any session storage if implemented later
  localStorage.removeItem('ampa_session_user');
};

export const getSessionUser = (): User | null => {
  const stored = localStorage.getItem('ampa_session_user');
  return stored ? JSON.parse(stored) : null;
};

export const setSessionUser = (user: User) => {
  localStorage.setItem('ampa_session_user', JSON.stringify(user));
};