export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export type AuthResponse = {
  token: string;
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type EventItem = {
  id: number;
  title: string;
  description: string;
  venue: string;
  eventDate: string;
  createdById: number | null;
  createdByName: string | null;
};

export type TeacherItem = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type EventForm = {
  title: string;
  description: string;
  venue: string;
  date: string;
  time: string;
};

export const emptyEventForm: EventForm = {
  title: '',
  description: '',
  venue: '',
  date: '',
  time: '',
};

export async function request<T>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const STORAGE_KEYS = {
  ADMIN: 'campus_admin_auth',
  TEACHER: 'campus_teacher_auth',
};

export function getAuth(role: 'ADMIN' | 'TEACHER'): AuthResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[role]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthResponse;
    if (parsed.role === role && parsed.token) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setAuth(role: 'ADMIN' | 'TEACHER', auth: AuthResponse | null): void {
  if (auth) {
    localStorage.setItem(STORAGE_KEYS[role], JSON.stringify(auth));
  } else {
    localStorage.removeItem(STORAGE_KEYS[role]);
  }
}

export function clearAuth(role?: 'ADMIN' | 'TEACHER'): void {
  if (role) {
    localStorage.removeItem(STORAGE_KEYS[role]);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ADMIN);
    localStorage.removeItem(STORAGE_KEYS.TEACHER);
  }
}
