export interface Student {
  id?: string; // Firestore document ID
  lastName: string;
  firstName: string;
  uidZalo: string;
  grade: string;
  studentId: string;
  role: string;
  status: string;
  bannedUntil?: number | null; // timestamp in ms, null = permanent ban
}

export const RoleEnum = {
  ctv: "Cộng tác viên",
  mem: "Thành viên",
  admin: "Quản lý",
} as const;

export const StatusEnum = {
  active: "Hoạt động",
  banned: "Khoá",
} as const;

export const ROLE_LIST = [RoleEnum.ctv, RoleEnum.mem, RoleEnum.admin];

export type RoleType = (typeof RoleEnum)[keyof typeof RoleEnum];
export type StatusType = (typeof StatusEnum)[keyof typeof StatusEnum];

export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: trimmed, lastName: "" };
  }
  const firstName = parts[parts.length - 1];
  const lastName = parts.slice(0, parts.length - 1).join(" ");
  return { firstName, lastName };
}

export function getFullName(student: Student): string {
  return `${student.lastName} ${student.firstName}`.trim();
}

