// TypeScript Type Definitions for Role-Based Access Control (RBAC)

import {
  ROLE_PERMISSIONS,
  canAccessTab as canAccessTabRule,
  canPublishContent as canPublishContentRule,
  canEditPublishedContent as canEditPublishedContentRule,
  ROLE_LABELS as ROLE_LABELS_CONST,
  ROLE_BADGE_STYLES as ROLE_BADGE_STYLES_CONST,
} from "./auth-rules";

export type UserRole = "super_admin" | "bph" | "medkominfo" | "humas_biskraf";

export type ContentStatus = "draft" | "pending_review" | "published" | "rejected";

export type DashboardTabKey =
  | "overview"
  | "banner"
  | "berita"
  | "kartu-qr"
  | "dokumen"
  | "kalender"
  | "persuratan"
  | "aspirasi"
  | "apresiasi"
  | "absensi"
  | "rekap-absensi"
  | "database"
  | "users";

export interface UserProfile {
  id: string;
  email: string;
  nama_lengkap: string;
  jabatan: string;
  divisi: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = ROLE_LABELS_CONST;

export const ROLE_BADGE_STYLES: Record<UserRole, string> = ROLE_BADGE_STYLES_CONST;

export function canAccessTab(role: UserRole | string | undefined | null, tabKey: DashboardTabKey | string): boolean {
  return canAccessTabRule(role, tabKey);
}

export function canPublishContent(role: UserRole | string | undefined | null): boolean {
  return canPublishContentRule(role);
}

export function canEditPublishedContent(role: UserRole | string | undefined | null): boolean {
  return canEditPublishedContentRule(role);
}

export { ROLE_PERMISSIONS };

