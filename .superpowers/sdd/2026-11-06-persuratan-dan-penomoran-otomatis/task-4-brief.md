### Task 4: Dashboard Navigation Integration

**Files:**
- Modify: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `<PersuratanManager currentUserRole={currentUserRole} />` from `@/components/dashboard/persuratan-manager`
- Produces: Seamless integration of the Persuratan module into top horizontal subbagian navbar, sidebar menu, and view routing.

- [ ] **Step 1: Import `PersuratanManager` and add `"persuratan"` to active tab definitions**
  - Import `PersuratanManager` from `@/components/dashboard/persuratan-manager`.
  - In top navigation bar, under `03. Organisasi & Arsip`:
    Update condition `["kartu-qr", "kalender", "dokumen", "persuratan"].includes(activeTab)`.

- [ ] **Step 2: Tambahkan Menu "Persuratan" di Sidebar Navigasi**
  - Pada grup `Subbagian 2: Organisasi & Arsip`:
    Tambahkan tombol navigasi `Persuratan` dengan ikon surat/arsip (e.g. `FileText` atau `Mail`), dengan indikator badge jika ada surat berstatus `menunggu_ttd`.
    Clicking the button sets `setActiveTab("persuratan")`.

- [ ] **Step 3: Render View `<PersuratanManager currentUserRole={currentUserRole} />`**
  - Pada area konten utama dashboard, tambahkan kondisi:
    ```tsx
    {activeTab === "persuratan" && (
      <PersuratanManager currentUserRole={currentUserRole} />
    )}
    ```

- [ ] **Step 4: Verifikasi Kompilasi & Type Safety**
  - Jalankan `npx tsc --noEmit` di powershell (harus 0 errors).

NOTE: Do NOT run git commands (user instructed: "tidak perlu menggunakan git"). Focus on modifying the dashboard page and verifying with `npx tsc --noEmit`.

