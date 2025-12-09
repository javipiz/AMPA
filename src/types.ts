// ===========================================
// ENUMS
// ===========================================

export enum Role {
  FATHER = "Padre",
  MOTHER = "Madre",
  CHILD = "Hijo/a",
  TUTOR = "Tutor",
}

export enum FamilyStatus {
  ACTIVE = "Activo",
  INACTIVE = "Baja",
}

export enum AppRole {
  SUPERADMIN = "SUPERADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

// ===========================================
// INTERFACES PRINCIPALES
// ===========================================

export interface User {
  id?: number;          // Ahora number
  username: string;
  name: string;
  role: AppRole;
  password?: string;
}

// Un miembro pertenece a una familia mediante familyId
export interface Member {
  id?: number;          // Ahora number
  familyId?: number;    // FK real en BD
  firstName: string;
  lastName: string;
  birthDate: string;    // YYYY-MM-DD
  role: Role;
  gender?: string;
  notes?: string;
  email?: string;
  phone?: string;
}

export interface Family {
  id?: number;          // Ahora number
  membershipNumber: string;
  familyName: string;
  address: string;
  phone: string;
  email: string;
  joinDate: string;
  status: FamilyStatus;
  members: Member[];

  // Opcionales de auditoría
  aiSummary?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}

export type ViewState =
  | "dashboard"
  | "list"
  | "form"
  | "details"
  | "config";
