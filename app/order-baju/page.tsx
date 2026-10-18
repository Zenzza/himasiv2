"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  HelpCircle,
  Truck,
  CreditCard,
  Ruler
} from "lucide-react";
import Footer from "@/components/footer";

export default function OrderBajuPage() {
  const [selectedProduct, setSelectedProduct] = useState("Kemeja PDH Resmi HIMASI");
  const [selectedSize, setSelectedSize] = useState("L");
  const [sleeveType, setSleeveType] = useState<"Pendek" | "Panjang">("Pendek");
  const [customName, setCustomName] = useState("");
  const [nim, setNim] = useState("");
  const [batch, setBatch] = useState("2024");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [qty, setQty] = useState(1);
  const [isOrdered, setIsOrdered] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const products = [
    {
      name: "Kemeja PDH Resmi HIMASI",
      tag: "Wajib / Utama",
      price: 155000,
      longSleeveExtra: 10000,
      desc: "Bahan Japan Nagata Drill nomor 1. Tebal, adem, tidak mudah kusut. Dilengkapi bordir komputer presisi logo HIMASI, bendera merah putih, dan nama pemilik.",
      features: ["Bahan Japan Nagata Drill", "Bordir Komputer Presisi", "Kancing Eksklusif Engraved", "Ventilasi Sirkulasi Punggung"],
    },
    {
      name: "Kaos Polo SI Exclusive",
      tag: "Casual Harian",
      price: 95000,
      longSleeveExtra: 8000,
      desc: "Bahan Cotton CVC Pique 24s yang lembut menyerap keringat. Cocok untuk kuliah santai, praktikum laboratorium, dan kegiatan kepanitiaan.",
      features: ["Cotton CVC Pique 24s", "Bordir Logo Dada Minimalis", "Kerah Anti Melar", "Fitting Slim Regular"],
    },
    {
      name: "Jaket Bomber / Varsity HIMASI",
      tag: "Limited Edition",
      price: 195000,
      longSleeveExtra: 0,
      desc: "Bahan Luar Taslan Milky Water-repellent dengan furing dalam quilting lembut. Tampilan sporty dan elegan untuk iklim ber-AC kampus.",
      features: ["Bahan Taslan Water-repellent", "Furing Hangat & Breathable", "Bordir Besar Punggung", "Saku Rahasia Dalam"],
    },
  ];

  const currentProduct = products.find((p) => p.name === selectedProduct) || products[0];
  const unitPrice = currentProduct.price + (sleeveType === "Panjang" ? currentProduct.longSleeveExtra : 0);
  const totalPrice = unitPrice * qty;

  const sizeChart = [
    { size: "S", chest: "48 cm", length: "66 cm", sleeve: "22 / 56 cm" },
    { size: "M", chest: "51 cm", length: "69 cm", sleeve: "23 / 58 cm" },
    { size: "L", chest: "54 cm", length: "72 cm", sleeve: "24 / 60 cm" },
    { size: "XL", chest: "57 cm", length: "74 cm", sleeve: "25 / 62 cm" },
    { size: "XXL", chest: "60 cm", length: "76 cm", sleeve: "26 / 64 cm" },
    { size: "3XL", chest: "63 cm", length: "78 cm", sleeve: "27 / 65 cm" },
  ];

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = `INV-BAJU-${Math.floor(10000 + Math.random() * 90000)}`;
    setInvoiceNumber(inv);
    setIsOrdered(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-[#091e42]">
      {/* Top Banner */}
      <section className="relative w-full bg-[#00296E] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0094E0]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#0094E0] text-xs font-bold uppercase tracking-wider mb-4">
            <ShoppingBag className="w-4 h-4 text-sky-400" />
            <span className="text-white">Merchandise & Divisi Dana Usaha (Danus)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            Pemesanan Baju Jurusan & PDH HIMASI
          </h1>

          <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
            Kenakan atribut kebanggaan mahasiswa Sistem Informasi ISB Atma Luhur. Didesain secara ergonomis dengan material standar industri kemeja organisasi terbaik.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-16">

        {/* Product Cards Selection */}
        <section>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0094E0] uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Katalog Atribut Resmi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
            Pilihan Produk Baju Jurusan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((p, idx) => {
              const isSelected = selectedProduct === p.name;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedProduct(p.name)}
                  className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-white border-[#0094E0] shadow-xl ring-2 ring-[#0094E0]/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#0094E0]/10 text-[#00296E]">
                        {p.tag}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-[#0094E0]" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      {p.name}
                    </h3>
                    <p className="text-2xl font-black text-[#00296E] mb-3">
                      Rp {p.price.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {p.desc}
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(p.name);
                      document.getElementById("form-order")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs transition-colors ${
                      isSelected
                        ? "bg-[#00296E] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isSelected ? "Produk Dipilih" : "Pilih Produk Ini"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Size Chart Guide */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0094E0] uppercase tracking-wider mb-2">
            <Ruler className="w-4 h-4" />
            <span>Panduan Ukuran (Size Chart)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
            Standar Ukuran Kemeja & Kaos (Unisex)
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Toleransi ukuran jahit konveksi: ± 1 - 2 cm. Jika ragu, disarankan memilih 1 tingkat ukuran di atasnya.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Lebar Dada</th>
                  <th className="py-3 px-4">Panjang Badan</th>
                  <th className="py-3 px-4">Panjang Lengan (Pendek / Panjang)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {sizeChart.map((row) => (
                  <tr key={row.size} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-[#00296E]">{row.size}</td>
                    <td className="py-2.5 px-4">{row.chest}</td>
                    <td className="py-2.5 px-4">{row.length}</td>
                    <td className="py-2.5 px-4">{row.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pre-Order Form */}
        <section id="form-order" className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-xl scroll-mt-24">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold text-[#0094E0] uppercase tracking-wider">
              Formulir Pemesanan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Form Pre-Order Baju Jurusan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Lengkapi rincian pesanan dan bordir nama. Setelah submit, Anda dapat langsung mengonfirmasi bukti transfer ke PIC Danus HIMASI.
            </p>
          </div>

          {isOrdered ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-emerald-50 border border-emerald-300 text-center max-w-lg mx-auto animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Pesanan Berhasil Dicatat!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                Terima kasih, <strong className="text-slate-800">{fullName}</strong>. Rincian pesanan Anda telah tersimpan di antrean produksi Danus HIMASI.
              </p>

              <div className="my-6 p-4 rounded-xl bg-white border border-emerald-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between border-b pb-2 mb-2">
                  <span className="text-slate-500">Nomor Invoice:</span>
                  <span className="font-mono font-bold text-[#00296E]">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-semibold text-slate-800">{selectedProduct}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ukuran & Lengan:</span>
                  <span className="font-semibold text-slate-800">{selectedSize} (Lengan {sleeveType})</span>
                </div>
                {customName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bordir Dada:</span>
                    <span className="font-semibold text-slate-800">{customName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Jumlah:</span>
                  <span className="font-semibold text-slate-800">{qty} Pcs</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2 font-bold text-sm">
                  <span className="text-slate-800">Total Pembayaran:</span>
                  <span className="text-[#00296E]">Rp {totalPrice.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`https://wa.me/6281234567890?text=Halo%20Danus%20HIMASI,%20saya%20sudah%20order%20baju%20dengan%20No%20Invoice:%20${invoiceNumber}%20atas%20nama%20${encodeURIComponent(fullName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-[#00296E] text-white text-xs font-bold hover:bg-[#001e52] transition-colors"
                >
                  Konfirmasi via WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => setIsOrdered(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-colors"
                >
                  Pesan Lagi
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOrderSubmit} className="space-y-5 max-w-2xl mx-auto text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Nama Pemesan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    NIM Mahasiswa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Nomor Induk Mahasiswa"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    No. WhatsApp Aktif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Angkatan Mahasiswa <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  >
                    <option value="2025">Angkatan 2025</option>
                    <option value="2024">Angkatan 2024</option>
                    <option value="2023">Angkatan 2023</option>
                    <option value="2022">Angkatan 2022 / Alumni</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Model Produk <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  >
                    {products.map((p) => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Pilihan Ukuran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  >
                    {sizeChart.map((s) => (
                      <option key={s.size} value={s.size}>{s.size} ({s.chest})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Tipe Lengan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sleeveType}
                    onChange={(e) => setSleeveType(e.target.value as "Pendek" | "Panjang")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  >
                    <option value="Pendek">Lengan Pendek (Standar)</option>
                    <option value="Panjang">Lengan Panjang (+ Rp 10.000)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Custom Nama Dada (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Contoh: FARHAN"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0] uppercase"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Bordir huruf kapital maksimal 15 karakter di dada kanan.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Jumlah Pesanan (Pcs) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-sky-700 font-medium">Estimasi Total Biaya:</span>
                  <p className="text-xl sm:text-2xl font-black text-[#00296E]">
                    Rp {totalPrice.toLocaleString("id-ID")}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-sky-800 bg-sky-200/60 px-3 py-1 rounded-full">
                  Termasuk PPN & Bordir
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#00296E] hover:bg-[#001e52] text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#0094E0]" />
                <span>Konfirmasi Pesanan Pre-Order</span>
              </button>
            </form>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}
