// Rules and permission matrix for Role-Based Access Control (RBAC)

const ROLE_PERMISSIONS = {
  super_admin: {
    tabs: [
      "overview",
      "banner",
      "berita",
      "kartu-qr",
      "dokumen",
      "kalender",
      "persuratan",
      "content-planner",
      "aspirasi",
      "apresiasi",
      "absensi",
      "rekap-absensi",
      "database",
      "users",
    ],
    canPublish: true,
    canEditPublished: true,
  },
  bph: {
    tabs: [
      "overview",
      "banner",
      "berita",
      "kartu-qr",
      "dokumen",
      "kalender",
      "persuratan",
      "content-planner",
      "aspirasi",
      "apresiasi",
      "absensi",
      "rekap-absensi",
    ],
    canPublish: true,
    canEditPublished: true,
  },
  medkominfo: {
    tabs: [
      "overview",
      "banner",
      "berita",
      "kartu-qr",
      "dokumen",
      "kalender",
      "persuratan",
      "content-planner",
      "aspirasi",
      "apresiasi",
    ],
    canPublish: true,
    canEditPublished: true,
  },
  humas_biskraf: {
    tabs: [
      "overview",
      "berita",
      "dokumen",
      "kalender",
      "persuratan",
      "content-planner",
      "apresiasi",
    ],
    canPublish: false,
    canEditPublished: false,
  },
};

function canAccessTab(role, tabKey) {
  if (!role || !ROLE_PERMISSIONS[role]) {
    // Default fallback to humas_biskraf permissions
    role = "humas_biskraf";
  }
  return ROLE_PERMISSIONS[role].tabs.includes(tabKey);
}

function canPublishContent(role) {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return Boolean(ROLE_PERMISSIONS[role].canPublish);
}

function canEditPublishedContent(role) {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return Boolean(ROLE_PERMISSIONS[role].canEditPublished);
}

const ROLE_LABELS = {
  super_admin: "Super Admin",
  bph: "BPH (Pimpinan)",
  medkominfo: "Medkominfo",
  humas_biskraf: "HUMAS & BISKRAF",
};

const ROLE_BADGE_STYLES = {
  super_admin: "bg-purple-100 text-purple-800 border-purple-200",
  bph: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medkominfo: "bg-sky-100 text-[#00296E] border-sky-200",
  humas_biskraf: "bg-amber-100 text-amber-800 border-amber-200",
};

module.exports = {
  ROLE_PERMISSIONS,
  canAccessTab,
  canPublishContent,
  canEditPublishedContent,
  ROLE_LABELS,
  ROLE_BADGE_STYLES,
};

