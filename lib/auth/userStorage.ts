import { usersStorage } from "../storage/jsonStore";
import { hashPassword, comparePasswords } from "./password";

export interface UserPermissions {
  canSendSms: boolean;
  canManageSettings: boolean;
  canViewAllLogs: boolean;
  canManageUsers: boolean;
  canAccessAdminPanel: boolean;
}

export interface UserSettings {
  autoSmsEnabled: boolean;
  soundEnabled: boolean;
  snoozeDurationMinutes: number;
  emergencyContact: string;
  theme: "light" | "dark" | "system";
  emailNotification: boolean;
}

export interface UserIdentityInfo {
  tcKimlik?: string;
  birthDate?: string;
  gender?: "male" | "female" | "other" | "";
  bloodType?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "0+" | "0-" | "";
  chronicDiseases?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  city?: string;
  address?: string;
  isVerified?: boolean;
}

export interface StoredUser {
  id: string;
  name: string;
  phone: string;
  password: string;
  email?: string;
  role: "admin" | "moderator" | "user";
  permissions: UserPermissions;
  settings: UserSettings;
  identityInfo?: UserIdentityInfo;
  createdAt: string;
  lastLoginAt?: string;
  isSuspended?: boolean;
}

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  canSendSms: true,
  canManageSettings: true,
  canViewAllLogs: false,
  canManageUsers: false,
  canAccessAdminPanel: false,
};

export const ADMIN_PERMISSIONS: UserPermissions = {
  canSendSms: true,
  canManageSettings: true,
  canViewAllLogs: true,
  canManageUsers: true,
  canAccessAdminPanel: true,
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  autoSmsEnabled: true,
  soundEnabled: true,
  snoozeDurationMinutes: 10,
  emergencyContact: "",
  theme: "light",
  emailNotification: false,
};

// ── Public API ─────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<StoredUser[]> {
  return usersStorage.read();
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const users: StoredUser[] = await usersStorage.read();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByPhone(phone: string): Promise<StoredUser | null> {
  const users: StoredUser[] = await usersStorage.read();
  const cleanTarget = phone.replace(/\D/g, "");
  return (
    users.find((u) => {
      const cleanStored = u.phone.replace(/\D/g, "");
      return (
        cleanStored === cleanTarget ||
        cleanStored.slice(-10) === cleanTarget.slice(-10)
      );
    }) ?? null
  );
}

export async function saveUser(
  userData: Omit<StoredUser, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Promise<StoredUser> {
  const id = userData.id ?? `user_${Date.now()}`;
  const createdAt = userData.createdAt ?? new Date().toISOString();
  
  // Secure password hashing
  const securedPassword = await hashPassword(userData.password);

  const newUser: StoredUser = {
    ...userData,
    password: securedPassword,
    id,
    createdAt,
  };

  await usersStorage.update((users: StoredUser[]) => {
    const idx = users.findIndex((u) => u.id === id || u.phone === userData.phone);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...newUser };
    } else {
      users.push(newUser);
    }
    return users;
  });

  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<StoredUser>
): Promise<StoredUser | null> {
  let updatedUser: StoredUser | null = null;

  let updatePayload = { ...updates };
  if (updatePayload.password) {
    updatePayload.password = await hashPassword(updatePayload.password);
  }

  await usersStorage.update((users: StoredUser[]) => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) return users;

    users[idx] = {
      ...users[idx],
      ...updatePayload,
      id, // never change the id
      identityInfo: updatePayload.identityInfo
        ? { ...(users[idx].identityInfo ?? {}), ...updatePayload.identityInfo }
        : users[idx].identityInfo,
    };
    updatedUser = users[idx];
    return users;
  });

  return updatedUser;
}

export async function deleteUser(id: string): Promise<boolean> {
  let deleted = false;
  await usersStorage.update((users: StoredUser[]) => {
    const initialLen = users.length;
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length !== initialLen) {
      deleted = true;
    }
    return filtered;
  });
  return deleted;
}

export async function findUserByCredentials(
  phoneOrUsername: string,
  password?: string
): Promise<StoredUser | null> {
  const users: StoredUser[] = await usersStorage.read();

  const cleanInput = phoneOrUsername.trim().toLowerCase().replace(/\D/g, "");

  const user = users.find((u) => {
    const cleanPhone = u.phone.replace(/\D/g, "");
    const matchPhone =
      cleanPhone.slice(-10) === cleanInput.slice(-10) ||
      cleanPhone === cleanInput;
    const matchName =
      u.name.toLowerCase() === phoneOrUsername.trim().toLowerCase();
    const matchEmail =
      (u.email ?? "").toLowerCase() === phoneOrUsername.trim().toLowerCase();
    const matchAdmin =
      phoneOrUsername.trim().toLowerCase() === "admin" && u.role === "admin";
    const matchTc = u.identityInfo?.tcKimlik === phoneOrUsername.trim();

    return matchPhone || matchName || matchEmail || matchAdmin || matchTc;
  });

  if (!user) return null;

  if (password !== undefined && password !== null) {
    const matches = await comparePasswords(password, user.password);
    if (!matches) return null;
  }

  return user;
}
