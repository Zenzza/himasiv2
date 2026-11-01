"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  Info,
  X,
  Code2,
  Lock,
  Wrench,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react";
import {
  UserProfile,
  UserRole,
  ROLE_LABELS,
  ROLE_BADGE_STYLES,
} from "@/lib/types/auth";
import { getAllUserProfiles, updateUserRole } from "@/lib/supabase/users";
import { getMaintenanceMode, setMaintenanceMode } from "@/lib/supabase/system-settings";

interface UserManagerProps {
  currentUserEmail?: string;
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin:
    "Akses penuh tanpa batas: Pengelolaan teknis, Database Supabase, dan Manajemen Hak Pengguna.",
  bph: "Pimpinan organisasi: Monitoring ringkasan, absensi QR, rekapitulasi PDF, aspirasi, dan dokumen.",
  medkominfo:
    "Editor & Pengelola Harian: Meninjau (Acc/Tolak) draf berita, kalender, banner, dan dokumen publik.",
  humas_biskraf:
    "Kontributor Konten: Membuat draf konten berita, agenda, dan showcase (membutuhkan persetujuan Medkominfo sebelum tayang).",
};

export default function UserManager({ currentUserEmail }: UserManagerProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  // State Modal Ubah Role
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>("humas_biskraf");
  const [savingRole, setSavingRole] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // SQL Migration Banner Toggle
  const [showSqlMigration, setShowSqlMigration] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Maintenance Mode (503) State
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceEstimated, setMaintenanceEstimated] = useState("~15-30 Menit");
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [maintenanceToast, setMaintenanceToast] = useState<string | null>(null);

  useEffect(() => {
    getMaintenanceMode().then((settings) => {
      setMaintenanceEnabled(settings.enabled);
      if (settings.estimatedEnd) {
        setMaintenanceEstimated(settings.estimatedEnd);
      }
    });
  }, []);

  const handleToggleMaintenance = async () => {
    setSavingMaintenance(true);
    try {
      const nextState = !maintenanceEnabled;
      await setMaintenanceMode(nextState, undefined, maintenanceEstimated);
      setMaintenanceEnabled(nextState);
      setMaintenanceToast(
        nextState
          ? "Mode pemeliharaan sistem AKTIF. Pengunjung umum kini dialihkan ke /error/503."
          : "Mode pemeliharaan sistem DINONAKTIFKAN. Seluruh halaman web dapat diakses normal."
      );
      setTimeout(() => setMaintenanceToast(null), 4000);
    } catch (err) {
      console.error("Gagal mengubah mode maintenance:", err);
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleUpdateEstimatedTime = async (newTime: string) => {
    setMaintenanceEstimated(newTime);
    if (maintenanceEnabled) {
      await setMaintenanceMode(true, undefined, newTime);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUserProfiles();
      setProfiles(data);
    } catch (err) {
      console.error("Gagal memuat data pengguna:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter & Search Logic
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchRole = roleFilter === "all" || p.role === roleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nama_lengkap.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.divisi.toLowerCase().includes(q) ||
        p.jabatan.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [profiles, roleFilter, searchQuery]);

  // Statistik Distribusi Role
  const stats = useMemo(() => {
    const counts = {
      super_admin: 0,
      bph: 0,
      medkominfo: 0,
      humas_biskraf: 0,
    };
    profiles.forEach((p) => {
      if (counts[p.role] !== undefined) {
        counts[p.role]++;
      }
    });
    return counts;
  }, [profiles]);

  const handleOpenRoleModal = (user: UserProfile) => {
    setSelectedUser(user);
    setTargetRole(user.role);
    setActionError(null);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setSavingRole(true);
    setActionError(null);

    try {
      const res = await updateUserRole(
        selectedUser.id,
        targetRole,
        selectedUser.email,
        currentUserEmail
      );

      if (res.success) {
        setActionSuccess(res.message);
        // Perbarui list lokal
        setProfiles((prev) =>
          prev.map((p) => (p.id === selectedUser.id ? { ...p, role: targetRole } : p))
        );
        setTimeout(() => {
          setSelectedUser(null);
          setActionSuccess(null);
        }, 1500);
      } else {
        setActionError(res.message);
      }
    } catch (err: any) {
      setActionError(err.message || "Terjadi kesalahan saat memperbarui peran.");
    } finally {
      setSavingRole(false);
    }
  };

  const SQL_MIGRATION_TEXT = `-- SQL Script Migrasi & Sinkronisasi User Profiles Supabase HIMASI
-- Jalankan skrip ini di Supabase SQL Editor:

-- 1. Buat Tabel public.profiles jika belum ada
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nama_lengkap TEXT,
  jabatan TEXT DEFAULT 'Pengurus HIMASI',
  divisi TEXT DEFAULT 'Kabinet REKSABUDAYA',
  role TEXT NOT NULL DEFAULT 'humas_biskraf',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'humas_biskraf';

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pengurus dapat membaca profil" ON public.profiles;
CREATE POLICY "Pengurus dapat membaca profil"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Pengurus dapat mengupdate profil sendiri" ON public.profiles;
CREATE POLICY "Pengurus dapat mengupdate profil sendiri"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admin dapat mengelola semua profil" ON public.profiles;
CREATE POLICY "Super admin dapat mengelola semua profil"
  ON public.profiles FOR ALL TO authenticated USING (true);

-- 3. Trigger otomatis saat user baru terdaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama_lengkap, jabatan, divisi, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Pengurus HIMASI'),
    COALESCE(NEW.raw_user_meta_data->>'divisi', 'Kabinet REKSABUDAYA'),
    CASE 
      WHEN NEW.email = 'himasi@atmaluhur.ac.id' THEN 'super_admin'
      ELSE 'humas_biskraf'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. SINKRONISASI SEMUA USER DARI auth.users KE public.profiles
INSERT INTO public.profiles (id, email, nama_lengkap, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  CASE 
    WHEN email = 'himasi@atmaluhur.ac.id' THEN 'super_admin'
    ELSE 'humas_biskraf'
  END
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email;

-- 5. Kolom status persetujuan pada berita & kalender
ALTER TABLE public.berita 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
ADD COLUMN IF NOT EXISTS catatan_revisi TEXT;

ALTER TABLE public.agenda_kalender 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
ADD COLUMN IF NOT EXISTS catatan_revisi TEXT;

-- 6. Tabel Pengaturan Sistem & Mode Pemeliharaan (503)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pengaturan sistem dapat dibaca publik" ON public.system_settings;
CREATE POLICY "Pengaturan sistem dapat dibaca publik"
  ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admin dapat mengelola pengaturan sistem" ON public.system_settings;
CREATE POLICY "Super admin dapat mengelola pengaturan sistem"
  ON public.system_settings FOR ALL TO authenticated USING (true);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

NOTIFY pgrst, 'reload schema';`;

  const handleCopySql = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(SQL_MIGRATION_TEXT);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#00296E] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Hak Akses Terpusat</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#00296E]">
            Manajemen Pengguna &amp; Hak Akses
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atur wewenang pengurus kabinet sesuai peran: Super Admin, BPH, Medkominfo, dan HUMAS/BISKRAF.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setShowSqlMigration(!showSqlMigration)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Skrip SQL Supabase</span>
          </button>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#00296E] text-white hover:bg-[#001f54] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. SQL Migration Helper Banner (Expandable) */}
      {showSqlMigration && (
        <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                SQL Migration Script (Supabase SQL Editor)
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? "Tersalin!" : "Salin Skrip SQL"}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono bg-slate-950 p-4 rounded-xl overflow-x-auto text-emerald-400 border border-slate-800/80">
            {SQL_MIGRATION_TEXT}
          </pre>
          <p className="text-[11px] text-slate-400 mt-2">
            💡 Skrip ini memastikan tabel <code>profiles</code> memiliki kolom <code>role</code>, serta tabel <code>berita</code> &amp; <code>agenda_kalender</code> memiliki kolom <code>status</code> &amp; <code>catatan_revisi</code>.
          </p>
        </div>
      )}

      {/* 2.1 Mode Pemeliharaan Sistem (503) Super Admin Gate */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 shadow-2xs ${
          maintenanceEnabled
            ? "bg-amber-50/80 border-amber-300 text-amber-950"
            : "bg-white border-slate-200/80 text-slate-900"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                maintenanceEnabled
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-[#00296E]">
                  Mode Pemeliharaan Sistem (Error 503 Gate)
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                    maintenanceEnabled
                      ? "bg-amber-200 text-amber-900 border border-amber-300"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {maintenanceEnabled ? "Aktif (Terkunci)" : "Nonaktif (Normal)"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                Ketika aktif, pengunjung publik dialihkan otomatis ke halaman <strong>/error/503</strong> penuh.
                Halaman <strong>/login</strong> dan dashboard pengurus tetap terbuka agar Super Admin dapat mengelola sistem.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 bg-white sm:bg-transparent px-3 py-1.5 rounded-xl border border-slate-200 sm:border-0 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-500">Estimasi:</span>
              <input
                type="text"
                value={maintenanceEstimated}
                onChange={(e) => handleUpdateEstimatedTime(e.target.value)}
                placeholder="misal ~15-30 Menit"
                className="w-28 text-xs font-semibold text-[#00296E] bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg px-2 py-1 outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={handleToggleMaintenance}
              disabled={savingMaintenance}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                maintenanceEnabled
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {maintenanceEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <span>{savingMaintenance ? "Mematikan..." : "Nonaktifkan 503"}</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  <span>{savingMaintenance ? "Mengaktifkan..." : "Aktifkan 503"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {maintenanceToast && (
          <div className="mt-3 text-xs font-medium px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 animate-in fade-in duration-150 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{maintenanceToast}</span>
          </div>
        )}
      </div>

      {/* 3. Stat Cards Peran */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-purple-700 mb-2">
            <span>SUPER ADMIN</span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#00296E]">
            {stats.super_admin}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Akses penuh teknis &amp; database</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 mb-2">
            <span>BPH (PIMPINAN)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#00296E]">
            {stats.bph}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Pengawas absensi &amp; organisasi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-sky-700 mb-2">
            <span>MEDKOMINFO</span>
            <span className="w-2 h-2 rounded-full bg-sky-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#00296E]">
            {stats.medkominfo}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Editor &amp; gatekeeper konten</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 mb-2">
            <span>HUMAS &amp; BISKRAF</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#00296E]">
            {stats.humas_biskraf}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Kontributor draf konten</p>
        </div>
      </div>

      {/* 4. Controls: Pencarian & Filter Peran */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, email, divisi, jabatan..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00296E]/20 focus:border-[#00296E]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00296E]/20"
          >
            <option value="all">Semua Peran ({profiles.length})</option>
            <option value="super_admin">Super Admin ({stats.super_admin})</option>
            <option value="bph">BPH ({stats.bph})</option>
            <option value="medkominfo">Medkominfo ({stats.medkominfo})</option>
            <option value="humas_biskraf">HUMAS &amp; BISKRAF ({stats.humas_biskraf})</option>
          </select>
        </div>
      </div>

      {/* 5. Tabel Daftar Pengguna & Hak Akses */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Pengurus</th>
                <th className="py-3.5 px-4">Divisi &amp; Jabatan</th>
                <th className="py-3.5 px-4">Hak Akses (Role)</th>
                <th className="py-3.5 px-4 text-center">Status Akun</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />
                    <span>Memuat data pengguna &amp; hak akses...</span>
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada pengurus yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Coba ubah kata kunci pencarian atau reset filter peran.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((user) => {
                  const isCurrentLoggedIn = currentUserEmail === user.email;
                  const isPrimarySuperAdmin = user.email === "himasi@atmaluhur.ac.id";

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Kolom 1: Profil / Nama & Email */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-[#00296E] shrink-0">
                            {user.nama_lengkap.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{user.nama_lengkap}</span>
                              {isCurrentLoggedIn && (
                                <span className="text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded-full">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Divisi & Jabatan */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{user.jabatan}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{user.divisi}</span>
                      </td>

                      {/* Kolom 3: Badge Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            ROLE_BADGE_STYLES[user.role] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{ROLE_LABELS[user.role] || user.role}</span>
                        </span>
                      </td>

                      {/* Kolom 4: Status Akun */}
                      <td className="py-3.5 px-4 text-center">
                        {isPrimarySuperAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" />
                            <span>Kunci Sistem</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aktif</span>
                          </span>
                        )}
                      </td>

                      {/* Kolom 5: Tombol Aksi Ubah Role */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenRoleModal(user)}
                          disabled={isPrimarySuperAdmin && isCurrentLoggedIn}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:border-[#00296E] hover:text-[#00296E] text-slate-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Ubah Peran</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modal Ubah Hak Akses Pengguna */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#00296E]">Ubah Hak Akses Pengguna</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Konten Modal */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <span className="text-slate-500 block">Nama Pengurus:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedUser.nama_lengkap}</span>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600">
                  <span>{selectedUser.jabatan}</span>
                  <span>•</span>
                  <span>{selectedUser.divisi}</span>
                </div>
              </div>

              {/* Pilihan Role */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Tingkat Wewenang:
                </label>

                {(["super_admin", "bph", "medkominfo", "humas_biskraf"] as UserRole[]).map((r) => {
                  const isChecked = targetRole === r;
                  return (
                    <label
                      key={r}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? "bg-purple-50/60 border-purple-300 ring-2 ring-purple-500/20"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="user-role-selection"
                        value={r}
                        checked={isChecked}
                        onChange={() => setTargetRole(r)}
                        className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-500 accent-purple-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {ROLE_LABELS[r]}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${ROLE_BADGE_STYLES[r]}`}
                          >
                            {r.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {ROLE_DESCRIPTIONS[r]}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Peringatan / Feedback */}
              {actionError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {actionSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                disabled={savingRole}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveRole}
                disabled={savingRole || selectedUser.role === targetRole}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#00296E] hover:bg-[#001f54] text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {savingRole ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Terapkan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

