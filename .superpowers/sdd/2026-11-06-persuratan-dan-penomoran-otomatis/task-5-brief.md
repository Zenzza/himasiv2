### Task 5: End-to-End Verification, Dark Mode Polish, & Number Recycling Flow

**Files:**
- Verify: `components/dashboard/persuratan-manager.tsx`, `app/dashboard/page.tsx`, `lib/supabase/persuratan.ts`, `lib/types/persuratan.ts`, `lib/utils/romawi.ts`

- [ ] **Step 1: Jalankan Type-Check Menyeluruh**
  - Jalankan `npx tsc --noEmit`
  - Expected: 0 errors.

- [ ] **Step 2: Uji Logika Penomoran & Number Recycling**
  - Verifikasi formula penomoran `[urut 3-digit]/HIMASI/[kode jenis]/ISB-AL/[bulan romawi]/[tahun]`.
  - Verifikasi bahwa nomor urut berikutnya awal adalah `015`.
  - Verifikasi bahwa draf yang dibatalkan / ditolak melepaskan nomor urut ke antrean (number recycling).

- [ ] **Step 3: Uji Kesesuaian Desain Swiss Minimalist Grid & Dark Mode**
  - Pastikan seluruh elemen menggunakan `rounded-none`, border hairline `border-[#00296E]/20 dark:border-white/10`.
  - Pastikan latar gelap menggunakan `#001740` (canvas) dan `#001438` (cards), tanpa container putih liar pada mode gelap.

- [ ] **Step 4: Uji Ekspor CSV**
  - Pastikan format CSV valid dengan UTF-8 BOM `\uFEFF` dan sanitasi formula.

NOTE: Do NOT run git commands (user instructed: "tidak perlu menggunakan git"). Focus on rigorous verification.

