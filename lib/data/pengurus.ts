// Data Master Pengurus HIMASI ISB Atma Luhur Kabinet REKSABUDAYA
export interface PengurusMember {
  id: string;
  nim: string;
  nama: string;
  jabatan: string;
  divisi: string;
  qrToken: string;
  image: string;
  email: string;
}

export const DAFTAR_PENGURUS_HIMASI: PengurusMember[] = [
  // BPH
  {
    id: "pengurus-201",
    nim: "231150001",
    nama: "JORDI VENZEN",
    jabatan: "Ketua Umum HIMASI",
    divisi: "BPH",
    qrToken: "HIMASI-QR-231150001-JV",
    image: "/DSC01203.png",
    email: "jordi.venzen@atmaluhur.ac.id",
  },
  {
    id: "pengurus-202",
    nim: "231150002",
    nama: "MUHAMMAD FADHIL",
    jabatan: "Wakil Ketua Umum",
    divisi: "BPH",
    qrToken: "HIMASI-QR-231150002-MF",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
    email: "fadhil@atmaluhur.ac.id",
  },
  {
    id: "pengurus-203",
    nim: "231150003",
    nama: "ANINDYA PUTRI",
    jabatan: "Sekretaris Umum",
    divisi: "BPH",
    qrToken: "HIMASI-QR-231150003-AP",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
    email: "anindya@atmaluhur.ac.id",
  },
  {
    id: "pengurus-204",
    nim: "231150004",
    nama: "ZAHRA SALSABILA",
    jabatan: "Bendahara Umum",
    divisi: "BPH",
    qrToken: "HIMASI-QR-231150004-ZS",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
    email: "zahra@atmaluhur.ac.id",
  },

  // MEDKOMINFO
  {
    id: "pengurus-301",
    nim: "231150011",
    nama: "LEYSA REGITA PARHUSIP",
    jabatan: "Kord. Divisi Medkominfo",
    divisi: "MEDKOMINFO",
    qrToken: "HIMASI-QR-231150011-LR",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
    email: "leysa@atmaluhur.ac.id",
  },
  {
    id: "pengurus-302",
    nim: "231150012",
    nama: "MUHAMMAD EVAN ELUA",
    jabatan: "Anggota Medkominfo",
    divisi: "MEDKOMINFO",
    qrToken: "HIMASI-QR-231150012-ME",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop",
    email: "evan@atmaluhur.ac.id",
  },
  {
    id: "pengurus-303",
    nim: "231150013",
    nama: "BEATRIKS MARIA",
    jabatan: "Anggota Medkominfo",
    divisi: "MEDKOMINFO",
    qrToken: "HIMASI-QR-231150013-BM",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    email: "beatriks@atmaluhur.ac.id",
  },
  {
    id: "pengurus-304",
    nim: "231150014",
    nama: "DHIFA ARYA PRATAMA",
    jabatan: "Anggota Medkominfo",
    divisi: "MEDKOMINFO",
    qrToken: "HIMASI-QR-231150014-DA",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop",
    email: "dhifa@atmaluhur.ac.id",
  },

  // HUMAS
  {
    id: "pengurus-401",
    nim: "231150021",
    nama: "NABILA SYAHRANI",
    jabatan: "Kord. Divisi Humas",
    divisi: "HUMAS",
    qrToken: "HIMASI-QR-231150021-NS",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
    email: "nabila@atmaluhur.ac.id",
  },
  {
    id: "pengurus-402",
    nim: "231150022",
    nama: "RIAN PRATAMA",
    jabatan: "Anggota Humas",
    divisi: "HUMAS",
    qrToken: "HIMASI-QR-231150022-RP",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    email: "rian@atmaluhur.ac.id",
  },

  // BISNIS KREATIF
  {
    id: "pengurus-501",
    nim: "231150031",
    nama: "FELICIA ANGELICA",
    jabatan: "Kord. Bisnis Kreatif",
    divisi: "BISNIS KREATIF",
    qrToken: "HIMASI-QR-231150031-FA",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
    email: "felicia@atmaluhur.ac.id",
  },
  {
    id: "pengurus-502",
    nim: "231150032",
    nama: "KEVIN SAPUTRA",
    jabatan: "Anggota Bisnis Kreatif",
    divisi: "BISNIS KREATIF",
    qrToken: "HIMASI-QR-231150032-KS",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    email: "kevin@atmaluhur.ac.id",
  },

  // PENASIHAT
  {
    id: "pengurus-601",
    nim: "221150001",
    nama: "DIMAS WAHYU",
    jabatan: "Ketua Dewan Penasihat",
    divisi: "PENASIHAT",
    qrToken: "HIMASI-QR-221150001-DW",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop",
    email: "dimas@atmaluhur.ac.id",
  },
];
