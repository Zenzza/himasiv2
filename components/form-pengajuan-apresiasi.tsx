"use client";

import { useState } from "react";
import {
  Trophy,
  Code,
  Briefcase,
  PaperPlaneTilt,
  CheckCircle,
  ArrowCounterClockwise,
  User,
  GraduationCap,
  Phone,
  Buildings,
  Link,
  FileText,
  Spinner,
  Sparkle,
  Users,
  ShieldCheck,
  Check,
} from "@phosphor-icons/react";
import { submitApresiasiMahasiswa } from "@/lib/data/apresiasi";
import { type ApresiasiCategory, type ApresiasiSubmissionPayload } from "@/lib/types/apresiasi";

export default function FormPengajuanApresiasi() {
  const [category, setCategory] = useState<ApresiasiCategory>("lomba");
  const [studentName, setStudentName] = useState("");
  const [teamMembers, setTeamMembers] = useState("");
  const [nim, setNim] = useState("");
  const [batch, setBatch] = useState("2024");
  const [contact, setContact] = useState("");
  const [title, setTitle] = useState("");
  const [organizerOrCompany, setOrganizerOrCompany] = useState("");
  const [level, setLevel] = useState<"Kampus" | "Regional" | "Nasional" | "Internasional">("Nasional");
  const [description, setDescription] = useState("");
  const [linkDemoOrRepo, setLinkDemoOrRepo] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validasi field wajib
    if (!studentName.trim()) {
      setErrorMsg("Nama Lengkap Mahasiswa / Ketua Tim wajib diisi.");
      return;
    }
    if (!nim.trim()) {
      setErrorMsg("NIM Mahasiswa wajib diisi.");
      return;
    }
    if (!contact.trim()) {
      setErrorMsg("Kontak aktif (WhatsApp atau Email) wajib diisi untuk verifikasi tim HIMASI.");
      return;
    }
    if (!title.trim()) {
      setErrorMsg("Judul Prestasi, Karya, atau Program Magang wajib diisi.");
      return;
    }
    if (!organizerOrCompany.trim()) {
      setErrorMsg("Penyelenggara Lomba atau Nama Perusahaan Tempat Magang wajib diisi.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Deskripsi singkat pencapaian wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    const payload: ApresiasiSubmissionPayload = {
      category,
      title: title.trim(),
      studentName: studentName.trim(),
      teamMembers: teamMembers.trim() || undefined,
      nim: nim.trim(),
      batch,
      contact: contact.trim(),
      organizerOrCompany: organizerOrCompany.trim(),
      level: category === "magang" ? "Nasional" : level,
      description: description.trim(),
      linkDemoOrRepo: linkDemoOrRepo.trim() || undefined,
      proofUrl: proofUrl.trim() || undefined,
    };

    try {
      const res = await submitApresiasiMahasiswa(payload);
      setSubmitMessage(res.message);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMsg("Terjadi kendala saat mengirim pengajuan. Silakan coba kembali.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setCategory("lomba");
    setStudentName("");
    setTeamMembers("");
    setNim("");
    setBatch("2024");
    setContact("");
    setTitle("");
    setOrganizerOrCompany("");
    setLevel("Nasional");
    setDescription("");
    setLinkDemoOrRepo("");
    setProofUrl("");
    setErrorMsg(null);
  };

  return (
    <div className="rounded-[28px] sm:rounded-[32px] bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,41,110,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      {/* SISI KIRI (lg:col-span-5): Branding & Panduan Submisi Apresiasi */}
      <div className="lg:col-span-5 bg-gradient-to-br from-[#00296E] via-[#002257] to-[#00173d] p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0094E0]/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative z-10">

          <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
            Bangga Berkarya & Berprestasi Bersama HIMASI
          </h3>

          <p className="mt-3 text-slate-200 text-xs sm:text-sm leading-relaxed font-normal">
            Punya prestasi membanggakan di kompetisi, inovasi aplikasi mandiri, atau pengalaman magang & MSIB? Daftarkan karyamu agar diabadikan di galeri Apresia-SI dan menginspirasi seluruh mahasiswa Sistem Informasi ISB Atma Luhur!
          </p>

          <div className="mt-8 space-y-3.5 text-xs text-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#0094E0]/20 border border-[#0094E0]/40 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-[#0094E0]" />
              </div>
              <p>
                <strong className="text-white">Kurasi & Verifikasi Pengurus:</strong> Data akan ditinjau oleh Divisi AKREMA HIMASI sebelum diterbitkan di showcase.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#0094E0]/20 border border-[#0094E0]/40 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-[#0094E0]" />
              </div>
              <p>
                <strong className="text-white">Eksposur Portofolio Mahasiswa:</strong> Publikasi resmi di media sosial dan website HIMASI yang bisa dicantumkan pada resume atau LinkedIn Anda.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#0094E0]/20 border border-[#0094E0]/40 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-[#0094E0]" />
              </div>
              <p>
                <strong className="text-white">Terbuka untuk Semua Angkatan:</strong> Mahasiswa aktif program studi Sistem Informasi ISB Atma Luhur.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note Sisi Kiri */}
        <div className="relative z-10 mt-8 pt-5 border-t border-white/10 text-[11px] text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Verifikasi resmi pengurus Kabinet Reksabudaya HIMASI</span>
        </div>
      </div>

      {/* SISI KANAN (lg:col-span-7): Formulir Submisi Mandiri */}
      <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
        {isSubmitted ? (
          /* State Feedback Sukses */
          <div className="py-8 px-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#00296E] tracking-tight">
              Pengajuan Berhasil Dikirim!
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {submitMessage}
            </p>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Kategori:</span>
                <span className="font-semibold text-[#00296E] uppercase">
                  {category === "lomba" ? "🏆 Pemenang Lomba" : category === "karya" ? "💻 Karya & Inovasi" : "💼 Magang & MSIB"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pengaju:</span>
                <span className="font-semibold text-slate-800">{studentName} ({nim})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Judul:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[220px]">{title}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00296E] hover:bg-[#001f52] text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <ArrowCounterClockwise className="w-4 h-4 text-[#0094E0]" />
                <span>Ajukan Prestasi Lainnya</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Header Form */}
            <div>
              <h4 className="text-lg sm:text-xl font-bold text-[#00296E] tracking-tight">
                Formulir Pengajuan Apresia-SI
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Lengkapi formulir di bawah ini dengan data asli dan valid untuk proses kurasi pengurus.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. KATEGORI PRESTASI */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Kategori Apresiasi <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("lomba")}
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    category === "lomba"
                      ? "bg-[#00296E] text-white border-[#00296E] shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <Trophy
                    weight={category === "lomba" ? "fill" : "regular"}
                    className={`w-4 h-4 ${category === "lomba" ? "text-amber-300" : "text-[#0094E0]"}`}
                  />
                  <span className="text-center text-[11px] sm:text-xs">Pemenang Lomba</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("karya")}
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    category === "karya"
                      ? "bg-[#00296E] text-white border-[#00296E] shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <Code
                    weight={category === "karya" ? "fill" : "regular"}
                    className={`w-4 h-4 ${category === "karya" ? "text-cyan-300" : "text-[#0094E0]"}`}
                  />
                  <span className="text-center text-[11px] sm:text-xs">Karya & Startup</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("magang")}
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    category === "magang"
                      ? "bg-[#00296E] text-white border-[#00296E] shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <Briefcase
                    weight={category === "magang" ? "fill" : "regular"}
                    className={`w-4 h-4 ${category === "magang" ? "text-emerald-300" : "text-[#0094E0]"}`}
                  />
                  <span className="text-center text-[11px] sm:text-xs">Magang & MSIB</span>
                </button>
              </div>
            </div>

            {/* 2. NAMA LENGKAP & NIM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nama Mahasiswa / Ketua <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Contoh: Muhammad Fadhil"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  NIM <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Contoh: 231150002"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 3. ANGKATAN & KONTAK WA/EMAIL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Angkatan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all cursor-pointer"
                  >
                    <option value="2026">Angkatan 2026</option>
                    <option value="2025">Angkatan 2025</option>
                    <option value="2024">Angkatan 2024</option>
                    <option value="2023">Angkatan 2023</option>
                    <option value="2022">Angkatan 2022</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kontak WhatsApp / Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="0812-xxxx-xxxx / email aktif"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 4. ANGGOTA TIM (OPSIONAL) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Anggota Tim (Opsional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Users className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={teamMembers}
                  onChange={(e) => setTeamMembers(e.target.value)}
                  placeholder="Contoh: Anindya Putri, Zahra Salsabila"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all"
                />
              </div>
            </div>

            {/* 5. JUDUL PRESTASI / KARYA & PENYELENGGARA / MITRA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {category === "lomba"
                    ? "Judul / Capaian Lomba"
                    : category === "karya"
                    ? "Nama Karya / Startup"
                    : "Posisi & Tempat Magang"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      category === "lomba"
                        ? "Contoh: Juara 1 UI/UX Hackathon"
                        : category === "karya"
                        ? "Contoh: SmartAgri Bangka IoT"
                        : "Contoh: Frontend Engineer Intern"
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {category === "magang" ? "Perusahaan / Instansi Mitra" : "Penyelenggara / Mitra"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Buildings className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={organizerOrCompany}
                    onChange={(e) => setOrganizerOrCompany(e.target.value)}
                    placeholder={
                      category === "magang"
                        ? "Contoh: Bank Mandiri / Tokopedia"
                        : "Contoh: Kemendikbudristek / BSSN"
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 6. TINGKAT PRESTASI (KHUSUS LOMBA / KARYA) */}
            {category !== "magang" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tingkat Prestasi / Cakupan
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["Kampus", "Regional", "Nasional", "Internasional"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        level === lvl
                          ? "bg-[#00296E] text-white border-[#00296E]"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 7. DESKRIPSI SINGKAT */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Deskripsi Singkat Inovasi / Pencapaian <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan ringkasan karya, inovasi yang dibuat, atau kontribusi selama magang..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all resize-none"
              />
            </div>

            {/* 8. TAUTAN REPO / DEMO / BUKTI SERTIFIKAT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tautan Live Demo / GitHub (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Link className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={linkDemoOrRepo}
                    onChange={(e) => setLinkDemoOrRepo(e.target.value)}
                    placeholder="https://github.com/... atau demo"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tautan Sertifikat / Foto Bukti (Drive/Cloud)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Link className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="Link Google Drive / portofolio"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00296E] to-[#0040a8] hover:from-[#001f52] hover:to-[#00296E] text-white text-xs sm:text-sm font-bold shadow-[0_4px_16px_rgba(0,41,110,0.2)] hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 animate-spin text-white" />
                    <span>Mengirimkan Pengajuan...</span>
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt className="w-4 h-4 text-[#0094E0]" />
                    <span>Kirim Pengajuan Apresia-SI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

