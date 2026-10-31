export interface DokumenOrganisasi {
  id: string;
  judul: string;
  deskripsi: string;
  file_url: string;
  file_name: string;
  file_size?: string;
  urutan?: number;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_DOKUMEN_ORGANISASI: DokumenOrganisasi[] = [
  {
    id: "doc-1",
    judul: "AD HIMASI",
    deskripsi: "Anggaran Dasar HIMASI ISB Atma Luhur",
    file_url: "/documents/AD-ART-HIMASI-AtmaLuhur.pdf",
    file_name: "AD-ART-HIMASI-AtmaLuhur.pdf",
    file_size: "1.2 MB",
    urutan: 1,
  },
  {
    id: "doc-2",
    judul: "ART HIMASI",
    deskripsi: "Anggaran Rumah Tangga HIMASI ISB Atma Luhur",
    file_url: "/documents/BPPK-Pedoman-Pengurus-HIMASI.pdf",
    file_name: "BPPK-Pedoman-Pengurus-HIMASI.pdf",
    file_size: "1.8 MB",
    urutan: 2,
  },
  {
    id: "doc-3",
    judul: "SK Kepengurusan",
    deskripsi: "SK Kepengurusan HIMASI ISB Atma Luhur",
    file_url: "/documents/SK-Kepengurusan-HIMASI-AtmaLuhur.pdf",
    file_name: "SK-Kepengurusan-HIMASI-AtmaLuhur.pdf",
    file_size: "850 KB",
    urutan: 3,
  },
];

