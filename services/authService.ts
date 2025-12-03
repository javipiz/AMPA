import { AppRole, User } from "../types";
import { getUsers } from "./storageService";

export const login = async (username: string, password: string): Promise<User> => {
  try {
    const users = await getUsers();
    const user = users.find((u: any) => u.username === username && u.password === password);
    
    if (user) {
      const { password, ...safeUser } = user;
      return safeUser;
    } else {
      throw new Error('Credenciales incorrectas');
    }
  } catch (error) {
    throw error;
  }
};

export const logout = (): void => {
  localStorage.removeItem('ampa_session_user');
};

export const getSessionUser = (): User | null => {
  const stored = localStorage.getItem('ampa_session_user');
  return stored ? JSON.parse(stored) : null;
};

export const setSessionUser = (user: User) => {
  localStorage.setItem('ampa_session_user', JSON.stringify(user));
};