"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/public/Footer";
import {
  Branch,
  IphoneUnit,
  enrichBranchWithUnits,
} from "@/lib/public-data";

const FAQ_ITEMS = [
  {
    q: "Apa saja syarat utama untuk menyewa iPhone di iRent?",
    a: "Cukup menyiapkan KTP asli yang masih berlaku disertai salah satu identitas pendukung (KTM Mahasiswa aktif USK/UIN/Unimal/UTU, SIM A/C, Kartu Pegawai, atau Paspor). Kami tidak menerapkan penahanan uang deposit tunai yang memberatkan.",
  },
  {
    q: "Apakah unit iPhone dijamin 100% original dan bebas iCloud?",
    a: "Ya, 100% seluruh armada iRent Aceh adalah unit resmi Apple (kode PA/A, ID/A, atau ZP/A) dengan layar Original True Tone aktif dan Battery Health di atas 90%. Setiap unit telah melalui prosedur Reset & Logout iCloud penuh sebelum diserahterimakan.",
  },
  {
    q: "Bagaimana jika terjadi insiden gores atau retak selama masa sewa?",
    a: "Setiap transaksi penyewaan sudah dilengkapi perlindungan iRent AppleCare+ Shield. Lecet halus pemakaian wajar ditanggung sepenuhnya. Untuk insiden berat pada layar atau bodi, Anda cukup menanggung biaya klaim ringan sesuai ketentuan tanpa perlu mengganti harga unit baru.",
  },
  {
    q: "Apakah bisa sewa di Banda Aceh lalu dikembalikan di Bireuen atau Lhokseumawe?",
    a: "Bisa! Layanan Inter-Hub Return kami memungkinkan Anda mengambil unit di cabang Banda Aceh dan mengembalikannya di gerai Bireuen, Lhokseumawe, maupun Meulaboh. Cukup informasikan rencana cabang pengembalian kepada tim Concierge saat memesan.",
  },
  {
    q: "Berapa lama proses pengambilan unit di gerai?",
    a: "Rata-rata hanya 5 hingga 15 menit. Setelah Anda melakukan konfirmasi via Live Chat atau WhatsApp Concierge, unit langsung disiapkan dan disterilisasi sehingga siap diambil begitu Anda tiba di cabang.",
  },
  {
    q: "Apa saja kelengkapan aksesoris yang didapat dalam paket sewa?",
    a: "Setiap paket sewa sudah termasuk unit iPhone pilihan Anda, kabel data USB-C Fast Charging original, kepala adaptor Apple 20W, Clear Case MagSafe pelindung benturan, serta pouch penyimpanan eksklusif iRent.",
  },
  {
    q: "Apakah melayani sewa mingguan atau bulanan untuk proyek event & korporasi?",
    a: "Tentu. Kami menyediakan program Business & Production Lease untuk rumah produksi, wedding organizer, instansi pemerintah, dan kepanitiaan event dengan potongan tarif hingga 35% serta dukungan unit cadangan siaga.",
  },
];

export default function TentangKamiPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [totalUnits, setTotalUnits] = useState<number>(0);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadDatabaseData() {
      try {
        const [branchesRes, iphonesRes] = await Promise.all([
          fetch("/api/branches").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/iphones").then((r) => (r.ok ? r.json() : null)),
        ]);

        if (!isMounted) return;

        const rawBranches: Branch[] = Array.isArray(branchesRes?.data)
          ? branchesRes.data
          : [];
        const rawIphones: IphoneUnit[] = Array.isArray(iphonesRes?.data)
          ? iphonesRes.data
          : [];

        const activeIphones = rawIphones.filter(
          (u) => u.status !== "nonaktif"
        );
        setTotalUnits(activeIphones.length);

        const enriched = rawBranches.map((b) =>
          enrichBranchWithUnits(b, activeIphones)
        );
        setBranches(enriched);
      } catch (err) {
        console.error("Failed to fetch branches from database:", err);
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    }

    loadDatabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  const branchCitiesLabel =
    branches.length > 0
      ? Array.from(new Set(branches.map((b) => b.kota))).join(", ")
      : "Aceh";

  const stats = [
    {
      value: totalUnits > 0 ? `${totalUnits} Unit` : "100%",
      title: totalUnits > 0 ? "Armada Aktif Siap Sewa" : "Armada Terkalibrasi",
      desc: "Unit iPhone resmi siap serah terima di seluruh cabang",
    },
    {
      value: "100%",
      title: "Unit Original Resmi",
      desc: "Garansi uang kembali jika unit rekondisi",
    },
    {
      value: `${branches.length || 4} Cabang`,
      title: "Pusat Layanan Aktif",
      desc: branchCitiesLabel,
    },
    {
      value: "4.9",
      suffix: "/ 5.0",
      title: "Kepuasan Pelanggan",
      desc: "Berdasarkan ulasan pelanggan terverifikasi",
    },
  ];

  const pillars = [
    {
      code: "PILAR 01",
      badge: "32-Point Diagnostic",
      title: "Hardware Pristine & Battery Health 90%+",
      desc: "Setiap unit melalui inspeksi sensor kamera, True Tone, mikrofon, Face ID, kesehatan baterai, dan sanitasi bodi sebelum diserahterimakan. Bebas akun iCloud milik penyewa sebelumnya.",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
        </svg>
      ),
    },
    {
      code: "PILAR 02",
      badge: "Perlindungan Inklusif",
      title: "Inklusi Perlindungan AppleCare+ Shield",
      desc: "Berkarya leluasa di alam bebas Pucok Krueng hingga pantai Iboih Sabang. Setiap paket otomatis menyertakan proteksi kerusakan wajar dan bantuan unit pengganti siaga 24 jam jika terjadi kendala teknis.",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      code: "PILAR 03",
      badge: "Tanpa Deposit Tunai",
      title: "Verifikasi Cepat 5 – 15 Menit",
      desc: "Cukup tunjukkan KTP/KTM asli sesuai yang terdaftar dalam sistem yang terenkripsi. Verifikasi instan via Live Chat atau WhatsApp dan langsung ambil di cabang terdekat.",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      {/* 1. HERO & STATS SECTION */}
      <section className="bg-[#F5F5F7] pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-[#D2D2D7]/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#D2D2D7]/80 px-4 py-1 text-[10.5px] font-bold uppercase tracking-widest text-[#0071E3] shadow-2xs">
              <span>✦</span> TENTANG IRENT ACEH • SEJAK 2021
            </span>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F] leading-[1.12]">
              Pengalaman Apple Terbaik,
              <br />
              Tanpa Harus <span className="text-[#0071E3]">Membeli.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#6E6E73]">
              iRent hadir sebagai pelopor rental iPhone premium di Tanah
              Rencong. Memberikan akses instan ke ekosistem teknologi Apple
              termutakhir dengan transparansi penuh serta layanan yang ramah
              tanpa jaminan rumit.
            </p>
          </div>

          {/* 4 Stat Cards */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.title}
                className="apple-card rounded-3xl bg-white p-6"
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-[34px] font-bold tracking-tight text-[#0071E3]">
                    {s.value}
                  </span>
                  {s.suffix && (
                    <span className="text-sm font-semibold text-[#86868B]">
                      {s.suffix}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[14px] font-bold text-[#1D1D1F]">
                  {s.title}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[#6E6E73]">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. VISI & STANDAR KUALITAS */}
      <section id="proteksi" className="bg-white py-16 sm:py-24 scroll-mt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
            {/* Left Story */}
            <div className="lg:col-span-5 space-y-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#0071E3]">
                VISI &amp; STANDAR KUALITAS
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] leading-snug">
                Mendemokrasikan Akses Teknologi Premium di Nanggroe Aceh.
              </h2>
              <p className="text-[13.5px] leading-relaxed text-[#6E6E73]">
                Berawal pada tahun 2021 di Banda Aceh,{" "}
                <strong className="font-semibold text-[#1D1D1F]">iRent</strong>{" "}
                didirikan untuk menjawab satu tantangan nyata: biaya kepemilikan
                iPhone flagship yang semakin tinggi, sementara kebutuhan akan
                rekaman video 4K ProRes untuk pernikahan, dokumentasi wisata
                Sabang, dan tugas akhir mahasiswa terus meluas.
              </p>
              <p className="text-[13.5px] leading-relaxed text-[#6E6E73]">
                Kami mengubah paradigma kepemilikan menjadi layanan fleksibel.
                Dengan transparansi syarat, unit terawat tanpa cacat fungsi, dan
                jaringan hub yang saling terhubung di kota-kota strategis Aceh,
                menyewa iPhone di iRent semudah mengambil pesanan kopi favorit
                Anda.
              </p>

              {/* Quote Box */}
              <div className="rounded-2xl bg-[#F5F5F7] border border-[#D2D2D7]/60 p-5 flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3] font-bold">
                  &ldquo;
                </div>
                <div>
                  <p className="text-[12.5px] font-medium italic leading-relaxed text-[#1D1D1F]">
                    &ldquo;Teknologi terbaik seharusnya memberdayakan karya Anda
                    hari ini, bukan membebani perencanaan finansial Anda.&rdquo;
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-[#6E6E73]">
                    — Tim Manajemen iRent Aceh
                  </p>
                </div>
              </div>
            </div>

            {/* Right 3 Pillar Cards */}
            <div className="lg:col-span-7 space-y-4">
              {pillars.map((p) => (
                <div
                  key={p.code}
                  className="apple-card rounded-3xl bg-white p-6 flex items-start gap-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
                    {p.icon}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">
                        {p.code}
                      </span>
                      <span className="rounded-full bg-[#E8F2FF] px-2.5 py-0.5 text-[10px] font-bold text-[#0071E3]">
                        {p.badge}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-[16px] font-bold text-[#1D1D1F]">
                      {p.title}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6E6E73]">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. JARINGAN GERAI TERINTEGRASI (Directly from database branches) */}
      <section
        id="cabang"
        className="bg-[#F5F5F7] py-16 sm:py-24 border-y border-[#D2D2D7]/50 scroll-mt-14"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0071E3]">
              📍 JARINGAN GERAI TERINTEGRASI
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Temukan Kami di Seluruh Titik Utama Aceh.
            </h2>
          </div>

          {loadingBranches ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="apple-card rounded-3xl bg-white p-5 h-56 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-4 w-24 rounded-full bg-[#F5F5F7]" />
                    <div className="h-5 w-36 rounded-lg bg-[#F5F5F7]" />
                    <div className="h-4 w-full rounded-lg bg-[#F5F5F7]" />
                  </div>
                  <div className="h-8 w-full rounded-xl bg-[#F5F5F7]" />
                </div>
              ))}
            </div>
          ) : branches.length === 0 ? (
            <div className="apple-card rounded-3xl bg-white p-10 text-center">
              <p className="text-base font-bold text-[#1D1D1F]">
                Belum ada cabang terdaftar di database
              </p>
              <p className="mt-1 text-xs text-[#6E6E73]">
                Data cabang akan otomatis tampil begitu ditambahkan ke tabel
                branches di Supabase.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {branches.map((b) => (
                <div
                  key={b.id}
                  className="apple-card flex flex-col justify-between rounded-3xl bg-white p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="rounded-full bg-[#E8F2FF] px-2.5 py-0.5 text-[10px] font-bold text-[#0071E3]">
                        Official Hub
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Buka
                      </span>
                    </div>

                    <h3 className="text-[17px] font-bold text-[#1D1D1F]">
                      {b.kota}
                    </h3>
                    <p className="text-[11.5px] font-medium text-[#86868B]">
                      {b.nama_cabang}
                    </p>

                    <p className="mt-3 text-[12px] leading-relaxed text-[#6E6E73]">
                      {b.alamat || `Gerai resmi iRent di ${b.kota}`}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#F5F5F7] space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-[#6E6E73]">
                      <span>09:00 - 22:00 WIB</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {b.unit_count ?? 0} Unit Tersedia
                      </span>
                    </div>

                    <Link
                      href={`/live-chat?cabang=${encodeURIComponent(
                        b.nama_cabang
                      )}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#F5F5F7] hover:bg-[#0071E3] py-2 text-[12px] font-semibold text-[#1D1D1F] hover:text-white transition-colors"
                    >
                      <span>💬</span> Hubungi Cabang
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inter-Hub Return Bar */}
          <div className="mt-6 rounded-2xl bg-white border border-[#D2D2D7]/70 p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F2FF] text-[#0071E3]">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </div>
              <div>
                <h3 className="text-[13.5px] font-bold text-[#1D1D1F]">
                  Layanan Antar-Cabang Se-Aceh (Inter-Hub Return)
                </h3>
                <p className="text-[12px] text-[#6E6E73]">
                  Sewa di Banda Aceh untuk perjalanan wisata/dinas, kembalikan
                  di Lhokseumawe atau Bireuen tanpa ribet.
                </p>
              </div>
            </div>

            <Link
              href="/live-chat"
              className="shrink-0 text-[12.5px] font-semibold text-[#0071E3] hover:underline"
            >
              Konfirmasi ke Concierge →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. FAQ SECTION */}
      <section id="faq" className="bg-white py-16 sm:py-24 scroll-mt-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2.5 mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0071E3]">
              ❓ PUSAT BANTUAN &amp; FAQ
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-[13.5px] text-[#6E6E73]">
              Semua hal yang perlu Anda ketahui sebelum menyewa armada iPhone
              kami. Bersih, transparan, tanpa biaya tersembunyi.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.q}
                  className={`rounded-2xl border transition-all duration-200 ${
                    isOpen
                      ? "border-[#0071E3]/40 bg-[#F5F5F7]/60 shadow-2xs"
                      : "border-[#D2D2D7]/60 bg-white hover:border-[#0071E3]/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[14px] font-semibold text-[#1D1D1F]">
                      {item.q}
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition-transform duration-200 ${
                        isOpen
                          ? "rotate-180 bg-[#0071E3] text-white"
                          : "bg-[#F5F5F7] text-[#6E6E73]"
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4.5 pt-0 text-[13px] leading-relaxed text-[#6E6E73]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CONCIERGE BANNER */}
      <section className="bg-[#F5F5F7] py-14 sm:py-20 border-t border-[#D2D2D7]/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] apple-deep-blue-banner p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sky-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                LAYANAN CONCIERGE 24 JAM
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Masih Punya Pertanyaan Lain?
              </h2>
              <p className="text-[13.5px] leading-relaxed text-white/80">
                Tim iRent siap membantu konsultasi pemilihan tipe iPhone, cek
                ketersediaan warna Titanium di cabang favorit Anda, hingga
                estimasi biaya paket hemat dalam hitungan menit.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto lg:min-w-[230px]">
              <Link
                href="/live-chat"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] border border-white/20 px-6 py-3.5 text-[13px] font-semibold text-white shadow-md transition-all"
              >
                <span>💬</span> Hubungi Live Chat Anonim
              </Link>
              <Link
                href="/katalog"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/12 hover:bg-white/20 border border-white/20 px-6 py-3 text-[13px] font-semibold text-white transition-all"
              >
                Jelajahi Seri iPhone →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
