// Tipe Data Kontrak untuk Apresia-SI Showcase & Submisi Mahasiswa
export type ApresiasiCategory = "lomba" | "karya" | "magang";

export interface ApresiasiItem {
  id: string;
  title: string;
  category: ApresiasiCategory;
  categoryLabel: string; // e.g. "Juara Lomba", "Karya Aplikasi", "Magang & MSIB"
  badge: string; // e.g. "Juara 1 Nasional", "Best Paper", "MSIB Batch 6", "Startup Founder"
  studentName: string;
  teamMembers?: string;
  nim?: string;
  batch: string; // e.g. "2023", "2024"
  organizerOrCompany: string; // Penyelenggara Lomba / Perusahaan Mitra Magang
  level?: "Kampus" | "Regional" | "Nasional" | "Internasional";
  description: string;
  fullStory?: string;
  mentorOrLecturer?: string;
  image: string;
  liveUrl?: string;
  githubUrl?: string;
  proofUrl?: string;
  likes: number;
  featured?: boolean;
  createdAt: string;
}

export interface ApresiasiSubmissionPayload {
  category: ApresiasiCategory;
  title: string;
  studentName: string;
  teamMembers?: string;
  nim: string;
  batch: string;
  contact: string;
  organizerOrCompany: string;
  level?: string;
  description: string;
  linkDemoOrRepo?: string;
  proofUrl?: string;
}

export interface ApresiasiSubmisiItem {
  id: string;
  category: ApresiasiCategory;
  title: string;
  studentName: string;
  teamMembers?: string;
  nim: string;
  batch: string;
  contact: string;
  organizerOrCompany: string;
  level?: string;
  description: string;
  linkDemoOrRepo?: string;
  proofUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}


