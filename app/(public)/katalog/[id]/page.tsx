"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { IphoneVisual } from "@/components/public/IphoneVisual";
import { BackButton } from "@/components/public/BackButton";
import {
  Branch,
  IphoneUnit,
  PriceVariant,
  enrichBranchWithUnits,
  enrichIphoneUnit,
  formatRupiah,
  getColorHex,
  getEffectivePrice,
  isPromoValid,
} from "@/lib/public-data";

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const DAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const DAY_NAMES_FULL_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatFullIndonesianDate(key: string, todayKey: string): string {
  if (!key) return "Hari Ini";
  const d = parseDateKey(key);
  const dayName = DAY_NAMES_FULL_ID[d.getDay()];
  const dateNum = d.getDate();
  const monthShort = MONTH_SHORT_ID[d.getMonth()];
  const year = d.getFullYear();

  if (key === todayKey) {
    return `Hari Ini, ${dateNum} ${monthShort} ${year}`;
  }
  return `${dayName}, ${dateNum} ${monthShort} ${year}`;
}

function DetailUnitContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const unitId = params?.id || "";

  const [unit, setUnit] = useState<IphoneUnit | null>(null);
  const [siblingUnits, setSiblingUnits] = useState<IphoneUnit[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedColor, setSelectedColor] = useState<{
    name: string;
    hex: string;
    unitId?: string;
  }>({
    name: "",
    hex: "#9A968E",
  });
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);

  // Monthly Calendar States (initialized in useEffect on client)
  const [todayKey, setTodayKey] = useState<string>("");
  const [selectedDateKey, setSelectedDateKey] = useState<string>("");
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(10); // 0-indexed (0 = Jan)
  const [minYear, setMinYear] = useState<number>(2026);
  const [minMonth, setMinMonth] = useState<number>(0);

  useEffect(() => {
    const now = new Date();
    const key = toDateKey(now);
    setTodayKey(key);
    setSelectedDateKey(key);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setMinYear(now.getFullYear());
    setMinMonth(now.getMonth());
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      setLoading(true);
      try {
        const [detailRes, allIphonesRes, variantsRes, branchesRes] =
          await Promise.all([
            unitId
              ? fetch(`/api/iphones/${unitId}`).then((r) =>
                  r.ok ? r.json() : null
                )
              : Promise.resolve(null),
            fetch("/api/iphones").then((r) => (r.ok ? r.json() : null)),
            fetch("/api/price-variants").then((r) => (r.ok ? r.json() : null)),
            fetch("/api/branches").then((r) => (r.ok ? r.json() : null)),
          ]);

        if (!isMounted) return;

        const allVariants: PriceVariant[] = Array.isArray(variantsRes?.data)
          ? variantsRes.data
          : [];
        const rawIphones: IphoneUnit[] = Array.isArray(allIphonesRes?.data)
          ? allIphonesRes.data
          : [];
        const rawBranches: Branch[] = Array.isArray(branchesRes?.data)
          ? branchesRes.data
          : [];

        const enrichedBranches = rawBranches.map((b) =>
          enrichBranchWithUnits(b, rawIphones)
        );

        const targetRawUnit: IphoneUnit | null =
          detailRes?.success && detailRes.data
            ? detailRes.data
            : rawIphones.find((u) => u.id === unitId) || rawIphones[0] || null;

        if (targetRawUnit) {
          const enriched = enrichIphoneUnit(targetRawUnit, allVariants);
          setUnit(enriched);
          setSelectedColor({
            name: enriched.warna,
            hex: enriched.color_hex || getColorHex(enriched.warna),
            unitId: enriched.id,
          });

          // Find sibling units of the same tipe from database for color switching
          const siblings = rawIphones
            .filter(
              (u) =>
                u.status !== "nonaktif" &&
                u.tipe.toLowerCase() === enriched.tipe.toLowerCase()
            )
            .map((u) => enrichIphoneUnit(u, allVariants));
          setSiblingUnits(siblings);

          // Select primary variant (e.g. 1 Hari / 24 Jam or first active variant)
          const vars = enriched.variants || [];
          const preferredIdx = vars.findIndex(
            (v) =>
              v.nama_varian.toLowerCase().includes("1 hari") ||
              v.nama_varian.toLowerCase().includes("24 jam")
          );
          setSelectedVariantIdx(preferredIdx >= 0 ? preferredIdx : 0);

          // Match branch from database
          const matchedBranch =
            enrichedBranches.find((b) => b.id === enriched.branch_id) ||
            enrichedBranches.find(
              (b) =>
                b.nama_cabang.toLowerCase() ===
                (enriched.branches?.nama_cabang || "").toLowerCase()
            ) ||
            enrichedBranches[0] ||
            null;
          setBranch(matchedBranch);
        } else {
          setUnit(null);
        }
      } catch (err) {
        console.error("Failed to fetch unit detail from database:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [unitId]);

  // Distinct colors from database sibling units of the same model/tipe
  const availableColors = useMemo(() => {
    if (!unit) return [];
    const map = new Map<
      string,
      { name: string; hex: string; unitId: string }
    >();
    map.set(unit.warna.toLowerCase(), {
      name: unit.warna,
      hex: unit.color_hex || getColorHex(unit.warna),
      unitId: unit.id,
    });
    siblingUnits.forEach((sib) => {
      const key = sib.warna.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: sib.warna,
          hex: sib.color_hex || getColorHex(sib.warna),
          unitId: sib.id,
        });
      }
    });
    return Array.from(map.values());
  }, [unit, siblingUnits]);

  // Build full monthly calendar cells for (viewYear, viewMonth)
  const monthlyCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: Array<{
      dateKey: string | null;
      dayNumber: number | null;
      isPast: boolean;
      isToday: boolean;
      status: "available" | "reserved";
    }> = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({
        dateKey: null,
        dayNumber: null,
        isPast: true,
        isToday: false,
        status: "available",
      });
    }

    const isUnitActive = unit ? unit.status === "aktif" : true;

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const key = toDateKey(d);
      const isPast = Boolean(todayKey && key < todayKey);
      const isToday = key === todayKey;

      cells.push({
        dateKey: key,
        dayNumber: day,
        isPast,
        isToday,
        status: isUnitActive ? "available" : "reserved",
      });
    }

    return cells;
  }, [viewYear, viewMonth, todayKey, unit]);

  const canGoPrevMonth =
    viewYear > minYear || (viewYear === minYear && viewMonth > minMonth);

  function handlePrevMonth() {
    if (!canGoPrevMonth) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function selectQuickOffset(daysFromToday: number) {
    if (!todayKey) return;
    const base = parseDateKey(todayKey);
    base.setDate(base.getDate() + daysFromToday);
    const key = toDateKey(base);
    setSelectedDateKey(key);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-6">
            <div className="h-96 rounded-[28px] bg-white animate-pulse" />
            <div className="h-48 rounded-[28px] bg-white animate-pulse" />
          </div>
          <div className="lg:col-span-6 space-y-6">
            <div className="h-32 rounded-[28px] bg-white animate-pulse" />
            <div className="h-56 rounded-[28px] bg-white animate-pulse" />
            <div className="h-72 rounded-[28px] bg-white animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] py-20">
        <div className="mx-auto max-w-xl px-4 text-center">
          <div className="apple-card rounded-3xl bg-white p-10 space-y-4">
            <h1 className="text-xl font-bold text-[#1D1D1F]">
              Unit iPhone Tidak Ditemukan
            </h1>
            <p className="text-sm text-[#6E6E73]">
              Unit yang Anda cari tidak tersedia di database atau sudah
              dinonaktifkan.
            </p>
            <Link
              href="/katalog"
              className="inline-flex items-center rounded-full bg-[#0071E3] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#0077ED]"
            >
              ← Kembali ke Katalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const variants = unit.variants || [];
  const activeVariant: PriceVariant | null =
    variants[selectedVariantIdx] || variants[0] || null;
  const effectivePrice = activeVariant ? getEffectivePrice(activeVariant) : 0;

  const selectedDateLabel = formatFullIndonesianDate(selectedDateKey, todayKey);

  const branchName =
    branch?.nama_cabang || unit.branches?.nama_cabang || "Cabang iRent";
  const branchKota = branch?.kota || unit.branches?.kota || "Aceh";
  const branchAlamat = branch?.alamat || `Hub Resmi iRent ${branchKota}`;

  // Pass rich product metadata to /live-chat so it can auto-send a Shopee-style product card
  const queryParams = new URLSearchParams({
    unitId: unit.id,
    unit: unit.nama_unit,
    tipe: unit.tipe,
    storage: unit.storage,
    warna: selectedColor.name || unit.warna,
    baterai: unit.battery_health,
    durasi: activeVariant?.nama_varian || "Harian",
    harga: effectivePrice ? formatRupiah(effectivePrice) : "Hubungi Kami",
    cabang: `${branchName} (${branchKota})`,
    jadwal: selectedDateLabel,
    ...(unit.image_url ? { image: unit.image_url } : {}),
  });

  const liveChatBookingUrl = `/live-chat?${queryParams.toString()}`;

  return (
    <div className="flex flex-col bg-[#F5F5F7] min-h-screen">
      {/* Main Content */}
      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Back Button Only */}
        <div className="mb-5">
          <BackButton fallbackHref="/katalog" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* LEFT COLUMN (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* 1. Product Studio Card */}
            <div className="apple-card rounded-[28px] bg-white p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-[#1D1D1F]">
                  <span>⚙️</span>{" "}
                  {unit.status === "aktif"
                    ? "GRADE-A PRISTINE"
                    : unit.status.toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F2FF] px-3 py-1 text-[10.5px] font-semibold text-[#0071E3]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]"></span>
                  Baterai {unit.battery_health} Health
                </span>
              </div>

              {/* Studio Display */}
              <div className="rounded-2xl bg-gradient-to-b from-[#F5F5F7] to-[#EBEBEF] p-6 h-64 sm:h-72 flex items-center justify-center">
                <IphoneVisual
                  model={unit.tipe || unit.nama_unit}
                  colorName={selectedColor.name || unit.warna}
                  colorHex={selectedColor.hex || unit.color_hex}
                  imageUrl={unit.image_url}
                  variant="detail"
                  className="h-full w-full"
                />
              </div>

              {/* Interactive Color Swatches from Database */}
              <div className="mt-5 flex flex-col items-center">
                <p className="text-[12px] text-[#6E6E73]">
                  Warna:{" "}
                  <span className="font-semibold text-[#1D1D1F]">
                    {selectedColor.name || unit.warna}
                  </span>
                </p>

                <div className="mt-2.5 flex items-center gap-3">
                  {availableColors.map((col) => {
                    const isSelected =
                      col.name.toLowerCase() ===
                      (selectedColor.name || unit.warna).toLowerCase();
                    return (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => {
                          setSelectedColor(col);
                          if (col.unitId && col.unitId !== unit.id) {
                            router.push(`/katalog/${col.unitId}`);
                          }
                        }}
                        title={col.name}
                        className={`h-8 w-8 rounded-full p-0.5 transition-all ${
                          isSelected
                            ? "ring-2 ring-[#0071E3] ring-offset-2 scale-110"
                            : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        <span
                          className="block h-full w-full rounded-full border border-black/15 shadow-inner"
                          style={{ backgroundColor: col.hex }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Micro Protection Badges */}
                <div className="mt-5 pt-4 border-t border-[#F5F5F7] w-full flex flex-wrap items-center justify-center gap-5 text-[11.5px] font-medium text-[#6E6E73]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[#0071E3]">🛡️</span> AppleCare+ Shield
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[#0071E3]">🔄</span> Reset &amp; Logout
                    iCloud
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Inspeksi Teknis & Spesifikasi (Real Database Fields) */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[15px] font-bold text-[#1D1D1F]">
                  Inspeksi Teknis &amp; Spesifikasi
                </h2>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#0071E3]">
                  100% LOLOS UJI 32 TITIK
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white p-4 border border-[#D2D2D7]/60">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#86868B]">
                    TIPE SERI
                  </p>
                  <p className="mt-1 text-[14px] font-bold text-[#1D1D1F]">
                    {unit.tipe}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6E6E73]">
                    {unit.nama_unit}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-[#D2D2D7]/60">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#86868B]">
                    PENYIMPANAN
                  </p>
                  <p className="mt-1 text-[14px] font-bold text-[#1D1D1F]">
                    {unit.storage}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6E6E73]">
                    Kapasitas Internal NVMe
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-[#D2D2D7]/60">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#86868B]">
                    KONDISI BATERAI
                  </p>
                  <p className="mt-1 text-[14px] font-bold text-[#0071E3]">
                    {unit.battery_health} Peak
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6E6E73]">
                    Terkalibrasi Optimal
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-[#D2D2D7]/60">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#86868B]">
                    WARNA BODI
                  </p>
                  <p className="mt-1 text-[14px] font-bold text-[#1D1D1F]">
                    {unit.warna}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6E6E73]">
                    Original Apple Finish
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-[#D2D2D7]/60">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#86868B]">
                    STATUS UNIT
                  </p>
                  <p className="mt-1 text-[14px] font-bold text-[#1D1D1F] capitalize">
                    {unit.status === "aktif" ? "Siap Sewa" : unit.status}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6E6E73]">
                    Clean &amp; Logout iCloud
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-[#D2D2D7]/60">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#86868B]">
                    LOKASI CABANG
                  </p>
                  <p className="mt-1 text-[14px] font-bold text-[#1D1D1F]">
                    {branchKota}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6E6E73] truncate">
                    {branchName}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Garansi Tukar Unit Langsung */}
            <div className="rounded-2xl bg-white p-5 border border-[#D2D2D7]/60 flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F2FF] text-[#0071E3]">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </div>
              <div>
                <h3 className="text-[13.5px] font-bold text-[#1D1D1F]">
                  Garansi Tukar Unit Langsung
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-[#6E6E73]">
                  Jika terjadi kendala sistem atau kamera sewaktu masa sewa,
                  kami tukar langsung dengan unit setara di seluruh jaringan
                  cabang iRent Aceh tanpa ribet.
                </p>
              </div>
            </div>

            {/* 4. Ringkasan Pemesanan Card */}
            <div className="apple-card rounded-[28px] bg-white p-6 border-2 border-[#0071E3]/20">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F5F5F7]">
                <div>
                  <p className="text-[11px] font-medium text-[#86868B]">
                    Ringkasan Pemesanan
                  </p>
                  <h3 className="text-[17px] font-bold text-[#1D1D1F] mt-0.5">
                    {unit.nama_unit}
                    {activeVariant ? ` (${activeVariant.nama_varian})` : ""}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#0071E3]">
                    TANPA JAMINAN TUNAI
                  </p>
                  <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#1D1D1F]">
                    {effectivePrice
                      ? formatRupiah(effectivePrice)
                      : "Hubungi Kami"}
                  </p>
                </div>
              </div>

              <div className="py-4 space-y-2.5 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6E6E73]">Unit:</span>
                  <span className="font-semibold text-[#1D1D1F]">
                    {unit.nama_unit} {unit.storage} -{" "}
                    {selectedColor.name || unit.warna}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6E6E73]">Cabang Pengambilan:</span>
                  <span className="font-semibold text-[#1D1D1F]">
                    {branchName} ({branchKota})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6E6E73]">Jadwal Pengambilan:</span>
                  <span className="font-semibold text-[#0071E3]">
                    {selectedDateLabel} (09:00 - 22:00 WIB)
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <Link
                  href={liveChatBookingUrl}
                  className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0068D1] py-3.5 px-6 text-[13.5px] font-semibold text-white shadow-md shadow-[#0071E3]/25 transition-all duration-200 hover:scale-[1.01]"
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
                  Sewa Sekarang via Live Chat Concierge
                </Link>

                <a
                  href={`https://wa.me/6281168908888?text=${encodeURIComponent(
                    `Halo iRent Aceh, saya ingin menyewa ${unit.nama_unit} ${unit.storage} (${
                      selectedColor.name || unit.warna
                    }) paket ${
                      activeVariant?.nama_varian || "Harian"
                    } (${
                      effectivePrice ? formatRupiah(effectivePrice) : "-"
                    }) di ${branchName} untuk jadwal ${selectedDateLabel}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F5F5F7] hover:bg-[#E8F2FF] py-2.5 px-5 text-[12px] font-semibold text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
                >
                  Atau Pesan via WhatsApp Concierge ↗
                </a>
              </div>

              <p className="mt-3.5 text-center text-[11px] text-[#86868B]">
                🔒 Data Anda aman &amp; terenkripsi. Konfirmasi reservasi instan
                dalam 5 menit.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* 1. Title & Overview from Database */}
            <div>
              <span className="inline-flex items-center rounded-full bg-[#E8F2FF] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0071E3]">
                {unit.tipe.toUpperCase()} • {unit.storage}
              </span>
              <h1 className="mt-2.5 text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
                {unit.nama_unit}
              </h1>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#6E6E73]">
                {unit.deskripsi ||
                  `Unit resmi ${unit.nama_unit} kapasitas ${unit.storage} warna ${unit.warna} dengan kondisi baterai ${unit.battery_health}. Siap diambil di ${branchName}, ${branchKota}.`}
              </p>
            </div>

            {/* 2. Pilih Durasi Sewa (Directly from price_variants table) */}
            <div>
              <h2 className="text-[14px] font-bold text-[#1D1D1F] mb-3">
                Pilih Durasi Sewa
              </h2>

              {variants.length === 0 ? (
                <div className="rounded-2xl bg-white p-5 border border-[#D2D2D7]/70 text-sm text-[#6E6E73]">
                  Paket harga untuk unit ini belum ditambahkan di database.
                  Silakan hubungi tim Concierge melalui tombol Live Chat untuk
                  informasi tarif sewa.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {variants.map((v, idx) => {
                    const isSelected = idx === selectedVariantIdx;
                    const promoActive = isPromoValid(v);
                    const price = getEffectivePrice(v);

                    return (
                      <button
                        key={v.id || idx}
                        type="button"
                        onClick={() => setSelectedVariantIdx(idx)}
                        className={`relative text-left rounded-2xl p-4.5 transition-all duration-200 ${
                          isSelected
                            ? "bg-white border-2 border-[#0071E3] shadow-[0_8px_28px_rgba(0,113,227,0.14)]"
                            : "bg-white border border-[#D2D2D7]/70 hover:border-[#0071E3]/40"
                        }`}
                      >
                        {v.badge && (
                          <span className="absolute -top-2.5 right-3 rounded-full bg-[#0071E3] px-2.5 py-0.5 text-[9.5px] font-bold text-white shadow-2xs">
                            {v.badge}
                          </span>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-medium text-[#86868B]">
                              {v.promo_description || "Paket Sewa Resmi"}
                            </p>
                            <p className="text-[16px] font-bold text-[#1D1D1F] mt-0.5">
                              {v.nama_varian}
                            </p>
                          </div>

                          <span
                            className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border ${
                              isSelected
                                ? "border-[#0071E3] bg-[#0071E3]"
                                : "border-[#D2D2D7] bg-[#F5F5F7]"
                            }`}
                          >
                            {isSelected && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </span>
                        </div>

                        <div className="mt-4">
                          {promoActive && (
                            <p className="text-[11px] line-through text-[#86868B]">
                              {formatRupiah(v.harga)}
                            </p>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-[18px] font-bold text-[#1D1D1F]">
                              {formatRupiah(price)}
                            </span>
                            <span className="text-[11px] text-[#86868B]">
                              / {v.nama_varian.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Ketersediaan Unit Real-Time (FULL MONTHLY CALENDAR) */}
            <div className="apple-card rounded-[28px] bg-white p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-[15px] font-bold text-[#1D1D1F]">
                    Kalender Ketersediaan Unit
                  </h2>
                  <p className="text-[11.5px] text-[#86868B]">
                    Pilih tanggal pengambilan sewa pada kalender bulanan
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-medium text-[#6E6E73]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#0071E3]"></span>
                    Tersedia
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#D2D2D7]"></span>
                    Tidak Tersedia
                  </span>
                </div>
              </div>

              {/* Month Navigation Header */}
              <div className="flex items-center justify-between rounded-2xl bg-[#F5F5F7] px-3.5 py-2.5 mb-4 border border-[#D2D2D7]/50">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={!canGoPrevMonth}
                  aria-label="Bulan Sebelumnya"
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                    canGoPrevMonth
                      ? "bg-white text-[#1D1D1F] hover:bg-[#0071E3] hover:text-white shadow-2xs"
                      : "text-[#86868B]/40 cursor-not-allowed"
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <div className="text-center">
                  <p className="text-[14px] font-bold tracking-tight text-[#1D1D1F]">
                    {MONTH_NAMES_ID[viewMonth]} {viewYear}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Bulan Berikutnya"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#1D1D1F] hover:bg-[#0071E3] hover:text-white shadow-2xs transition-all"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Quick Date Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {[
                  { label: "Hari Ini", offset: 0 },
                  { label: "Besok", offset: 1 },
                  { label: "3 Hari Lagi", offset: 3 },
                  { label: "Minggu Depan", offset: 7 },
                ].map((shortcut) => {
                  const targetDate = todayKey ? parseDateKey(todayKey) : null;
                  if (targetDate) {
                    targetDate.setDate(targetDate.getDate() + shortcut.offset);
                  }
                  const targetKey = targetDate ? toDateKey(targetDate) : "";
                  const isActive = Boolean(
                    targetKey && selectedDateKey === targetKey
                  );

                  return (
                    <button
                      key={shortcut.label}
                      type="button"
                      onClick={() => selectQuickOffset(shortcut.offset)}
                      className={`rounded-full px-3.5 py-1 text-[11.5px] font-semibold transition-all ${
                        isActive
                          ? "bg-[#0071E3] text-white shadow-2xs"
                          : "bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3]"
                      }`}
                    >
                      {shortcut.label}
                    </button>
                  );
                })}
              </div>

              {/* 7-Day Column Headers */}
              <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
                {DAY_HEADERS.map((dayName) => (
                  <div
                    key={dayName}
                    className="py-1 text-[10.5px] font-bold uppercase tracking-wider text-[#86868B]"
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Full Monthly Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {monthlyCells.map((cell, idx) => {
                  if (!cell.dateKey || cell.dayNumber === null) {
                    return <div key={`empty-${idx}`} className="h-11" />;
                  }

                  const isSelected = cell.dateKey === selectedDateKey;
                  const isDisabled =
                    cell.isPast || cell.status === "reserved";

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (cell.dateKey) setSelectedDateKey(cell.dateKey);
                      }}
                      className={`relative flex flex-col items-center justify-center h-11 rounded-xl text-[13px] font-semibold transition-all ${
                        isSelected
                          ? "bg-[#0071E3] text-white shadow-sm shadow-[#0071E3]/30 scale-[1.03]"
                          : isDisabled
                          ? "bg-[#F5F5F7]/50 text-[#D2D2D7] cursor-not-allowed"
                          : cell.isToday
                          ? "bg-[#E8F2FF] text-[#0071E3] border border-[#0071E3]/40 hover:bg-[#0071E3] hover:text-white"
                          : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8F2FF] hover:text-[#0071E3]"
                      }`}
                    >
                      <span>{cell.dayNumber}</span>
                      <span
                        className={`mt-0.5 h-1 w-1 rounded-full ${
                          isSelected
                            ? "bg-white"
                            : isDisabled
                            ? "bg-transparent"
                            : "bg-[#0071E3]"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Selected Date Footer Info */}
              <div className="mt-4 pt-3.5 border-t border-[#F5F5F7] flex items-center justify-between text-[12px]">
                <span className="text-[#6E6E73]">Tanggal Terpilih:</span>
                <span className="font-bold text-[#0071E3]">
                  {selectedDateLabel}
                </span>
              </div>
            </div>

            {/* 4. Cabang Pengambilan Card (Directly from database branch) */}
            <div className="apple-card rounded-[28px] bg-white p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0071E3] flex items-center gap-1">
                    <span>📍</span> CABANG PENGAMBILAN
                  </p>
                  <h3 className="mt-1 text-[17px] font-bold text-[#1D1D1F]">
                    {branchName}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[#6E6E73]">
                    {branchAlamat} • {branchKota}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[#F5F5F7] px-3 py-1 text-[10.5px] font-semibold text-[#6E6E73]">
                  {branch?.unit_count ?? 1} Unit di Cabang
                </span>
              </div>

              {/* Store Visual Card */}
              <div className="relative rounded-2xl apple-deep-blue-banner h-36 p-4 flex items-end justify-between overflow-hidden">
                <div className="relative z-10 flex items-center gap-2 text-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[13px] font-semibold">
                    iRent {branchName} ({branchKota})
                  </span>
                </div>

                <a
                  href={
                    branch?.google_maps_url ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${branchName} ${branchAlamat} ${branchKota}`
                    )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-[#0071E3] hover:bg-[#E8F2FF] transition-colors shadow-xs"
                >
                  Buka di Google Maps ↗
                </a>
              </div>

              {/* Verification Checklist Row */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#F5F5F7] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0071E3] shadow-2xs">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <circle cx="9" cy="10" r="2" />
                      <path d="M15 8h2M15 12h2M7 16h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12.5px] font-bold text-[#1D1D1F]">
                      Serah Terima Cepat 15 Menit
                    </p>
                    <p className="text-[11px] text-[#6E6E73]">
                      Cukup verifikasi KTP fisik atau KTM Mahasiswa di tempat
                    </p>
                  </div>
                </div>

                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3]">
                  ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DetailUnitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F7] py-16 text-center text-sm text-[#6E6E73]">
          Memuat spesifikasi detail iPhone...
        </div>
      }
    >
      <DetailUnitContent />
    </Suspense>
  );
}
