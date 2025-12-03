import { Family, User, AppRole } from "../types.js";

const API_URL = "/api";

// ---------------------------------------------------------
// LOCAL STORAGE (offline mode)
// ---------------------------------------------------------
const LOCAL_STORAGE_FAMILIES_KEY = "ampa_families_data";
const LOCAL_STORAGE_USERS_KEY = "ampa_users_data";

const defaults: User[] = [
  { username: "MPM", password: "R2d2c3po", name: "Super Administrador", role: AppRole.SUPERADMIN },
  { username: "admin", password: "Pimiento", name: "Administrador", role: AppRole.ADMIN },
  { username: "usuario", password: "agustinos", name: "Usuario Lector", role: AppRole.USER },
];

// --------- FAMILIAS LOCAL STORAGE ----------
const getLocalFamilies = (): Family[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_FAMILIES_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalFamilies = (families: Family[]) => {
  localStorage.setItem(LOCAL_STORAGE_FAMILIES_KEY, JSON.stringify(families));
};

// --------- USUARIOS LOCAL STORAGE ----------
const getLocalUsers = (): User[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);

  if (data) return JSON.parse(data);

  const defaults: User[] = [
    { username: "MPM", password: "R2d2c3po", name: "Super Administrador", role: "SUPERADMIN" },
    { username: "admin", password: "Pimiento", name: "Administrador", role: "ADMIN" },
    { username: "usuario", password: "agustinos", name: "Usuario Lector", role: "USER" },
  ];

  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(defaults));
  return defaults;
};

const saveLocalUsers = (users: User[]) => {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
};

// ---------------------------------------------------------
// API + Local fallback
// ---------------------------------------------------------

// =========== FAMILIAS ===========
export const getFamilies = async (): Promise<Family[]> => {
  try {
    const response = await fetch(`${API_URL}/families`);
    if (!response.ok) throw new Error("API unavailable");
    return await response.json();
  } catch (error) {
    console.warn("Modo offline: usando LocalStorage");
    return getLocalFamilies();
  }
};

export const saveFamily = async (family: Family): Promise<Family> => {
  try {
    const response = await fetch(`${API_URL}/families`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(family),
    });

    if (!response.ok) throw new Error("API error");

    return await response.json();
  } catch (error) {
    console.warn("Guardando en local (offline)");

    const families = getLocalFamilies();
    const index = families.findIndex(f => f.id === family.id);

    if (index >= 0) families[index] = family;
    else families.push(family);

    saveLocalFamilies(families);

    return family;
  }
};

export const deleteFamily = async (id: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/families/${id}`, { method: "DELETE" });
  } catch (error) {
    console.warn("Eliminando en local (offline)");

    const families = getLocalFamilies().filter(f => f.id !== id);
    saveLocalFamilies(families);
  }
};

// =========== GENERAR ID LOCAL ===========
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

// =========== SIGUIENTE NÚMERO DE SOCIO ===========
export const getNextMembershipNumber = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/next-membership-number`);
    if (!response.ok) throw new Error("API error");

    const data = await response.json();
    return data.number;
  } catch (error) {
    console.warn("Generando número de socio offline");

    const families = getLocalFamilies();
    if (families.length === 0) return "001";

    const maxNum = families.reduce((acc, curr) => {
      const n = parseInt(curr.membershipNumber, 10);
      return isNaN(n) ? acc : Math.max(acc, n);
    }, 0);

    return (maxNum + 1).toString().padStart(3, "0");
  }
};

// =========== USUARIOS ===========
export const getUsers = async (): Promise<User[]> => {
  try {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch {
    return getLocalUsers();
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
  } catch {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.username === user.username);
    if (index >= 0) users[index] = user;
    else users.push(user);
    saveLocalUsers(users);
  }
};

export const deleteUser = async (username: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/users?username=${username}`, { method: "DELETE" });
  } catch {
    const users = getLocalUsers().filter(u => u.username !== username);
    saveLocalUsers(users);
  }
};

// =========== IMPORTACIÓN MASIVA ===========
export const importFamilies = async (families: Family[]): Promise<void> => {
  try {
    await fetch(`${API_URL}/families`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ families }),
    });
  } catch {
    const existing = getLocalFamilies();

    families.forEach(f => {
      const idx = existing.findIndex(e => e.id === f.id);
      if (idx >= 0) existing[idx] = f;
      else existing.push(f);
    });

    saveLocalFamilies(existing);
  }
};
