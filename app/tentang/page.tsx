import Link from "next/link";
import { BookOpen, Target, Heart, Award, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Tentang HIMASI - Himpunan Mahasiswa Sistem Informasi ISB Atma Luhur",
  description: "Mengenal profil, sejarah, visi misi, dan makna lambang HIMASI ISB Atma Luhur.",
};

export default function TentangPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#00296E] to-[#00173d] text-white py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" />
            Profil Kelembagaan
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Tentang HIMASI Atma Luhur
          </h1>
          <p className="text-slate-200 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Himpunan Mahasiswa Sistem Informasi (HIMASI) ISB Atma Luhur adalah wadah aspirasi, kreasi, kepemimpinan, dan kolaborasi bagi seluruh mahasiswa Program Studi Sistem Informasi.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Visi & Misi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-[#00296E]/10 text-[#00296E] flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#00296E] mb-3">Visi HIMASI</h2>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Menjadikan Himpunan Mahasiswa Sistem Informasi sebagai organisasi yang unggul, berintegritas, adaptif terhadap perkembangan teknologi informasi, serta berkontribusi nyata bagi almamater dan masyarakat.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-[#0094E0]/10 text-[#0094E0] flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#00296E] mb-3">Misi HIMASI</h2>
            <ul className="space-y-2.5 text-slate-600 text-sm sm:text-base">
              <li className="flex items-start gap-2">
                <span className="text-[#0094E0] font-bold mt-0.5">•</span>
                <span>Mengembangkan potensi akademik dan keahlian praktis mahasiswa di bidang Sistem Informasi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0094E0] font-bold mt-0.5">•</span>
                <span>Menjadi jembatan aspirasi yang transparan, responsif, dan solutif antara mahasiswa dan program studi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0094E0] font-bold mt-0.5">•</span>
                <span>Menjalin sinergi dan kemitraan strategis dengan industri, komunitas teknologi, dan ikatan alumni.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Nilai Budaya Kabinet */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#00296E]">Kabinet REKSABUDAYA</h2>
              <p className="text-xs text-slate-500">Nilai & Filosofi Kepengurusan Periode Aktif</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-[#00296E] text-sm mb-1">Riksa (Menjaga)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Menjaga integritas organisasi, nilai kebersamaan, dan tradisi berprestasi yang berkesinambungan.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-[#00296E] text-sm mb-1">Budaya Kolaboratif</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Membangun ekosistem kerja yang inklusif, menghargai setiap ide dan kontribusi anggota.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-[#00296E] text-sm mb-1">Daya Cipta & Aksi</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Berorientasi pada solusi nyata, inovasi teknologi, dan dampak positif bagi masyarakat kampus.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
            <Link
              href="/profil"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#00296E] hover:text-[#0094E0] transition-colors"
            >
              <span>Lihat Struktur & Pengurus Kabinet</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
