// src/services/authService.ts

import { User } from "../types";

const SESSION_KEY = "ampa_session_user";

// -------------------------------
// Hacer login REAL (API)
// -------------------------------
export async function login(username: string, password: string): Promise<User> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login Error ${res.status}: ${text}`);
  }

  return res.json();
}

// -------------------------------
// Session helpers
// -------------------------------
export function setSessionUser(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
