import { Family, FamilyStatus, Role, User, AppRole } from '../types';

const STORAGE_KEY = 'familias_data_v2';
const USERS_STORAGE_KEY = 'ampa_users_v1';

// Initial Mock Data to populate the app if empty
const MOCK_DATA: Family[] = [
  {
    id: 'fam_1',
    membershipNumber: '001',
    familyName: 'Familia García López',
    address: 'Calle Mayor 123, Madrid',
    phone: '910000000',
    email: 'familia.garcia@email.com',
    joinDate: '2023-01-15',
    status: FamilyStatus.ACTIVE,
    members: [
      { id: 'm_1', firstName: 'Juan', lastName: 'García', birthDate: '1980-05-12', role: Role.FATHER, gender: 'H', email: 'juan.garcia@work.com', phone: '600111222' },
      { id: 'm_2', firstName: 'María', lastName: 'López', birthDate: '1982-08-23', role: Role.MOTHER, gender: 'M', email: 'maria.lopez@personal.com', phone: '600333444' },
      { id: 'm_3', firstName: 'Lucas', lastName: 'García', birthDate: '2010-02-10', role: Role.CHILD, gender: 'H' },
      { id: 'm_4', firstName: 'Sofía', lastName: 'García', birthDate: '2012-11-05', role: Role.CHILD, gender: 'M' },
      { id: 'm_5', firstName: 'Leo', lastName: 'García', birthDate: '2015-06-20', role: Role.CHILD, gender: 'H' }
    ]
  },
  {
    id: 'fam_2',
    membershipNumber: '002',
    familyName: 'Familia Ruiz Martínez',
    address: 'Av. Constitución 45, Valencia',
    phone: '960000000',
    email: 'ruiz.mtnez@email.com',
    joinDate: '2023-03-10',
    status: FamilyStatus.ACTIVE,
    members: [
      { id: 'm_7', firstName: 'Elena', lastName: 'Martínez', birthDate: '1981-04-15', role: Role.MOTHER, gender: 'M', email: 'elena.m@design.com' },
      { id: 'm_8', firstName: 'Ana', lastName: 'Ruiz', birthDate: '2008-09-09', role: Role.CHILD, gender: 'M' },
      { id: 'm_9', firstName: 'Pablo', lastName: 'Ruiz', birthDate: '2011-03-30', role: Role.CHILD, gender: 'H' }
    ]
  }
];

// Initial Users
const DEFAULT_USERS = [
  {
    username: 'admin',
    password: 'Pimiento',
    name: 'Administrador',
    role: AppRole.ADMIN
  },
  {
    username: 'usuario',
    password: 'agustinos',
    name: 'Usuario Lector',
    role: AppRole.USER
  }
];

export const getFamilies = (): Family[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
    return MOCK_DATA;
  }
  return JSON.parse(data);
};

export const saveFamily = (family: Family): void => {
  const families = getFamilies();
  const index = families.findIndex(f => f.id === family.id);
  if (index >= 0) {
    families[index] = family;
  } else {
    families.push(family);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(families));
};

export const deleteFamily = (id: string): void => {
  const families = getFamilies();
  const filtered = families.filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const getNextMembershipNumber = (): string => {
  const families = getFamilies();
  if (families.length === 0) return '001';
  const max = families.reduce((acc, curr) => Math.max(acc, parseInt(curr.membershipNumber || '0', 10)), 0);
  return (max + 1).toString().padStart(3, '0');
};

// --- USER MANAGEMENT ---

export const getUsers = (): any[] => {
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return JSON.parse(data);
};

export const saveUser = (user: any): void => {
  const users = getUsers();
  const index = users.findIndex(u => u.username === user.username);
  if (index >= 0) {
    users[index] = user; // Update existing (e.g. password change)
  } else {
    users.push(user); // Add new
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const deleteUser = (username: string): void => {
  const users = getUsers();
  const filtered = users.filter(u => u.username !== username);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
};