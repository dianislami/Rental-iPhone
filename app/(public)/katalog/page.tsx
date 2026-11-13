"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialKota = searchParams.get("kota") || "Semua";
  const initialBranchId = searchParams.get("branch") || "";
  const initialModel = searchParams.get("model") || "Semua Model";

  const [units, setUnits] = useState<IphoneUnit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedKota, setSelectedKota] = useState<string>(initialKota);
  const [selectedBranchId, setSelectedBranchId] =
    useState<string>(initialBranchId);
  const [selectedFilter, setSelectedFilter] = useState<string>(initialModel);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popular");

  useEffect(() => {
    const kotaParam = searchParams.get("kota");
    const branchParam = searchParams.get("branch");
    const modelParam = searchParams.get("model");
    if (kotaParam) setSelectedKota(kotaParam);
    if (branchParam !== null) setSelectedBranchId(branchParam);
    if (modelParam) setSelectedFilter(modelParam);
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const [iphonesRes, variantsRes, branchesRes] = await Promise.all([
          fetch("/api/iphones").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/price-variants").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/branches").then((r) => (r.ok ? r.json() : null)),
        ]);

        if (!isMounted) return;

        const rawIphones: IphoneUnit[] = Array.isArray(iphonesRes?.data)
          ? iphonesRes.data
          : [];
        const allVariants: PriceVariant[] = Array.isArray(variantsRes?.data)
          ? variantsRes.data
          : [];
        const rawBranches: Branch[] = Array.isArray(branchesRes?.data)
          ? branchesRes.data
          : [];

        const activeIphones = rawIphones.filter(
          (u) => u.status !== "nonaktif"
        );
        const enrichedUnits = activeIphones.map((u) =>
          enrichIphoneUnit(u, allVariants)
        );
        const enrichedBranches = rawBranches.map((b) =>
          enrichBranchWithUnits(b, activeIphones)
        );

        setUnits(enrichedUnits);
        setBranches(enrichedBranches);
      } catch (err) {
        console.error("Failed to fetch catalog from database:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Derive dynamic series / model filters from real database units
  const filterTabs = useMemo(() => {
    const seriesSet = new Set<string>();
    units.forEach((u) => {
      const match = (u.tipe || u.nama_unit).match(/iPhone\s+\d+/i);
      if (match) {
        seriesSet.add(`${match[0]} Series`);
      } else if (u.tipe) {
        seriesSet.add(u.tipe);
      }
    });

    const dynamicSeries =
      seriesSet.size > 0
        ? Array.from(seriesSet)
        : ["iPhone 16 Series", "iPhone 15 Series", "iPhone 14 Series"];

    return [
      { id: "Semua Model", label: "Semua Model", hasDot: false },
      ...dynamicSeries.map((s) => ({ id: s, label: s, hasDot: false })),
      { id: "Siap Hari Ini", label: "Siap Hari Ini", hasDot: true },
      { id: "Promo Diskon", label: "% Promo Diskon", hasDot: false },
    ];
  }, [units]);

  const filteredUnits = useMemo(() => {
    return units
      .filter((unit) => {
        // Branch ID filter
        if (selectedBranchId) {
          if (unit.branch_id !== selectedBranchId) return false;
        }

        // Branch / Kota filter
        if (selectedKota !== "Semua") {
          const unitKota =
            unit.branches?.kota ||
            branches.find((b) => b.id === unit.branch_id)?.kota ||
            "";
          const unitCabang =
            unit.branches?.nama_cabang ||
            branches.find((b) => b.id === unit.branch_id)?.nama_cabang ||
            "";
          if (
            unitKota.toLowerCase() !== selectedKota.toLowerCase() &&
            unitCabang.toLowerCase() !== selectedKota.toLowerCase()
          ) {
            return false;
          }
        }

        // Category filter
        if (selectedFilter === "Siap Hari Ini") {
          if (unit.status !== "aktif") return false;
        } else if (selectedFilter === "Promo Diskon") {
          const hasPromo =
            (unit.discount_percent && unit.discount_percent > 0) ||
            (unit.highlight_badge &&
              (unit.highlight_badge.toLowerCase().includes("diskon") ||
                unit.highlight_badge.toLowerCase().includes("promo")));
          if (!hasPromo) return false;
        } else if (selectedFilter !== "Semua Model") {
          const baseSeries = selectedFilter
            .replace(/\s*Series$/i, "")
            .toLowerCase();
          const unitTarget = `${unit.tipe} ${unit.nama_unit}`.toLowerCase();
          if (!unitTarget.includes(baseSeries)) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const haystack = `${unit.nama_unit} ${unit.tipe} ${unit.storage} ${
            unit.warna
          } ${unit.deskripsi || ""} ${unit.branches?.nama_cabang || ""} ${
            unit.branches?.kota || ""
          }`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") {
          return (
            (a.price_per_day ?? Number.MAX_SAFE_INTEGER) -
            (b.price_per_day ?? Number.MAX_SAFE_INTEGER)
          );
        }
        if (sortBy === "price_desc") {
          return (b.price_per_day || 0) - (a.price_per_day || 0);
        }
        if (sortBy === "battery") {
          const bhA =
            parseInt((a.battery_health || "").replace(/\D/g, ""), 10) || 0;
          const bhB =
            parseInt((b.battery_health || "").replace(/\D/g, ""), 10) || 0;
          return bhB - bhA;
        }
        return (a.display_order || 0) - (b.display_order || 0);
      });
  }, [
    units,
    branches,
    selectedBranchId,
    selectedKota,
    selectedFilter,
    searchQuery,
    sortBy,
  ]);

  return (
    <div className="flex flex-col">
      {/* TOP HEADER & SEARCH SECTION */}
      <section className="bg-white pt-8 pb-12 border-b border-[#D2D2D7]/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Branch Hub Selector Pill Bar (Directly from database branches) */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-[#F5F5F7] p-1.5 border border-[#D2D2D7]/60">
              <button
                type="button"
                onClick={() => {
                  setSelectedKota("Semua");
                  setSelectedBranchId("");
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 ${
                  selectedKota === "Semua" && !selectedBranchId
                    ? "bg-[#0071E3] text-white shadow-xs"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    selectedKota === "Semua" && !selectedBranchId
                      ? "bg-white"
                      : "bg-[#0071E3]"
                  }`}
                />
                Semua Cabang
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    selectedKota === "Semua" && !selectedBranchId
                      ? "bg-white/20 text-white"
                      : "bg-white text-[#6E6E73]"
                  }`}
                >
                  {units.length} Unit
                </span>
              </button>

              {branches.map((branch) => {
                const active =
                  selectedBranchId === branch.id ||
                  (!selectedBranchId &&
                    selectedKota.toLowerCase() === branch.kota.toLowerCase());
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setSelectedKota("Semua");
                        setSelectedBranchId("");
                      } else {
                        setSelectedKota(branch.kota);
                        setSelectedBranchId(branch.id);
                      }
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 ${
                      active
                        ? "bg-[#0071E3] text-white shadow-xs"
                        : "text-[#6E6E73] hover:text-[#1D1D1F]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-white" : "bg-emerald-500"
                      }`}
                    />
                    {branch.kota || branch.nama_cabang}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-white text-[#6E6E73]"
                      }`}
                    >
                      {branch.unit_count ?? 0} Unit
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-10">
            <span className="inline-flex items-center rounded-full bg-[#E8F2FF] px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-widest text-[#0071E3]">
              ARMADA RESMI GRADE-A
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F]">
              Pilih iPhone Anda.
            </h1>
            <p className="text-[14.5px] text-[#6E6E73]">
              Baterai terkalibrasi, dan serah terima instan tanpa ribet di
              seluruh hub Aceh.
            </p>
          </div>

          {/* Search & Filter Container */}
          <div className="rounded-3xl bg-[#F5F5F7] p-4 sm:p-5 border border-[#D2D2D7]/60 space-y-3.5">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari model iPhone, kapasitas, warna..."
                  className="w-full rounded-2xl bg-white pl-11 pr-4 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/15 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#86868B] hover:text-[#1D1D1F]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="sm:w-56">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Urutkan katalog"
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[13px] font-medium text-[#1D1D1F] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/15 transition-all"
                >
                  <option value="popular">Urutkan: Terpopuler</option>
                  <option value="price_asc">Harga: Terendah</option>
                  <option value="price_desc">Harga: Tertinggi</option>
                  <option value="battery">Battery Health Tertinggi</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {filterTabs.map((tab) => {
                const active = selectedFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedFilter(tab.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 ${
                      active
                        ? "bg-[#0071E3] text-white shadow-xs"
                        : "bg-white text-[#1D1D1F] hover:bg-[#E8F2FF] hover:text-[#0071E3] border border-[#D2D2D7]/60"
                    }`}
                  >
                    {tab.hasDot && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          active ? "bg-white" : "bg-emerald-500"
                        }`}
                      />
                    )}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG GRID & BANNERS */}
      <section className="bg-[#F5F5F7] py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="apple-card rounded-[28px] bg-white p-5 h-[420px] animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="h-5 w-32 rounded-full bg-[#F5F5F7]" />
                    <div className="h-52 w-full rounded-2xl bg-[#F5F5F7]" />
                    <div className="h-5 w-48 rounded-lg bg-[#F5F5F7]" />
                    <div className="h-4 w-36 rounded-lg bg-[#F5F5F7]" />
                  </div>
                  <div className="h-10 w-full rounded-full bg-[#F5F5F7]" />
                </div>
              ))}
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="apple-card rounded-3xl bg-white p-12 text-center">
              <p className="text-lg font-bold text-[#1D1D1F]">
                {units.length === 0
                  ? "Belum ada unit iPhone di database"
                  : "Unit tidak ditemukan"}
              </p>
              <p className="mt-1 text-sm text-[#6E6E73]">
                {units.length === 0
                  ? "Data katalog unit iPhone akan otomatis tampil begitu ditambahkan ke tabel iphones di database."
                  : "Coba ubah kata kunci pencarian atau pilih filter cabang lainnya."}
              </p>
              {units.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKota("Semua");
                    setSelectedBranchId("");
                    setSelectedFilter("Semua Model");
                    setSearchQuery("");
                  }}
                  className="mt-5 inline-flex items-center rounded-full bg-[#0071E3] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0077ED]"
                >
                  Reset Filter Katalog
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUnits.map((unit) => {
                const isAvailable = unit.status === "aktif";
                const hubCity =
                  unit.branches?.kota ||
                  unit.branches?.nama_cabang ||
                  branches.find((b) => b.id === unit.branch_id)?.kota ||
                  "Aceh";

                return (
                  <div
                    key={unit.id}
                    className="group apple-card flex flex-col justify-between rounded-[28px] bg-white p-5"
                  >
                    <div>
                      {/* Top Status & Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1D1D1F]">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isAvailable ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            {unit.availability_label || "TERSEDIA"}
                          </span>

                          {unit.highlight_badge && (
                            <span className="inline-flex items-center rounded-full bg-[#0071E3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                              {unit.highlight_badge}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-medium text-[#86868B] shrink-0">
                          Hub {hubCity}
                        </span>
                      </div>

                      {/* Studio Image Container */}
                      <div className="relative mb-4 flex h-52 items-center justify-center rounded-2xl bg-[#F5F5F7] p-4 overflow-hidden">
                        <IphoneVisual
                          model={unit.tipe || unit.nama_unit}
                          colorName={unit.warna}
                          colorHex={unit.color_hex}
                          imageUrl={unit.image_url}
                          variant="card"
                          className="h-full w-full"
                        />

                        {/* Floating Color Pill */}
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-[#1D1D1F] shadow-2xs border border-black/5">
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-black/15"
                            style={{
                              backgroundColor: unit.color_hex || "#9A968E",
                            }}
                          />
                          {unit.warna}
                        </div>
                      </div>

                      {/* Title & Technical Spec Chips */}
                      <h2 className="text-[19px] font-bold tracking-tight text-[#1D1D1F]">
                        {unit.nama_unit}
                      </h2>

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F]">
                          {unit.storage}
                        </span>
                        <span className="rounded-md bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-medium text-[#6E6E73]">
                          🔋 Baterai {unit.battery_health}
                        </span>
                        <span className="rounded-md bg-[#E8F2FF] px-2.5 py-1 text-[11px] font-medium text-[#0071E3]">
                          {unit.tipe}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Price & Detail CTA */}
                    <div className="mt-6 pt-4 border-t border-[#F5F5F7] flex items-end justify-between gap-3">
                      <div>
                        {unit.original_price_per_day &&
                        unit.price_per_day &&
                        unit.original_price_per_day > unit.price_per_day ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="line-through text-[#86868B]">
                              {formatRupiah(unit.original_price_per_day)}
                            </span>
                            <span className="font-bold text-[#0071E3]">
                              -{unit.discount_percent}%
                            </span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#86868B]">
                            Mulai dari
                          </p>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-[19px] font-bold tracking-tight text-[#1D1D1F]">
                            {unit.price_per_day
                              ? formatRupiah(unit.price_per_day)
                              : "Hubungi Kami"}
                          </span>
                          {unit.price_per_day && (
                            <span className="text-[11px] text-[#86868B]">
                              / hari
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/katalog/${unit.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2.5 text-[12px] font-semibold text-white shadow-xs transition-all duration-200 hover:scale-[1.03]"
                      >
                        Detail
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* APPLECARE+ SHIELD PROTECTION BANNER */}
          <div className="mt-12 rounded-[28px] apple-deep-blue-banner p-7 sm:p-9 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-white border border-white/20">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-widest text-sky-300">
                  PERLINDUNGAN MENYELURUH
                </p>
                <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Perlindungan iRent AppleCare+ Termasuk
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">
                  Bebas cemas dari lecet operasional, retak layar minor, dan
                  kendala fungsi tanpa kewajiban penahanan uang deposit tunai
                  yang memberatkan.
                </p>
              </div>
            </div>

            <Link
              href="/tentang-kami#proteksi"
              className="shrink-0 inline-flex items-center justify-center rounded-full bg-white hover:bg-[#E8F2FF] px-5 py-3 text-[12.5px] font-semibold text-[#0071E3] transition-colors"
            >
              Pelajari Syarat Proteksi
            </Link>
          </div>

          {/* BUSINESS & PRODUCTION LEASE CARD */}
          <div className="mt-6 rounded-[28px] bg-white border border-[#D2D2D7]/70 p-7 sm:p-9 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xs">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#0071E3] flex items-center gap-1.5">
                <span>💼</span> BUSINESS &amp; PRODUCTION LEASE
              </p>
              <h3 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Butuh sewa jangka panjang (&gt;14 hari)?
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#6E6E73]">
                Ideal untuk kebutuhan shooting sinematik, dokumentasi wedding
                organizer, liputan festival PON, atau event kantor. Nikmati
                potongan tarif hingga 35% dan unit cadangan on-site.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center -space-x-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] border-2 border-white text-[10px] font-bold text-[#1D1D1F]">
                  4K
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F2FF] border-2 border-white text-[10px] font-bold text-[#0071E3]">
                  LOG
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] border-2 border-white text-[10px] font-bold text-[#6E6E73]">
                  +14
                </span>
              </div>

              <Link
                href="/live-chat"
                className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-6 py-3 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all"
              >
                <span>💬</span>
                Konsultasikan Paket Khusus
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function KatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F7] py-16 text-center text-sm text-[#6E6E73]">
          Memuat katalog armada iRent Aceh...
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
