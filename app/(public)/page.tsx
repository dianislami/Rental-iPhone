"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { IphoneVisual } from "@/components/public/IphoneVisual";
import { Footer } from "@/components/public/Footer";
import {
  Branch,
  IphoneUnit,
  PriceVariant,
  enrichBranchWithUnits,
  enrichIphoneUnit,
  formatRupiah,
} from "@/lib/public-data";

export default function HomePage() {
  const [featuredUnits, setFeaturedUnits] = useState<IphoneUnit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      setLoading(true);
      try {
        const [iphonesRes, variantsRes, branchesRes] = await Promise.all([
          fetch("/api/iphones").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/price-variants").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/branches").then((r) => (r.ok ? r.json() : null)),
        ]);

        if (!isMounted) return;

        const allVariants: PriceVariant[] = Array.isArray(variantsRes?.data)
          ? variantsRes.data
          : [];
        const rawIphones: IphoneUnit[] = Array.isArray(iphonesRes?.data)
          ? iphonesRes.data
          : [];
        const rawBranches: Branch[] = Array.isArray(branchesRes?.data)
          ? branchesRes.data
          : [];

        const activeIphones = rawIphones
          .filter((u) => u.status !== "nonaktif")
          .map((u) => enrichIphoneUnit(u, allVariants));

        setFeaturedUnits(activeIphones.slice(0, 3));
        setBranches(
          rawBranches.map((b) => enrichBranchWithUnits(b, activeIphones))
        );
      } catch (err) {
        console.error("Failed to load home data from database:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  const whyChooseItems = [
    {
      title: "100% Original",
      desc: "Unit resmi Apple (PA/A, ID/A, ZP/A). Bebas iCloud, layar True Tone aktif, dan sensor kamera terkalibrasi penuh.",
      linkText: "Garansi tukar unit →",
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
      title: "Battery Health Prima",
      desc: "Setiap unit melewati inspeksi siklus baterai ketat agar tahan seharian untuk pembuatan konten 4K 60fps.",
      linkText: "Termasuk Charger 20W →",
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
    {
      title: "Zero-Stress Care",
      desc: "Perlindungan terhadap risiko goresan halus pemakaian wajar. Sewa dengan tenang tanpa biaya tersembunyi.",
      linkText: "Tanpa deposit tunai →",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      title: "Pickup Cepat 15M",
      desc: "Cukup verifikasi KTP/KTM asli di gerai terdekat. Unit langsung siap pakai dalam kondisi bersih & steril.",
      linkText: "Lihat lokasi gerai →",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  const rentalSteps = [
    {
      num: "01",
      title: "Pilih Cabang",
      desc: "Tentukan lokasi cabang pengambilan unit terdekat sesuai kota domisili Anda.",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      num: "02",
      title: "Pilih Unit & Durasi",
      desc: "Pilih seri iPhone dan varian paket durasi sewa sesuai kebutuhan Anda.",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      ),
    },
    {
      num: "03",
      title: "Verifikasi Data",
      desc: "Konfirmasi ketersediaan via Live Chat / Concierge cukup dengan KTP atau KTM mahasiswa aktif.",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
    },
    {
      num: "04",
      title: "Pembayaran Aman",
      desc: "Selesaikan pembayaran via QRIS, transfer bank, atau bayar langsung saat serah terima.",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
    {
      num: "05",
      title: "Ambil & Gunakan",
      desc: "Cek fisik bersama staf kami selama 5 menit di gerai, dan iPhone siap mengabadikan momen Anda.",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  const testimonials = [
    {
      quote:
        "Sewa iPhone buat liburan akhir pekan. Hasil foto dan video jernih luar biasa, kondisi baterai sangat awet dan proses ambil di cabang cuma 10 menit!",
      name: "Nadia Syafira",
      role: "Content Creator",
      initials: "NS",
    },
    {
      quote:
        "Sebagai mahasiswa, syarat sewa pakai KTM sangat membantu saat butuh iPhone untuk tugas produksi film pendek kampus. Tanpa tahan deposit uang tunai sama sekali.",
      name: "Teuku Farhan",
      role: "Mahasiswa",
      initials: "TF",
    },
    {
      quote:
        "Tim dokumentasi kami selalu mengandalkan iRent untuk backup kamera ProRes Log. Unit selalu mulus seperti baru keluar dari box.",
      name: "Rizky Maulana",
      role: "Videografer",
      initials: "RM",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#F5F5F7] pt-10 pb-16 sm:pt-14 sm:pb-24 border-b border-[#D2D2D7]/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#D2D2D7]/80 px-3.5 py-1.5 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-[#0071E3]"></span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3]">
                  RENTAL IPHONE RESMI &amp; BERGARANSI
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[#1D1D1F] leading-[1.06]">
                Rent Your Favorite{" "}
                <span className="text-[#0071E3]">iPhone.</span>
              </h1>

              <p className="max-w-lg text-[15px] sm:text-[16px] leading-relaxed text-[#6E6E73]">
                Sewa iPhone seri terbaru untuk konten, liburan, atau event.
                Kondisi baterai terawat, perlindungan AppleCare+, dan serah
                terima instan
                {branches.length > 0
                  ? ` di ${branches.length} cabang resmi.`
                  : " di seluruh cabang resmi kami."}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  href="/katalog"
                  className="inline-flex items-center justify-center rounded-full bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0068D1] px-6 py-3 text-[13px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all duration-200 hover:scale-[1.02]"
                >
                  Jelajahi Katalog
                </Link>
                <a
                  href="#cabang"
                  className="inline-flex items-center justify-center rounded-full bg-white hover:bg-[#E8F2FF] border border-[#D2D2D7]/80 hover:border-[#0071E3]/30 px-6 py-3 text-[13px] font-semibold text-[#1D1D1F] hover:text-[#0071E3] transition-all duration-200"
                >
                  Cek Lokasi Cabang
                </a>
              </div>

              {/* Micro Trust Badges */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-[12px] font-medium text-[#6E6E73]">
                <span className="inline-flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4 text-[#0071E3]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Garansi Unit Original
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4 text-[#0071E3]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Verifikasi 15 Menit
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4 text-[#0071E3]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {branches.length > 0
                    ? `${branches.length} Cabang Resmi`
                    : "Cabang Resmi Terintegrasi"}
                </span>
              </div>
            </div>

            {/* Right Studio Visual Frame */}
            <div className="lg:col-span-6">
              <div className="rounded-[32px] bg-white p-3.5 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-[#D2D2D7]/60">
                <div className="relative rounded-[24px] bg-gradient-to-b from-[#F5F5F7] to-[#EBEBF0] px-6 py-8 sm:py-10 flex items-center justify-center overflow-hidden">
                  <IphoneVisual
                    variant="hero"
                    className="w-full h-[320px] sm:h-[360px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MENGAPA MEMILIH IRENT */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center space-y-2.5 mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071E3]">
              STANDAR LAYANAN APPLE
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Mengapa Memilih iRent
            </h2>
            <p className="text-[14px] text-[#6E6E73] leading-relaxed">
              Kami menerapkan standar kualitas tertinggi layaknya membeli unit
              baru di Apple Authorised Reseller.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyChooseItems.map((item) => (
              <div
                key={item.title}
                className="apple-card flex flex-col justify-between rounded-3xl p-6"
              >
                <div>
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FF] text-[#0071E3]">
                    {item.icon}
                  </div>
                  <h3 className="text-[16px] font-bold text-[#1D1D1F] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[12.5px] leading-relaxed text-[#6E6E73]">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F5F5F7]">
                  <Link
                    href="/tentang-kami"
                    className="text-[12px] font-semibold text-[#0071E3] hover:underline"
                  >
                    {item.linkText}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. UNIT PALING DIMINATI (LANGSUNG DARI DATABASE) */}
      <section className="bg-[#F5F5F7] py-16 sm:py-24 border-y border-[#D2D2D7]/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071E3] mb-1.5">
                ARMADA UNGGULAN
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
                Unit Paling Diminati
              </h2>
            </div>
            <Link
              href="/katalog"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0071E3] hover:text-[#0077ED] transition-colors"
            >
              Lihat Semua Armada
              <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-[28px] bg-white p-5 border border-[#D2D2D7]/50 animate-pulse space-y-4"
                >
                  <div className="h-5 w-1/2 rounded bg-[#F5F5F7]" />
                  <div className="h-44 rounded-2xl bg-[#F5F5F7]" />
                  <div className="h-5 w-2/3 rounded bg-[#F5F5F7]" />
                  <div className="h-4 w-full rounded bg-[#F5F5F7]" />
                  <div className="h-10 w-full rounded-full bg-[#E8F2FF]" />
                </div>
              ))}
            </div>
          ) : featuredUnits.length === 0 ? (
            <div className="apple-card rounded-3xl bg-white p-10 text-center">
              <p className="text-[15px] font-bold text-[#1D1D1F]">
                Belum ada unit iPhone di database
              </p>
              <p className="mt-1 text-[13px] text-[#6E6E73]">
                Data unit akan otomatis tampil di sini setelah ditambahkan ke
                tabel <code className="text-[#0071E3]">iphones</code> di
                Supabase.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="group apple-card flex flex-col justify-between rounded-[28px] p-5 bg-white"
                >
                  <div>
                    {/* Card Top Bar */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F2FF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0071E3]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]"></span>
                        {unit.highlight_badge ||
                          unit.availability_label ||
                          "TERSEDIA"}
                      </span>
                      <span className="text-[11px] font-medium text-[#86868B]">
                        {unit.branches?.nama_cabang ||
                          unit.branches?.kota ||
                          ""}
                      </span>
                    </div>

                    {/* Image Container */}
                    <div className="relative mb-4 flex h-44 items-center justify-center rounded-2xl bg-[#F5F5F7] p-4 overflow-hidden">
                      <IphoneVisual
                        model={unit.tipe || unit.nama_unit}
                        colorName={unit.warna}
                        colorHex={unit.color_hex}
                        imageUrl={unit.image_url}
                        variant="card"
                        className="h-full w-full"
                      />
                    </div>

                    {/* Color & Storage Subtitle */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6E6E73] mb-1">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/15"
                        style={{ backgroundColor: unit.color_hex || "#9A968E" }}
                      />
                      <span>
                        {unit.warna} • {unit.storage} • BH {unit.battery_health}
                      </span>
                    </div>

                    {/* Unit Title */}
                    <h3 className="text-[19px] font-bold tracking-tight text-[#1D1D1F]">
                      {unit.nama_unit}
                    </h3>
                    {unit.deskripsi && (
                      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-[#6E6E73]">
                        {unit.deskripsi}
                      </p>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="mt-5 pt-4 border-t border-[#F5F5F7]">
                    <div className="mb-3.5 flex items-baseline gap-1.5">
                      {unit.price_per_day ? (
                        <>
                          <span className="text-[22px] font-bold tracking-tight text-[#1D1D1F]">
                            {formatRupiah(unit.price_per_day)}
                          </span>
                          <span className="text-[12px] text-[#86868B]">
                            /{" "}
                            {unit.variants?.[0]?.nama_varian || "paket"}
                          </span>
                        </>
                      ) : (
                        <span className="text-[14px] font-semibold text-[#0071E3]">
                          Lihat Varian Harga
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/katalog/${unit.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] py-2.5 text-[13px] font-semibold text-white shadow-xs transition-all duration-200"
                    >
                      Lihat Detail Unit
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Weekly/Monthly Production Banner */}
          <div className="mt-8 rounded-2xl bg-white border border-[#D2D2D7]/70 p-5 sm:px-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div>
              <h3 className="text-[14px] font-bold text-[#1D1D1F]">
                Butuh sewa mingguan atau bulanan untuk produksi &amp; proyek
                film?
              </h3>
              <p className="text-[12.5px] text-[#6E6E73] mt-0.5">
                Dapatkan potongan harga khusus dan akses prioritas unit cadangan
                di seluruh cabang resmi kami.
              </p>
            </div>
            <Link
              href="/live-chat"
              className="shrink-0 inline-flex items-center justify-center rounded-full bg-[#E8F2FF] hover:bg-[#0071E3] px-5 py-2.5 text-[12.5px] font-semibold text-[#0071E3] hover:text-white transition-colors"
            >
              Konsultasi Paket Khusus
            </Link>
          </div>
        </div>
      </section>

      {/* 4. CARA SEWA IPHONE DI IRENT */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center space-y-2 mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071E3]">
              PROSES MUDAH &amp; CEPAT
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Cara Sewa iPhone di iRent
            </h2>
            <p className="text-[14px] text-[#6E6E73]">
              Proses transparan, tanpa deposit tunai, selesai dalam 15 menit.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {rentalSteps.map((step) => (
              <div
                key={step.num}
                className="apple-card flex flex-col justify-between rounded-2xl p-5"
              >
                <div>
                  <span className="inline-flex h-6 items-center rounded-md bg-[#E8F2FF] px-2 text-[11px] font-bold text-[#0071E3] mb-3">
                    {step.num}
                  </span>
                  <h3 className="text-[15px] font-bold text-[#1D1D1F] mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-[12px] leading-relaxed text-[#6E6E73]">
                    {step.desc}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#F5F5F7] text-[#0071E3]">
                  {step.icon}
                  <span className="text-[11px] font-medium text-[#86868B]">
                    Langkah {step.num}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CABANG RESMI (LANGSUNG DARI DATABASE) */}
      <section
        id="cabang"
        className="bg-[#F5F5F7] py-16 sm:py-24 border-y border-[#D2D2D7]/50 scroll-mt-14"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071E3] mb-1.5">
                📍 JARINGAN GERAI
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
                {branches.length > 0
                  ? `${branches.length} Cabang Resmi Kami`
                  : "Cabang Resmi Kami"}
              </h2>
            </div>
            <p className="max-w-md text-[13px] text-[#6E6E73] leading-relaxed">
              Ambil dan kembalikan unit di cabang resmi kami dengan proses
              verifikasi cepat dan transparan.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="rounded-3xl bg-white p-5 border border-[#D2D2D7]/50 animate-pulse space-y-3"
                >
                  <div className="h-4 w-24 rounded bg-[#F5F5F7]" />
                  <div className="h-5 w-3/4 rounded bg-[#F5F5F7]" />
                  <div className="h-12 w-full rounded bg-[#F5F5F7]" />
                </div>
              ))}
            </div>
          ) : branches.length === 0 ? (
            <div className="apple-card rounded-3xl bg-white p-10 text-center">
              <p className="text-[15px] font-bold text-[#1D1D1F]">
                Belum ada data cabang di database
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="apple-card flex flex-col justify-between rounded-3xl p-5 bg-white"
                >
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F2FF] px-2.5 py-0.5 text-[10px] font-semibold text-[#0071E3] mb-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      {branch.kota.toUpperCase()}
                    </span>
                    <h3 className="text-[16px] font-bold text-[#1D1D1F]">
                      {branch.nama_cabang}
                    </h3>
                    <p className="mt-2 text-[12px] leading-relaxed text-[#6E6E73]">
                      {branch.alamat || `Cabang resmi iRent di ${branch.kota}`}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#F5F5F7] flex items-center justify-between">
                    <Link
                      href={`/katalog?branch_id=${encodeURIComponent(
                        branch.id
                      )}`}
                      className="text-[12px] font-semibold text-[#0071E3] hover:underline"
                    >
                      Lihat Unit ({branch.unit_count ?? 0}) →
                    </Link>
                    <a
                      href={branch.google_maps_url || "https://maps.google.com"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-[#6E6E73] hover:text-[#0071E3]"
                    >
                      Peta ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. CERITA PELANGGAN */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center space-y-2 mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071E3]">
              ULASAN PELANGGAN
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Cerita Pelanggan iRent
            </h2>
            <p className="text-[14px] text-[#6E6E73]">
              Pengalaman nyata dari mahasiswa, kreator konten, hingga wisatawan.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="apple-card flex flex-col justify-between rounded-3xl p-6"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#0071E3] mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-4 w-4 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-[#1D1D1F] font-medium">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-[#F5F5F7]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F2FF] text-[12px] font-bold text-[#0071E3]">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1D1D1F]">
                      {t.name}
                    </p>
                    <p className="text-[11px] text-[#86868B]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA CARD */}
      <section className="bg-[#F5F5F7] py-14 sm:py-20 border-t border-[#D2D2D7]/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-white border border-[#D2D2D7]/70 p-8 sm:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071E3]">
                RESERVASI INSTAN
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
                Siap Mengabadikan Momen Istimewa?
              </h2>
              <p className="text-[13.5px] leading-relaxed text-[#6E6E73]">
                Konsultasikan pilihan iPhone terbaik bersama tim Concierge kami
                melalui Live Chat Anonim atau WhatsApp dalam hitungan menit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/live-chat"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-6 py-3.5 text-[13px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all duration-200 hover:scale-[1.02]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Mulai Live Chat Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
