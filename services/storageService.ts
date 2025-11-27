
import { Family, FamilyStatus, Role, User, AppRole } from '../types';

const API_URL = 'http://localhost:3001/api';

// --- HELPERS LOCAL STORAGE (FALLBACK) ---
const LOCAL_STORAGE_FAMILIES_KEY = 'ampa_families_data';
const LOCAL_STORAGE_USERS_KEY = 'ampa_users_data';

const getLocalFamilies = (): Family[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_FAMILIES_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalFamilies = (families: Family[]) => {
  localStorage.setItem(LOCAL_STORAGE_FAMILIES_KEY, JSON.stringify(families));
};

const getLocalUsers = (): any[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
  if (data) return JSON.parse(data);
  
  // Usuarios por defecto si no existen
  const defaults = [
    { username: 'MPM', password: 'R2d2c3po', name: 'Super Administrador', role: 'SUPERADMIN' },
    { username: 'admin', password: 'Pimiento', name: 'Administrador', role: 'ADMIN' },
    { username: 'usuario', password: 'agustinos', name: 'Usuario Lector', role: 'USER' }
  ];
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(defaults));
  return defaults;
};

const saveLocalUsers = (users: any[]) => {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
};

// --- FAMILIAS ---

export const getFamilies = async (): Promise<Family[]> => {
  try {
    const response = await fetch(`${API_URL}/families`);
    if (!response.ok) throw new Error('Server unavailable');
    return await response.json();
  } catch (error) {
    console.warn("Servidor no disponible. Usando modo LocalStorage (Offline).");
    return getLocalFamilies();
  }
};

export const saveFamily = async (family: Family): Promise<Family> => {
  try {
    const response = await fetch(`${API_URL}/families`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(family)
    });
    if (!response.ok) throw new Error('Server error');
    return await response.json();
  } catch (error) {
    console.warn("Servidor no disponible. Guardando en LocalStorage.");
    const families = getLocalFamilies();
    const index = families.findIndex(f => f.id === family.id);
    if (index >= 0) {
      families[index] = family;
    } else {
      families.push(family);
    }
    saveLocalFamilies(families);
    return family;
  }
};

export const deleteFamily = async (id: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/families/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.warn("Servidor no disponible. Eliminando de LocalStorage.");
    const families = getLocalFamilies();
    const filtered = families.filter(f => f.id !== id);
    saveLocalFamilies(filtered);
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const getNextMembershipNumber = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/next-membership-number`);
    if (!response.ok) throw new Error('Server error');
    const data = await response.json();
    return data.number;
  } catch (error) {
    // Lógica de cálculo local
    const families = getLocalFamilies();
    if (families.length === 0) return '001';
    
    const max = families.reduce((acc, curr) => {
      const val = parseInt(curr.membershipNumber, 10);
      const safeNum = isNaN(val) ? 0 : val;
      return Math.max(acc, safeNum);
    }, 0);
    
    return (max + 1).toString().padStart(3, '0');
  }
};

// --- USUARIOS ---

export const getUsers = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error('Server error');
    return await response.json();
  } catch (error) {
    console.warn("Servidor no disponible. Usando usuarios locales.");
    return getLocalUsers();
  }
};

export const saveUser = async (user: any): Promise<void> => {
  try {
    await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
  } catch (error) {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.username === user.username);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    saveLocalUsers(users);
  }
};

export const deleteUser = async (username: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/users/${username}`, { method: 'DELETE' });
  } catch (error) {
    const users = getLocalUsers();
    const filtered = users.filter(u => u.username !== username);
    saveLocalUsers(filtered);
  }
};

// --- HERRAMIENTAS DB ---

export const importFamilies = async (families: Family[]): Promise<void> => {
   try {
    await fetch(`${API_URL}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ families })
    });
   } catch (error) {
     const current = getLocalFamilies();
     // Fusión simple para modo local
     families.forEach(f => {
        const idx = current.findIndex(c => c.id === f.id);
        if (idx >= 0) current[idx] = f;
        else current.push(f);
     });
     saveLocalFamilies(current);
   }
};
