"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/public/Footer";
import {
  ClipboardListIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SparklesIcon,
  StarIcon,
  StoreIcon,
} from "@/components/ui/Icons";
import {
  Branch,
  IphoneUnit,
  enrichBranchWithUnits,
} from "@/lib/public-data";


const FAQ_ITEMS = [
  {
    q: "Apa saja syarat untuk menyewa iPhone di iRent?",
    a: "Penyewa perlu menyiapkan KTP asli yang masih berlaku atau identitas lain seperti KTM mahasiswa aktif, SIM, kartu pegawai, maupun paspor. Untuk informasi lebih lanjut mengenai persyaratan penyewaan, kamu bisa menghubungi tim iRent.",
  },
  {
    q: "Apakah unit iPhone yang disewakan dalam kondisi baik?",
    a: "Setiap unit diperiksa sebelum disewakan untuk memastikan fungsi perangkat berjalan dengan baik. Informasi mengenai spesifikasi, kondisi fisik, dan Battery Health juga dapat dilihat pada halaman detail masing-masing unit.",
  },
  {
    q: "Bagaimana jika iPhone mengalami goresan atau kerusakan selama masa sewa?",
    a: "Kondisi unit akan diperiksa saat dikembalikan. Jika terdapat goresan atau kerusakan, penanganannya akan disesuaikan dengan kondisi dan tingkat kerusakan. Untuk kerusakan yang cukup berat, penyewa dapat dikenakan biaya tambahan sesuai ketentuan yang berlaku.",
  },
  {
    q: "Apakah iPhone bisa dikembalikan di cabang yang berbeda?",
    a: "Pengembalian unit harus dilakukan di cabang yang sama dengan lokasi pengambilan. Jadi, jika kamu mengambil iPhone di cabang Banda Aceh, pengembaliannya juga dilakukan di cabang Banda Aceh.",
  },
  {
    q: "Bagaimana jika terlambat mengembalikan iPhone?",
    a: "Pengembalian yang melewati waktu sewa yang telah disepakati akan dikenakan biaya tambahan sesuai ketentuan keterlambatan yang berlaku. Karena itu, pastikan kamu mengembalikan unit sesuai jadwal yang telah ditentukan.",
  },
  {
    q: "Apa saja aksesoris yang didapat saat menyewa iPhone?",
    a: "Setiap penyewaan iPhone sudah termasuk casing dan charger yang dapat digunakan selama masa sewa. Pastikan seluruh perlengkapan dikembalikan bersama unit saat masa penyewaan berakhir.",
  },
  {
    q: "Apakah bisa menyewa iPhone untuk jangka waktu mingguan atau bulanan?",
    a: "Tentu. Untuk kebutuhan penyewaan jangka panjang, seperti produksi konten, dokumentasi acara, maupun keperluan pekerjaan, kamu bisa menghubungi tim iRent. Durasi penyewaan, pilihan unit, dan harga dapat didiskusikan sesuai kebutuhan.",
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
      title: totalUnits > 0 ? "Unit Aktif Siap Sewa" : "Armada Terkalibrasi",
      desc: "Unit iPhone resmi siap serah terima di seluruh cabang",
      icon: <SmartphoneIcon className="h-4.5 w-4.5" />,
    },
    {
      value: "100%",
      title: "Unit Original Resmi",
      desc: "Garansi uang kembali jika unit rekondisi",
      icon: <ShieldCheckIcon className="h-4.5 w-4.5" />,
    },
    {
      value: `${branches.length || 4} Cabang`,
      title: "Pusat Layanan Aktif",
      desc: branchCitiesLabel,
      icon: <StoreIcon className="h-4.5 w-4.5" />,
    },
    {
      value: "4.9",
      suffix: "/ 5.0",
      title: "Kepuasan Pelanggan",
      desc: "Berdasarkan ulasan pelanggan terverifikasi",
      icon: <StarIcon className="h-4.5 w-4.5" />,
    },
  ];

  const pillars = [
    {
      code: "PILAR 01",
      title: "Unit yang Terawat",
      desc: "Setiap iPhone diperiksa sebelum disewakan, mulai dari fungsi perangkat hingga kondisi fisiknya. Kami juga memperhatikan kondisi baterai agar pelanggan dapat memilih unit dengan informasi yang jelas.",
      icon: <ShieldCheckIcon className="h-5 w-5" />,
    },
    {
      code: "PILAR 02",
      title: "Beragam Pilihan iPhone",
      desc: "Kami menyediakan berbagai tipe iPhone dengan pilihan kapasitas penyimpanan yang beragam. Kamu bisa melihat spesifikasi setiap unit dan memilih sesuai kebutuhan, baik untuk aktivitas sehari-hari, membuat konten, maupun keperluan lainnya.",
      icon: <SmartphoneIcon className="h-5 w-5" />,
    },
    {
      code: "PILAR 03",
      title: "Proses Penyewaan yang Mudah",
      desc: "Kami berusaha membuat proses penyewaan lebih mudah dengan informasi harga, durasi, dan ketentuan yang jelas sejak awal. Jika masih ada yang ingin ditanyakan, kamu bisa menghubungi tim kami sebelum melakukan pemesanan.",
      icon: <ClipboardListIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* 1. HERO & STATS SECTION */}
      <section className="bg-[#F5F5F7] pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-[#D2D2D7]/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#D2D2D7]/80 px-4 py-1 text-[10.5px] font-bold uppercase tracking-widest text-[#0071E3] shadow-2xs">
              <SparklesIcon className="h-3.5 w-3.5 text-[#0071E3]" />
              <span>TENTANG IRENT • SEJAK 2021</span>
            </span>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F] leading-[1.12]">
              Pengalaman iPhone Terbaik,
              <br />
              Tanpa Harus <span className="text-[#0071E3]">Membeli.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#6E6E73]">
              iRent menyediakan layanan penyewaan iPhone untuk berbagai kebutuhan, mulai dari membuat konten, liburan, hingga acara.
              Kami berupaya memberikan pengalaman penyewaan yang mudah dengan pilihan unit, informasi harga, dan ketentuan sewa yang jelas.
            </p>
          </div>

          {/* 4 Stat Cards */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.title}
                className="apple-card rounded-3xl bg-white p-6"
              >
                <div className="flex items-start justify-between gap-2">
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
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F2FF] text-[#0071E3]">
                    {s.icon}
                  </span>
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
                TENTANG KAMI
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] leading-snug">
                iRent Hadir untuk Berbagai Kebutuhan Media.
              </h2>
              <p className="text-[13.5px] leading-relaxed text-[#6E6E73]">
                {" "}<strong className="font-semibold text-[#1D1D1F]">iRent</strong>{" "}
                hadir sejak 2021 di Banda Aceh sebagai layanan penyewaan iPhone untuk berbagai kebutuhan.
                Kami ingin memberikan pilihan bagi siapa saja yang ingin menggunakan iPhone tanpa harus membelinya,
                baik untuk membuat konten, liburan, dokumentasi acara, maupun keperluan lainnya.
              </p>
              <p className="text-[13.5px] leading-relaxed text-[#6E6E73]">
                Seiring waktu, {" "}<strong className="font-semibold text-[#1D1D1F]">iRent</strong>{" "}
                terus berkembang dan hadir di beberapa kota di Aceh. Kami berusaha menyediakan unit yang terawat,
                pilihan iPhone yang beragam, serta proses penyewaan dengan informasi harga dan ketentuan yang jelas.
              </p>

              {/* Quote Box */}
              <div className="rounded-2xl bg-[#F5F5F7] border border-[#D2D2D7]/60 p-5 flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3] font-bold">
                  &ldquo;
                </div>
                <div>
                  <p className="text-[12.5px] font-medium italic leading-relaxed text-[#1D1D1F]">
                    &ldquo;Kami ingin membuat pengalaman menyewa iPhone terasa lebih mudah dan prakis.&rdquo;
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-[#6E6E73]">
                    - Tim iRent
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
                    <h3 className="mt-1 text-[20px] font-bold text-[#0071E3]">
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
              JARINGAN GERAI TERINTEGRASI
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
                    </div>

                    <h3 className="text-[17px] font-bold text-[#1D1D1F]">
                      {b.kota}
                    </h3>

                    <p className="text-[14px] leading-relaxed text-[#6E6E73]">
                      {b.alamat || `Gerai resmi iRent di ${b.kota}`}
                    </p>
                  </div>

                  <div className="mt-3 pt-3.5 border-t border-[#F5F5F7] space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-[#6E6E73]">
                      <span>09:00 - 22:00 WIB</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {b.unit_count ?? 0} Unit Tersedia
                      </span>
                    </div>

                    <Link
                      href={`/katalog?branch_id=${encodeURIComponent(b.id)}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#F5F5F7] hover:bg-[#0071E3] py-2 text-[12px] font-semibold text-[#1D1D1F] hover:text-white transition-colors"
                    >
                      Lihat Katalog
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. FAQ SECTION */}
      <section id="faq" className="bg-white py-16 sm:py-24 scroll-mt-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2.5 mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0071E3]">
              PUSAT BANTUAN &amp; FAQ
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-[13.5px] text-[#6E6E73]">
              Punya pertanyaan sebelum menyewa iPhone? Temukan informasi seputar pilihan unit, harga, persyaratan, dan proses penyewaan di sini.
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
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${
                        isOpen
                          ? "rotate-180 bg-[#0071E3] text-white"
                          : "bg-[#E8F2FF] text-[#0071E3]"
                      }`}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
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
                BUTUH BANTUAN
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Masih Punya Pertanyaan Lain?
              </h2>
              <p className="text-[13.5px] leading-relaxed text-white/80">
                Tim iRent siap membantu jika kamu membutuhkan informasi lebih lanjut.
                Mulai dari memilih tipe iPhone, mengecek ketersediaan unit, hingga mengetahui harga dan ketentuan penyewaan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto lg:min-w-[230px]">
              <Link
                href="/live-chat"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] border border-white/20 px-6 py-3.5 text-[13px] font-semibold text-white shadow-md transition-all"
              >
                Hubungi Live Chat 
              </Link>
              <Link
                href="/katalog"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/12 hover:bg-white/20 border border-white/20 px-6 py-3 text-[13px] font-semibold text-white transition-all"
              >
                Jelajahi Katalog iPhone →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
