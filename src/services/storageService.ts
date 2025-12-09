// src/services/storageService.ts
// Servicio unificado para consumir la API real de Next.js

import { Family, Member, User } from "../types";

// ------------------------------------------------------
// Helper genérico para fetch con cookie y errores
// ------------------------------------------------------
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: "include", // 🔥 siempre enviar cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options,
  });

  if (!res.ok) {
    let errorText = "";
    try {
      errorText = await res.text();
    } catch {}

    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  // Si no hay contenido que parsear
  if (res.status === 204) return undefined as T;

  return res.json();
}

//////////////////////////////////////////////////////////
// 🔐 AUTH — LOGIN / LOGOUT
//////////////////////////////////////////////////////////

export async function login(username: string, password: string): Promise<User> {
  return apiRequest<User>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function logoutAPI(): Promise<void> {
  return apiRequest("/api/auth/logout", {
    method: "POST"
  });
}

//////////////////////////////////////////////////////////
// 👪 FAMILIES
//////////////////////////////////////////////////////////

export async function getFamilies(): Promise<Family[]> {
  return apiRequest<Family[]>("/api/families");
}

export async function getFamily(id: number): Promise<Family> {
  return apiRequest<Family>(`/api/families/${id}`);
}

export async function saveFamily(family: Family): Promise<Family> {
  const body = JSON.stringify(family);

  if (family.id) {
    return apiRequest<Family>(`/api/families/${family.id}`, {
      method: "PUT",
      body,
    });
  }

  return apiRequest<Family>("/api/families", {
    method: "POST",
    body,
  });
}

export async function deleteFamily(id: number): Promise<void> {
  return apiRequest(`/api/families/${id}`, {
    method: "DELETE",
  });
}

//////////////////////////////////////////////////////////
// 👤 MEMBERS
//////////////////////////////////////////////////////////

export async function getMembers(): Promise<Member[]> {
  return apiRequest<Member[]>("/api/members");
}

export async function getMember(id: number): Promise<Member> {
  return apiRequest<Member>(`/api/members/${id}`);
}

export async function saveMember(member: Member): Promise<Member> {
  const body = JSON.stringify(member);

  if (member.id) {
    return apiRequest<Member>(`/api/members/${member.id}`, {
      method: "PUT",
      body,
    });
  }

  return apiRequest<Member>("/api/members", {
    method: "POST",
    body,
  });
}

export async function deleteMember(id: number): Promise<void> {
  return apiRequest(`/api/members/${id}`, {
    method: "DELETE",
  });
}

//////////////////////////////////////////////////////////
// 👥 USERS (admin)
//////////////////////////////////////////////////////////

export async function getUsers(): Promise<User[]> {
  return apiRequest<User[]>("/api/users");
}

export async function getUser(id: number): Promise<User> {
  return apiRequest<User>(`/api/users/${id}`);
}

export async function saveUser(user: User): Promise<User> {
  const body = JSON.stringify(user);

  if (user.id) {
    return apiRequest<User>(`/api/users/${user.id}`, {
      method: "PUT",
      body,
    });
  }

  return apiRequest<User>("/api/users", {
    method: "POST",
    body,
  });
}

export async function deleteUser(id: number): Promise<void> {
  return apiRequest(`/api/users/${id}`, {
    method: "DELETE",
  });
}

//////////////////////////////////////////////////////////
// 🔧 UTILIDADES
//////////////////////////////////////////////////////////

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};
