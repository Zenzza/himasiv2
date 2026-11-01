import { ContentStatus } from "./auth";

export interface BeritaItem {
  id: number | string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_key: "event" | "prestasi" | "teknologi" | string;
  category_label: string;
  author: string;
  read_time: string;
  image_url: string;
  is_published: boolean;
  status?: ContentStatus;
  catatan_revisi?: string;
  created_at?: string;
  published_at: string;
  corner_shape?: string;
  corner_color?: string;
  corner_position?: string;
}

export const KATEGORI_BERITA = [
  { key: "event", label: "Kegiatan Himpunan" },
  { key: "prestasi", label: "Prestasi Mahasiswa" },
  { key: "teknologi", label: "Teknologi & Riset" },
] as const;

export const FALLBACK_BERITA: BeritaItem[] = [
  {
    id: 1,
    title: "Perluas Relasi Organisasi dan Bertukar Pikiran, Departemen Eksternal HIMASI Gelar Studi Banding Strategis",
    slug: "perluas-relasi-organisasi-studi-banding-strategis",
    category_key: "event",
    category_label: "Kegiatan Himpunan",
    published_at: "2026-07-30T10:00:00.000Z",
    read_time: "5 min read",
    author: "Departemen Hubungan Eksternal",
    image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Departemen Hubungan Eksternal HIMASI sukses menggelar forum studi banding strategis guna memperluas relasi, berbagi praktik terbaik, dan memperkuat sinergi organisasi mahasiswa.",
    content: `PANGKALPINANG — Departemen Hubungan Eksternal Himpunan Mahasiswa Sistem Informasi (HIMASI) Institut Sains dan Bisnis Atma Luhur sukses menyelenggarakan forum studi banding strategis bersama rekan-rekan organisasi kemahasiswaan sejawat. Kegiatan ini dihelat dengan tujuan utama memperluas jejaring kemitraan, bertukar gagasan mengenai tata kelola himpunan, serta membedah praktik terbaik dalam eksekusi program kerja.

Dalam sambutan pembukaannya, Ketua Umum HIMASI Kabinet REKSABUDAYA menegaskan bahwa kolaborasi lintas organisasi merupakan kunci penting dalam menghadapi dinamika era digital. "Organisasi mahasiswa tidak lagi dapat bergerak sendiri-sendiri secara silo. Melalui studi banding ini, kita saling belajar tentang inovasi manajemen sumber daya manusia, penguatan literasi digital, hingga strategi publikasi media sosial yang berdampak nyata bagi mahasiswa," ujarnya.

Sesi diskusi interaktif terbagi ke dalam beberapa fokus kelompok (Focus Group Discussion / FGD), mencakup ranah riset teknologi, pengembangan potensi minat bakat mahasiswa, kepedulian sosial kemasyarakatan, serta efisiensi administrasi kesekretariatan. Antusiasme peserta terlihat dari hangatnya tanya jawab seputar sistem absensi terintegrasi berbasis QR code dan manajemen database keanggotaan modern yang telah diterapkan oleh HIMASI.

Acara ditutup dengan penyerahan cinderamata kehormatan, sesi foto bersama seluruh jajaran pengurus, serta penandatanganan komitmen bersama untuk menyelenggarakan kegiatan kolaboratif di bidang pelatihan teknologi pada semester mendatang. Diharapkan hasil studi banding ini dapat langsung diimplementasikan guna meningkatkan kualitas layanan dan kegiatan bagi seluruh civitas akademika program studi Sistem Informasi.`,
    is_published: true,
  },
  {
    id: 2,
    title: "Kolaborasi dengan Praktisi Industri, Departemen Iptek HIMASI Gelar Workshop Blockchain & Smart Contract",
    slug: "workshop-blockchain-smart-contract-departemen-iptek",
    category_key: "teknologi",
    category_label: "Teknologi & Riset",
    published_at: "2026-07-30T09:30:00.000Z",
    read_time: "7 min read",
    author: "Departemen Iptek & Riset",
    image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Eksplorasi ekosistem Web3, arsitektur desentralisasi, dan fundamental smart contract development bersama praktisi industri melalui workshop interaktif berbasis hands-on coding.",
    content: `PANGKALPINANG — Perkembangan teknologi desentralisasi dan Web3 terus menarik minat para pegiat teknologi muda. Merespons tren global tersebut, Departemen Ilmu Pengetahuan dan Teknologi (Iptek) HIMASI menggelar workshop intensif bertajuk "Building the Decentralized Future: Introduction to Blockchain & Smart Contract Development".

Workshop yang dipusatkan di Laboratorium Rekayasa Perangkat Lunak ini menghadirkan praktisi industri blockchain terkemuka sebagai pemateri utama. Peserta yang terdiri dari mahasiswa Sistem Informasi dan perwakilan jurusan teknologi informasi diajak menyelami konsep dasar sistem konsensus terdistribusi, struktur cryptographic hash, hingga arsitektur dompet digital Web3.

Tidak hanya sebatas paparan teori, workshop difokuskan pada sesi hands-on coding interaktif. Peserta secara langsung dibimbing menulis smart contract sederhana menggunakan bahasa pemrograman Solidity, melakukan kompilasi di lingkungan pengembangan Remix IDE, serta mendeploy kontrak pintar ke testnet Ethereum.

"Tantangan terbesar mahasiswa saat mempelajari teknologi baru seperti blockchain adalah minimnya bimbingan teknis langsung dari praktisi yang berkecimpung di industri. Melalui workshop ini, kami ingin membekali mahasiswa dengan keahlian praktis yang langsung relevan dengan kebutuhan industri software engineering masa depan," tutur Kepala Departemen Iptek HIMASI. Sesi ditutup dengan pembagian sertifikat digital dan tantangan mini hackathon pembuatan prototipe dApp.`,
    is_published: true,
  },
  {
    id: 3,
    title: "Program Studi Sistem Informasi Raih Juara Umum PIMAPOSMA 2025",
    slug: "sistem-informasi-raih-juara-umum-pimaposma-2025",
    category_key: "prestasi",
    category_label: "Prestasi Mahasiswa",
    published_at: "2026-07-30T08:00:00.000Z",
    read_time: "4 min read",
    author: "Divisi Bakat & Prestasi",
    image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Kontingen mahasiswa Sistem Informasi sukses memborong perolehan medali emas di berbagai cabang kompetisi ilmiah, gagasan futuristik, dan seni pada pekan PIMAPOSMA.",
    content: `PANGKALPINANG — Prestasi gemilang kembali ditorehkan oleh mahasiswa Program Studi Sistem Informasi. Dalam perhelatan Pekan Ilmiah Mahasiswa dan Olahraga Seni (PIMAPOSMA) tingkat kampus, kontingen Sistem Informasi berhasil dinobatkan sebagai Juara Umum setelah menyapu bersih podium medali di berbagai cabang unggulan.

Perolehan medali emas disumbangkan dari kompetisi Desain UI/UX Aplikasi Mobile, Karya Tulis Ilmiah Gagasan Futuristik Tertulis (GFT), Kompetisi Inovasi Sistem Cerdas, serta kejuaraan e-sport beregu. Konsistensi prestasi ini merupakan buah dari kerja keras dan pembinaan intensif yang difasilitasi oleh Divisi Bakat dan Prestasi HIMASI bersama para dosen pembina prodi.

Ketua Program Studi Sistem Informasi mengungkapkan rasa bangga atas capaian membanggakan ini. "Keberhasilan ini membuktikan bahwa mahasiswa Sistem Informasi memiliki daya saing tinggi, baik di ranah akademik ilmiah maupun soft skills kreasi inovatif. Semoga prestasi ini menjadi pelecut semangat bagi adik-adik tingkat untuk terus berani berkarya dan berprestasi di tingkat nasional," ungkap beliau.

HIMASI berkomitmen untuk terus membuka ruang inkubasi dan mentoring bagi mahasiswa yang ingin mempersiapkan diri menghadapi kejuaraan tingkat wilayah maupun ajang bergengsi nasional seperti Gemastik dan Pekan Ilmiah Mahasiswa Nasional (PIMNAS).`,
    is_published: true,
  },
  {
    id: 4,
    title: "Jembatani Aspirasi Mahasiswa, HIMASI Sukses Selenggarakan Dialog Program Studi (DPS) 2026",
    slug: "jembatani-aspirasi-dialog-program-studi-dps-2026",
    category_key: "event",
    category_label: "Kegiatan Himpunan",
    published_at: "2026-07-30T07:15:00.000Z",
    read_time: "6 min read",
    author: "Departemen Hubungan Internal",
    image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Forum dialog terbuka antara civitas akademika, pengelola prodi, dan mahasiswa guna menyalurkan aspirasi akademik, evaluasi kurikulum, dan peningkatan fasilitas laboratorium.",
    content: `PANGKALPINANG — Sebagai wujud komitmen dalam memperjuangkan aspirasi dan hak-hak akademik mahasiswa, HIMASI menyelenggarakan forum tahunan Dialog Program Studi (DPS) 2026 yang berlangsung di Aula Utama kampus.

Forum terbuka ini mempertemukan langsung pimpinan program studi, dosen pembimbing akademik, perwakilan unit sarana prasarana kampus, serta ratusan perwakilan mahasiswa dari seluruh angkatan aktif. Berbagai topik krusial dibahas secara konstruktif, mulai dari pembaruan kurikulum berbasis kecerdasan buatan (AI) dan cloud computing, ketersediaan lisensi perangkat lunak praktikum, hingga kenyamanan sarana fasilitas laboratorium komputer.

Sebelum pelaksanaan DPS, Departemen Internal HIMASI telah melakukan survei dan penjaringan aspirasi secara daring melalui form aspirasi terintegrasi. Data aspirasi tersebut dikompilasi menjadi dokumen naskah rekomendasi yang diserahkan secara resmi kepada Ketua Program Studi.

Pihak manajemen program studi menyambut positif masukan yang disampaikan dan langsung memberikan komitmen tindak lanjut, termasuk peremajaan perangkat keras laboratorium serta penambahan kuota kelas untuk mata kuliah praktikum favorit. Dialog berjalan tertib, kritis, dan penuh semangat kekeluargaan demi kemajuan bersama almamater.`,
    is_published: true,
  },
  {
    id: 5,
    title: "Mahasiswa Sistem Informasi Raih Juara pada Indonesia National IT Competition 2026",
    slug: "mahasiswa-sistem-informasi-juara-national-it-competition-2026",
    category_key: "prestasi",
    category_label: "Prestasi Mahasiswa",
    published_at: "2026-07-30T06:00:00.000Z",
    read_time: "5 min read",
    author: "Biro Riset Mahasiswa",
    image_url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Inovasi prototipe sistem analitik cerdas buatan tim mahasiswa Sistem Informasi berhasil meraih podium penghargaan bergengsi tingkat nasional di ajang kompetisi IT tahunan.",
    content: `JAKARTA — Tim mahasiswa Program Studi Sistem Informasi ISB Atma Luhur berhasil mengukir prestasi membanggakan dengan meraih Juara 2 dalam ajang kompetisi bergengsi tingkat nasional "Indonesia National IT Competition 2026" yang digelar di Jakarta.

Karya inovasi yang diajukan oleh tim mengangkat tema sistem analitik data cerdas untuk pemantauan rantai pasok komoditas lokal berbasis machine learning. Melalui aplikasi ini, pelaku usaha mikro dan dinas terkait dapat memprediksi fluktuasi harga komoditas pangan secara presisi berdasarkan tren historis cuaca dan volume transaksi pasar.

Dewan juri yang terdiri dari akademisi senior dan praktisi teknologi mengapresiasi solusi aplikatif yang ditawarkan karena tidak hanya berorientasi pada kemutakhiran algoritma, namun juga sangat menitikberatkan pada aspek kemudahan antarmuka pengguna (user experience) serta arsitektur database yang scalable.

"Kami sangat bersyukur atas dukungan dari seluruh dosen pembimbing, pimpinan kampus, dan rekan-rekan HIMASI yang telah memfasilitasi persiapan dan simulasi presentasi selama masa karantina kompetisi. Semoga kemenangan ini menginspirasi rekan-rekan mahasiswa lainnya," tutur ketua tim delegasi.`,
    is_published: true,
  },
  {
    id: 6,
    title: "The Future of AI & System Architecture: Tren Arsitektur Microservices dan Gen-AI di Industri",
    slug: "tren-arsitektur-microservices-gen-ai-industri-modern",
    category_key: "teknologi",
    category_label: "Teknologi & Riset",
    published_at: "2026-07-25T14:00:00.000Z",
    read_time: "8 min read",
    author: "Divisi Medkominfo HIMASI",
    image_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Perkembangan arsitektur microservices terdistribusi dan integrasi LLM lokal menjadi keahlian kunci yang banyak dicari industri rekayasa perangkat lunak modern saat ini.",
    content: `DUNIA TEKNOLOGI — Lanskap rekayasa perangkat lunak terus bertransformasi dengan cepat seiring dengan maraknya adopsi Large Language Models (LLM) dan arsitektur komputasi terdistribusi (microservices). Sistem informasi modern saat ini dituntut untuk tidak hanya mampu memproses jutaan transaksi per detik dengan toleransi kegagalan (fault tolerance) yang tinggi, tetapi juga mampu mengintegrasikan kemampuan kognitif kecerdasan buatan secara real-time.

Dalam artikel warta ilmiah kali ini, tim Medkominfo HIMASI merangkum pergeseran paradigma arsitektur perangkat lunak dari pola monolitik konvensional menuju arsitektur berorientasi layanan mini (microservices) berbasis kontainerisasi Docker dan Kubernetes. Pemisahan domain bisnis ke dalam layanan-layanan independen memungkinkan tim pengembang melakukan rilis pembaruan fitur tanpa perlu menghentikan operasional keseluruhan sistem.

Selain itu, tren penggunaan localized AI models (seperti model bahasa sumber terbuka yang di-fine-tune untuk domain spesifik) mulai banyak diintegrasikan ke dalam sistem enterprise internal guna menjaga privasi data sensitif perusahaan. Bagi mahasiswa Sistem Informasi, pemahaman mendalam mengenai API gateway, message broker (seperti RabbitMQ atau Kafka), serta orkestrasi model AI kini menjadi bekal kompetensi yang sangat dicari oleh startup unicorn maupun korporasi teknologi global.`,
    is_published: true,
  },
  {
    id: 7,
    title: "HIMASI Fest 2026: Kolaborasi Kreatif Coding, Hackathon 24 Jam, dan Turnamen E-Sport",
    slug: "himasi-fest-2026-coding-hackathon-esport",
    category_key: "event",
    category_label: "Kegiatan Himpunan",
    published_at: "2026-07-18T11:00:00.000Z",
    read_time: "5 min read",
    author: "Panitia HIMASI Fest 2026",
    image_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Ajang akbar tahunan mahasiswa Sistem Informasi kembali hadir mempertemukan ratusan talenta muda melalui hackathon dan turnamen kompetitif penuh semangat inovasi.",
    content: `PANGKALPINANG — Festival tahunan paling dinanti, HIMASI Fest 2026, resmi dibuka dengan semarak di kampus ISB Atma Luhur. Mengusung tema "Innovate, Code, and Elevate", festival ini menghadirkan perpaduan unik antara ajang kompetisi ilmiah pengembangan aplikasi dan turnamen olahraga digital.

Highlight utama dari HIMASI Fest tahun ini adalah kompetisi "Hackathon 24 Jam Non-Stop", di mana tim-tim mahasiswa ditantang merancang dan membangun purwarupa solusi perangkat lunak untuk mengatasi permasalahan riil di masyarakat dalam waktu satu hari penuh. Tema masalah yang diangkat meliputi digitalisasi UMKM desa wisata, sistem manajemen sampah pintar, dan aplikasi pemantauan kesehatan mahasiswa.

Selain hackathon, festival ini juga dimeriahkan dengan kompetisi UI/UX Design, pameran produk kewirausahaan mahasiswa, workshop teknologi terkini, serta turnamen e-sport Mobile Legends yang berlangsung sangat seru. HIMASI Fest 2026 diharapkan terus menjadi wadah positif bagi talenta muda untuk menunjukkan kreativitas, ketahanan mental, serta semangat sportivitas yang tinggi.`,
    is_published: true,
  },
  {
    id: 8,
    title: "Kisah Inspiratif Alumni: Dari Lab Komputer Kampus Menuju Tech Lead Startup Unicorn",
    slug: "kisah-inspiratif-alumni-tech-lead-startup-unicorn",
    category_key: "prestasi",
    category_label: "Prestasi Mahasiswa",
    published_at: "2026-07-10T09:00:00.000Z",
    read_time: "7 min read",
    author: "Redaksi InfoTek HIMASI",
    image_url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Wawancara eksklusif bersama alumni Sistem Informasi tentang perjuangan meniti karir rekayasa perangkat lunak internasional dan pentingnya aktif berorganisasi di kampus.",
    content: `PANGKALPINANG — Perjalanan meniti karir di dunia rekayasa perangkat lunak profesional seringkali dimulai dari langkah-langkah sederhana di bangku kuliah. Dalam wawancara eksklusif rubrik Inspirasi Alumni kali ini, redaksi InfoTek berkesempatan berbincang dengan Kak Randy, alumni Program Studi Sistem Informasi angkatan 2018 yang saat ini menjabat sebagai Lead Software Engineer di salah satu startup fintech unicorn ternama di Jakarta.

Dalam kisahnya, Randy membagikan memori saat menghabiskan waktu hingga larut malam di laboratorium komputer kampus untuk menyelesaikan tugas praktikum algoritma dan struktur data, serta keaktifannya sebagai pengurus departemen Iptek di HIMASI.

"Banyak orang berpikir bahwa sukses di dunia tech hanya bergantung pada nilai IPK tinggi. IPK memang tiket masuk administratif awal, namun yang membuat kita bertahan dan dipromosikan menjadi Tech Lead adalah kemampuan memecahkan masalah (problem solving), kerja sama tim, dan kepemimpinan. Semua soft skills krusial tersebut justru paling banyak saya asah saat mengurus kepanitiaan dan proyek-proyek di HIMASI," tutur Randy memotivasi.

Beliau juga menitipkan pesan bagi seluruh mahasiswa yang sedang menempuh studi: jangan pernah takut gagal saat mencoba teknologi baru, bangun portofolio proyek riil di GitHub sedini mungkin, dan jaga selalu integritas serta etika profesional.`,
    is_published: true,
  },
];
