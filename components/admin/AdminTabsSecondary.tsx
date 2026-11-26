"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IphoneVisual } from "@/components/public/IphoneVisual";
import { AdminDropdown } from "@/components/ui/AdminDropdown";
import {
  BatteryIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CameraIcon,
  ClipboardListIcon,
  DownloadIcon,
  EditIcon,
  EyeIcon,
  FileSpreadsheetIcon,
  LogOutIcon,
  MailIcon,
  MapPinIcon,
  PlusIcon,
  ReceiptIcon,
  RefreshCwIcon,
  SmartphoneIcon,
  StarIcon,
  StoreIcon,
  TargetIcon,
  TrashIcon,
  TrendingUpIcon,
  UserIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import { formatRupiah, getColorHex } from "@/lib/public-data";
import {
  AdminChatConversation,
  AdminChatMessage,
  AdminProfile,
  Branch,
  CustomerSurveyRecord,
  ExpenseRecord,
  formatShortDateId,
  getInitials,
  IphoneUnit,
  RentalTransaction,
} from "@/lib/admin-types";

// ======================================================
// TAB 3: KATALOG PERANGKAT (Reference Image 7)
// ======================================================
interface AdminKatalogTabProps {
  branches: Branch[];
  iphones: IphoneUnit[];
  onRefresh: () => void;
  onSelectUnit: (unit: IphoneUnit) => void;
}

export function AdminKatalogTab({
  branches,
  iphones,
  onRefresh,
  onSelectUnit,
}: AdminKatalogTabProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [selectedFilter, setSelectedFilter] = useState<string>("Semua Model");
  const [search, setSearch] = useState<string>("");

  const filterTabs = ["Tersedia Hari Ini", "Promo Diskon"];

  const filteredUnits = useMemo(() => {
    return iphones.filter((u) => {
      if (u.status === "nonaktif") return false;
      if (selectedBranchId !== "all" && u.branch_id !== selectedBranchId) {
        return false;
      }
      if (selectedFilter === "Tersedia Hari Ini") {
        if (u.status !== "aktif") return false;
      } else if (selectedFilter === "Promo Diskon") {
        const hasPromo =
          (u.discount_percent && u.discount_percent > 0) ||
          (u.highlight_badge &&
            (u.highlight_badge.toLowerCase().includes("diskon") ||
              u.highlight_badge.toLowerCase().includes("promo")));
        if (!hasPromo) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${u.nama_unit} ${u.tipe} ${u.storage} ${u.warna}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [iphones, selectedBranchId, selectedFilter, search]);

  return (
    <div className="space-y-6">
      {/* Top Preview Mode Notice Banner */}
      <div className="rounded-2xl bg-white border border-[#D2D2D7]/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 text-[12.5px]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3]">
            <EyeIcon className="h-3.5 w-3.5" />
          </span>
          <div>
            <span className="font-bold text-[#1D1D1F]">
              Mode Pratinjau Publik (Read-Only)
            </span>
            <span className="mx-2 text-[#D2D2D7]">•</span>
            <span className="text-[#6E6E73]">
              Tampilan ini identik 100% dengan yang dilihat oleh calon penyewa
              di website utama
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            title="Sinkronkan ulang"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F2FF] hover:bg-[#0071E3] text-[#0071E3] hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Branch Hub Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
          Katalog Perangkat
        </h1>

        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-white p-1.5 border border-[#D2D2D7]/60">
          <button
            type="button"
            onClick={() => setSelectedBranchId("all")}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all cursor-pointer ${
              selectedBranchId === "all"
                ? "bg-[#0071E3] text-white shadow-2xs"
                : "text-[#6E6E73] hover:text-[#1D1D1F]"
            }`}
          >
            Semua Cabang
          </button>

          {branches.map((b) => {
            const active = selectedBranchId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() =>
                  setSelectedBranchId(active ? "all" : b.id)
                }
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-[#0071E3] text-white shadow-2xs"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {b.kota || b.nama_cabang}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Container (Matches Public Catalog: Tersedia Hari Ini & Promo Diskon) */}
      <div className="rounded-3xl bg-white p-4 border border-[#D2D2D7]/60 space-y-3 shadow-2xs">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]"
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari model iPhone, kapasitas, warna..."
            className="w-full rounded-2xl bg-[#F5F5F7] pl-10 pr-4 py-2.5 text-[12.5px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => {
            const active = selectedFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() =>
                  setSelectedFilter(active ? "Semua Model" : tab)
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-[#0071E3] text-white shadow-xs"
                    : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8F2FF] hover:text-[#0071E3]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Column Device Cards Grid */}
      {filteredUnits.length === 0 ? (
        <div className="apple-card rounded-3xl bg-white p-12 text-center">
          <p className="text-[15px] font-bold text-[#1D1D1F]">
            Tidak ada perangkat yang cocok dengan filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              className="apple-card flex flex-col justify-between rounded-[28px] bg-white p-5"
            >
              <div>
                {/* Top Badge & Battery */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      unit.highlight_badge
                        ? "bg-[#0071E3] text-white"
                        : "bg-[#F5F5F7] text-[#6E6E73]"
                    }`}
                  >
                    {unit.highlight_badge}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#1D1D1F]">
                    <BatteryIcon className="h-3.5 w-3.5 text-[#0071E3]" />
                    <span>{unit.battery_health}</span>
                  </span>
                </div>

                {/* Title & Color subtitle */}
                <h3 className="text-[18px] font-bold text-[#1D1D1F]">
                  {unit.nama_unit}
                </h3>
                <p className="text-[11.5px] text-[#86868B]">
                  {unit.warna} • {unit.branches?.kota || "Aceh"}
                </p>

                {/* Visual */}
                <div className="my-4 flex h-44 items-center justify-center rounded-2xl bg-[#F5F5F7] p-4">
                  <IphoneVisual
                    model={unit.tipe || unit.nama_unit}
                    colorName={unit.warna}
                    colorHex={unit.color_hex}
                    imageUrl={unit.image_url}
                    variant="card"
                    className="h-full w-full"
                  />
                </div>

                {/* Spec Chips */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-lg bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-bold text-[#1D1D1F]">
                      {unit.storage}
                    </span>
                    <span className="rounded-lg bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-medium text-[#6E6E73]">
                      {unit.tipe}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {unit.status === "aktif" ? "Unit Siap" : unit.status}
                  </span>
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-5 pt-3.5 border-t border-[#F5F5F7] flex items-end justify-between gap-3">
                <div>
                  {unit.original_price_per_day &&
                  unit.price_per_day &&
                  unit.original_price_per_day > unit.price_per_day ? (
                    <p className="text-[10.5px] line-through text-[#86868B]">
                      {formatRupiah(unit.original_price_per_day)}
                    </p>
                  ) : (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                      TARIF SEWA
                    </p>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-[18px] font-bold text-[#1D1D1F]">
                      {unit.price_per_day
                        ? formatRupiah(unit.price_per_day)
                        : "Belum Diatur"}
                    </span>
                    {unit.price_per_day && (
                      <span className="text-[11px] text-[#86868B]">/ hari</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectUnit(unit)}
                  className="rounded-full bg-[#F5F5F7] hover:bg-[#0071E3] px-4 py-2 text-[12px] font-semibold text-[#1D1D1F] hover:text-white transition-colors"
                >
                  Detail →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ======================================================
// TAB 5: ARUS KAS & LAPORAN KEUANGAN (Reference Image 8)
// ======================================================
interface AdminKeuanganTabProps {
  branches: Branch[];
  rentals: RentalTransaction[];
  expenses: ExpenseRecord[];
  onAddExpense: () => void;
  onEditExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (expenseId: string) => void;
}

interface CashflowEntry {
  id: string;
  dateStr: string;
  timestamp: number;
  branchId: string;
  branchName: string;
  title: string;
  subtitle: string;
  type: "income" | "expense";
  amount: number;
  rawExpense?: ExpenseRecord;
}

export function AdminKeuanganTab({
  branches,
  rentals,
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: AdminKeuanganTabProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;

  // Build available months from rentals & expenses
  const availableMonths = useMemo(() => {
    const mSet = new Set<string>();
    rentals.forEach((r) => {
      if (r.tanggal_pengambilan) mSet.add(r.tanggal_pengambilan.slice(0, 7));
    });
    expenses.forEach((e) => {
      if (e.tanggal) mSet.add(e.tanggal.slice(0, 7));
    });
    return Array.from(mSet).sort().reverse();
  }, [rentals, expenses]);

  // Build unified cashflow entries
  const { entriesWithBalance, totalIncome, totalExpense } = useMemo(() => {
    const list: CashflowEntry[] = [];

    // 1. Income from non-cancelled rentals
    rentals
      .filter((r) => r.status_sewa !== "dibatalkan")
      .forEach((r) => {
        const incomeVal =
          r.status_pembayaran === "lunas"
            ? Number(r.total_bayar) || 0
            : Number(r.dp) || Number(r.total_bayar) || 0;
        if (incomeVal <= 0) return;

        const dStr = r.tanggal_pengambilan || r.created_at.slice(0, 10);
        if (selectedBranchId !== "all" && r.branch_id !== selectedBranchId)
          return;
        if (selectedMonth !== "all" && !dStr.startsWith(selectedMonth)) return;

        const bKota =
          r.branches?.kota ||
          branches.find((b) => b.id === r.branch_id)?.kota ||
          "Aceh";

        list.push({
          id: `inc-${r.id}`,
          dateStr: dStr,
          timestamp: new Date(r.created_at || `${dStr}T12:00:00`).getTime(),
          branchId: r.branch_id,
          branchName: bKota,
          title: `Sewa ${r.iphones?.nama_unit || "Unit iPhone"} ${
            r.iphones?.storage || ""
          }`.trim(),
          subtitle: `Penyewa: ${r.customers?.nama || "-"} • Paket: ${
            r.price_variants?.nama_varian || "Harian"
          }`,
          type: "income",
          amount: incomeVal,
        });
      });

    // 2. Expenses from expenses table
    expenses.forEach((e) => {
      const dStr = e.tanggal || e.created_at.slice(0, 10);
      if (selectedBranchId !== "all" && e.branch_id !== selectedBranchId)
        return;
      if (selectedMonth !== "all" && !dStr.startsWith(selectedMonth)) return;

      const bKota =
        e.branches?.kota ||
        branches.find((b) => b.id === e.branch_id)?.kota ||
        "Aceh";

      list.push({
        id: `exp-${e.id}`,
        dateStr: dStr,
        timestamp: new Date(e.created_at || `${dStr}T12:00:00`).getTime(),
        branchId: e.branch_id,
        branchName: bKota,
        title: e.keterangan || "Pengeluaran Operasional Cabang",
        subtitle: `Input Manual Kasir / Spv • ${bKota}`,
        type: "expense",
        amount: Number(e.nominal) || 0,
        rawExpense: e,
      });
    });

    // Sort oldest to newest first to compute running balance (Saldo Akumulasi)
    list.sort((a, b) => a.timestamp - b.timestamp);

    let runningBalance = 0;
    let incSum = 0;
    let expSum = 0;

    const withBal = list.map((item) => {
      if (item.type === "income") {
        runningBalance += item.amount;
        incSum += item.amount;
      } else {
        runningBalance -= item.amount;
        expSum += item.amount;
      }
      return {
        ...item,
        runningBalance,
      };
    });

    // Reverse so newest is on top
    withBal.reverse();

    return {
      entriesWithBalance: withBal,
      totalIncome: incSum,
      totalExpense: expSum,
    };
  }, [rentals, expenses, branches, selectedBranchId, selectedMonth]);

  const filteredEntries = useMemo(() => {
    if (filterType === "all") return entriesWithBalance;
    return entriesWithBalance.filter((e) => e.type === filterType);
  }, [entriesWithBalance, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const paginatedEntries = filteredEntries.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const netCashflow = totalIncome - totalExpense;
  const expenseRatio =
    totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : "0.0";

  function handleExportCsv(onlySelectedBranch: boolean) {
    const rows = [
      [
        "Tanggal",
        "Cabang",
        "Tipe",
        "Deskripsi",
        "Keterangan",
        "Pemasukan (IDR)",
        "Pengeluaran (IDR)",
        "Saldo Akumulasi (IDR)",
      ],
    ];

    const source = onlySelectedBranch ? filteredEntries : entriesWithBalance;
    source.forEach((item) => {
      rows.push([
        item.dateStr,
        item.branchName,
        item.type === "income" ? "AUTO (Sewa)" : "MANUAL (Expense)",
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.subtitle.replace(/"/g, '""')}"`,
        item.type === "income" ? String(item.amount) : "0",
        item.type === "expense" ? String(item.amount) : "0",
        String(item.runningBalance),
      ]);
    });

    const csvContent =
      "\uFEFF" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan-Keuangan-iRent-${
      onlySelectedBranch && selectedBranchId !== "all"
        ? selectedBranchId.slice(0, 6)
        : "Konsolidasi"
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
            Arus Kas &amp; Laporan Keuangan
          </h1>
        </div>

        <button
          type="button"
          onClick={onAddExpense}
          className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all cursor-pointer"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>Input Pengeluaran</span>
        </button>
      </div>

      {/* 3 Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Pemasukan */}
        <div className="apple-card rounded-3xl bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[16px] font-bold uppercase tracking-widest text-[#0071E3]">
                  TOTAL PEMASUKAN
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3]">
                <TrendingUpIcon className="h-4.5 w-4.5" />
              </span>
            </div>

            <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
              +{formatRupiah(totalIncome)}
            </p>
          </div>

          <div className="mt-4 h-1.5 w-full rounded-full bg-[#F5F5F7] overflow-hidden">
            <div className="h-full w-4/5 rounded-full bg-[#0071E3]" />
          </div>
        </div>

        {/* Card 2: Pengeluaran */}
        <div className="apple-card rounded-3xl bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[16px] font-bold uppercase tracking-widest text-[#0071E3]">
                  TOTAL PENGELUARAN
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3]">
                <ReceiptIcon className="h-4.5 w-4.5" />
              </span>
            </div>

            <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
              -{formatRupiah(totalExpense)}
            </p>
          </div>

          <div className="mt-4 h-1.5 w-full rounded-full bg-[#F5F5F7] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0071E3]"
              style={{
                width: `${Math.min(100, Number(expenseRatio) || 15)}%`,
              }}
            />
          </div>
        </div>

        {/* Card 3: Saldo Bersih */}
        <div className="rounded-3xl apple-deep-blue-banner p-6 text-white flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[16px] font-bold uppercase tracking-widest text-sky-300">
                  SALDO BERSIH (NET CASHFLOW)
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3]">
                <WalletIcon className="h-4.5 w-4.5" />
              </span>
            </div>

            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              {formatRupiah(netCashflow)}
            </p>
            <p className="mt-1 text-[11px] text-white/75">
              Kas riil setelah dikurangi biaya operasional cabang
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11.5px]">
            <span className="text-white/80">Rasio Efisiensi Beban</span>
            <span className="font-bold text-sky-300">{expenseRatio}%</span>
          </div>
        </div>
      </div>

      {/* Filter & Export Controls Card */}
      <div className="apple-card rounded-3xl bg-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminDropdown
              variant="pill"
              value={selectedBranchId}
              icon={<StoreIcon className="h-3.5 w-3.5" />}
              onChange={(val) => {
                setSelectedBranchId(val);
                setPage(1);
              }}
              options={[
                { value: "all", label: "Semua Cabang" },
                ...branches.map((b) => ({
                  value: b.id,
                  label: b.nama_cabang,
                })),
              ]}
            />

            <AdminDropdown
              variant="pill"
              value={selectedMonth}
              icon={<CalendarIcon className="h-3.5 w-3.5" />}
              onChange={(val) => {
                setSelectedMonth(val);
                setPage(1);
              }}
              options={[
                { value: "all", label: "Semua Periode" },
                ...availableMonths.map((m) => ({
                  value: m,
                  label: `Periode ${m}`,
                })),
              ]}
            />
          </div>

          {/* Type Sub-Tabs */}
          <div className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] p-1">
            {(
              [
                { id: "all", label: "Semua" },
                { id: "income", label: "Pemasukan Saja" },
                { id: "expense", label: "Pengeluaran Saja" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setFilterType(t.id);
                  setPage(1);
                }}
                className={`rounded-full px-3.5 py-1 text-[11.5px] font-semibold transition-all ${
                  filterType === t.id
                    ? "bg-white text-[#0071E3] shadow-2xs"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Excel / CSV Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleExportCsv(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#F5F5F7] hover:bg-[#E8F2FF] px-4 py-2.5 text-[12px] font-semibold text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
          >
            <FileSpreadsheetIcon className="h-4 w-4 text-[#0071E3]" />
            <span>Export Excel by Branch</span>
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv(false)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#F5F5F7] hover:bg-[#E8F2FF] px-4 py-2.5 text-[12px] font-semibold text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
          >
            <DownloadIcon className="h-4 w-4 text-[#0071E3]" />
            <span>Export All Excel</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="apple-card rounded-3xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F5F5F7] text-[10.5px] font-bold uppercase tracking-wider text-[#86868B]">
                <th className="py-4 px-5">Tanggal &amp; Waktu</th>
                <th className="py-4 px-4">Cabang Outlet</th>
                <th className="py-4 px-4">Deskripsi Transaksi</th>
                <th className="py-4 px-4 text-right">Pemasukan (Income)</th>
                <th className="py-4 px-4 text-right">Pengeluaran (Expense)</th>
                <th className="py-4 px-5 text-right">Saldo Akumulasi</th>
                <th className="py-4 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F7] text-[12.5px]">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-[#86868B]"
                  >
                    Belum ada catatan arus kas pada filter ini.
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F5F5F7]/50 transition-colors"
                  >
                    <td className="py-4 px-5 whitespace-nowrap">
                      <p className="font-semibold text-[#1D1D1F]">
                        {formatShortDateId(item.dateStr)}
                      </p>
                      <p className="text-[11px] text-[#86868B]">
                        {item.type === "income" ? "Sistem Sewa" : "Jurnal Kas"}
                      </p>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-3 py-1 text-[11px] font-semibold text-[#1D1D1F]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]" />
                        {item.branchName}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#1D1D1F]">{item.title}</p>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase ${
                            item.type === "income"
                              ? "bg-[#E8F2FF] text-[#0071E3]"
                              : "bg-[#F5F5F7] text-[#6E6E73]"
                          }`}
                        >
                          {item.type === "income" ? "AUTO" : "MANUAL"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#86868B] mt-0.5">
                        {item.subtitle}
                      </p>
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {item.type === "income"
                        ? `+${formatRupiah(item.amount)}`
                        : "—"}
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-[#1D1D1F] whitespace-nowrap">
                      {item.type === "expense"
                        ? `-${formatRupiah(item.amount)}`
                        : "—"}
                    </td>

                    <td className="py-4 px-5 text-right font-semibold text-[#1D1D1F] whitespace-nowrap">
                      {formatRupiah(item.runningBalance)}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {item.rawExpense ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditExpense(item.rawExpense!)}
                            title="Edit Pengeluaran"
                            className="inline-flex items-center justify-center rounded-lg bg-[#E8F2FF] hover:bg-[#0071E3] p-1.5 text-[#0071E3] hover:text-white transition-colors cursor-pointer"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(item.rawExpense!.id)}
                            title="Hapus Pengeluaran"
                            className="inline-flex items-center justify-center rounded-lg bg-[#E8F2FF] hover:bg-red-500 p-1.5 text-[#0071E3] hover:text-white transition-colors cursor-pointer"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#86868B]">Auto</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-4 border-t border-[#F5F5F7] flex items-center justify-between text-[12px] text-[#6E6E73]">
          <span>
            Menampilkan{" "}
            <strong className="text-[#1D1D1F]">
              {paginatedEntries.length}
            </strong>{" "}
            dari{" "}
            <strong className="text-[#1D1D1F]">{filteredEntries.length}</strong>{" "}
            catatan transaksi
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg bg-[#F5F5F7] px-3 py-1 text-[11.5px] font-semibold text-[#1D1D1F] disabled:opacity-40"
            >
              ‹
            </button>
            <span className="rounded-lg bg-[#0071E3] px-3 py-1 text-[11.5px] font-bold text-white">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg bg-[#F5F5F7] px-3 py-1 text-[11.5px] font-semibold text-[#1D1D1F] disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// TAB 6: LIVE CHAT & SURVEI PENGUNJUNG (Database Chat & Surveys)
// ======================================================
interface AdminLiveChatTabProps {
  onCreateRentalFromChat?: (conversationId: string) => void;
}

const CATALOG_TAG_REGEX =
  /^\[KATALOG_PRODUK\]([\s\S]*?)\[\/KATALOG_PRODUK\]\n?([\s\S]*)$/;

export function AdminLiveChatTab(_props: AdminLiveChatTabProps) {
  const [conversations, setConversations] = useState<AdminChatConversation[]>(
    []
  );
  const [surveys, setSurveys] = useState<CustomerSurveyRecord[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all"
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversationsAndSurveys = useCallback(async () => {
    try {
      const [convRes, surveyRes] = await Promise.all([
        fetch("/api/chat-conversations").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/customer-surveys").then((r) => (r.ok ? r.json() : null)),
      ]);

      if (convRes?.success && Array.isArray(convRes.data)) {
        setConversations(convRes.data);
        if (!selectedConvId && convRes.data.length > 0) {
          setSelectedConvId(convRes.data[0].id);
        }
      }
      if (surveyRes?.success && Array.isArray(surveyRes.data)) {
        setSurveys(surveyRes.data);
      }
    } catch {
      // Ignore network errors
    }
  }, [selectedConvId]);

  const loadConversationMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/chat-conversations/${convId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.messages)) {
        const msgs: AdminChatMessage[] = json.data.messages;
        setMessages(msgs);

        // Mark unread visitor messages as read
        const unreadVisitorMsgs = msgs.filter(
          (m) => m.sender_type === "visitor" && !m.is_read
        );
        for (const um of unreadVisitorMsgs) {
          fetch(`/api/chat-messages/${um.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_read: true }),
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadConversationsAndSurveys();
  }, [loadConversationsAndSurveys]);

  useEffect(() => {
    if (!selectedConvId) return;
    loadConversationMessages(selectedConvId);

    const supabase = createClient();
    const channel = supabase
      .channel(`admin-chat-${selectedConvId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${selectedConvId}`,
        },
        () => {
          loadConversationMessages(selectedConvId);
          loadConversationsAndSurveys();
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      loadConversationMessages(selectedConvId);
    }, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [selectedConvId, loadConversationMessages, loadConversationsAndSurveys]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const selectedSurvey = surveys.find(
    (s) => s.conversation_id === selectedConvId
  );

  const filteredConversations = conversations.filter((c) =>
    statusFilter === "all" ? true : c.status === statusFilter
  );

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConvId || !replyText.trim() || sending) return;

    setSending(true);
    const text = replyText.trim();
    setReplyText("");

    try {
      const res = await fetch("/api/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: selectedConvId,
          message: text,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setMessages((prev) => [...prev, json.data]);
        loadConversationsAndSurveys();
      } else {
        setReplyText(text);
      }
    } catch {
      setReplyText(text);
    } finally {
      setSending(false);
    }
  }

  async function handleToggleConversationStatus(conv: AdminChatConversation) {
    const nextStatus = conv.status === "open" ? "closed" : "open";
    try {
      const res = await fetch(`/api/chat-conversations/${conv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadConversationsAndSurveys();
      }
    } catch {
      // Ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
            Live Chat Concierge &amp; Survei Pengunjung
          </h1>
        </div>

        <button
          type="button"
          onClick={loadConversationsAndSurveys}
          className="self-start inline-flex items-center gap-2 rounded-full bg-[#E8F2FF] hover:bg-[#0071E3] px-4 py-2 text-[12px] font-semibold text-[#0071E3] hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCwIcon className="h-3.5 w-3.5" />
          <span>Muat Ulang Inbox</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Inbox List (4 cols) */}
        <div className="lg:col-span-4 apple-card rounded-3xl bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F5F5F7]">
            <span className="text-[12.5px] font-bold text-[#1D1D1F]">
              Daftar Percakapan ({filteredConversations.length})
            </span>
            <div className="flex items-center gap-1 rounded-full bg-[#F5F5F7] p-0.5">
              {(["all", "open", "closed"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold capitalize ${
                    statusFilter === st
                      ? "bg-[#0071E3] text-white"
                      : "text-[#6E6E73]"
                  }`}
                >
                  {st === "all" ? "Semua" : st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[540px] overflow-y-auto custom-scrollbar pr-1">
            {filteredConversations.length === 0 ? (
              <p className="py-10 text-center text-[12.5px] text-[#86868B]">
                Belum ada percakapan masuk.
              </p>
            ) : (
              filteredConversations.map((c) => {
                const sv = surveys.find((s) => s.conversation_id === c.id);
                const active = selectedConvId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedConvId(c.id)}
                    className={`w-full text-left rounded-2xl p-3.5 transition-all border ${
                      active
                        ? "border-[#0071E3] bg-[#E8F2FF]/50 shadow-2xs"
                        : "border-transparent bg-[#F5F5F7]/70 hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-bold text-[#1D1D1F]">
                        {sv ? `${sv.pekerjaan} (${sv.domisili})` : `Visitor #${c.id.slice(0, 6)}`}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase ${
                          c.status === "open"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#6E6E73] truncate">
                      {sv
                        ? `${sv.tujuan_penyewaan} • Usia ${sv.rentang_usia}`
                        : "Belum mengisi survei"}
                    </p>
                    <p className="mt-1 text-[10px] text-[#86868B]">
                      ID: #{c.id.slice(0, 8)} • {formatShortDateId(c.created_at)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Window & Survey Info (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedConv ? (
            <div className="apple-card rounded-3xl bg-white p-12 text-center text-[13px] text-[#86868B]">
              Pilih salah satu percakapan di sebelah kiri untuk membuka pesan dan hasil survei pengunjung.
            </div>
          ) : (
            <>
              {/* Visitor Survey Card */}
              {selectedSurvey && (
                <div className="apple-card rounded-3xl bg-white p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F2FF] px-3 py-1 text-[10.5px] font-bold text-[#0071E3]">
                        <ClipboardListIcon className="h-3.5 w-3.5" />
                        <span>DATA SURVEI PENGUNJUNG</span>
                      </span>
                      <span className="text-[12px] font-semibold text-[#1D1D1F]">
                        {selectedSurvey.jenis_kelamin} •{" "}
                        {selectedSurvey.rentang_usia}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleConversationStatus(selectedConv)
                        }
                        className="rounded-full bg-[#F5F5F7] hover:bg-red-50 px-3.5 py-1.5 text-[11px] font-semibold text-[#6E6E73] hover:text-red-600 transition-colors cursor-pointer"
                      >
                        {selectedConv.status === "open"
                          ? "Tutup Sesi"
                          : "Buka Kembali"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11.5px]">
                    <div className="rounded-xl bg-[#F5F5F7] p-2.5">
                      <p className="text-[9.5px] font-bold uppercase text-[#86868B]">
                        DOMISILI
                      </p>
                      <p className="inline-flex items-center gap-1.5 font-bold text-[#1D1D1F] mt-0.5">
                        <MapPinIcon className="h-3.5 w-3.5 text-[#0071E3]" />
                        <span>{selectedSurvey.domisili}</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#F5F5F7] p-2.5">
                      <p className="text-[9.5px] font-bold uppercase text-[#86868B]">
                        PEKERJAAN
                      </p>
                      <p className="inline-flex items-center gap-1.5 font-bold text-[#1D1D1F] mt-0.5">
                        <BriefcaseIcon className="h-3.5 w-3.5 text-[#0071E3]" />
                        <span>{selectedSurvey.pekerjaan}</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#F5F5F7] p-2.5">
                      <p className="text-[9.5px] font-bold uppercase text-[#86868B]">
                        PENGALAMAN
                      </p>
                      <p className="inline-flex items-center gap-1.5 font-bold text-[#1D1D1F] mt-0.5">
                        <StarIcon className="h-3.5 w-3.5 text-[#0071E3]" />
                        <span>{selectedSurvey.pengalaman_sewa}</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#F5F5F7] p-2.5">
                      <p className="text-[9.5px] font-bold uppercase text-[#86868B]">
                        TUJUAN SEWA
                      </p>
                      <p className="inline-flex items-center gap-1.5 font-bold text-[#0071E3] mt-0.5">
                        <TargetIcon className="h-3.5 w-3.5 text-[#0071E3]" />
                        <span>{selectedSurvey.tujuan_penyewaan}</span>
                      </p>
                    </div>
                  </div>

                  {selectedSurvey.tujuan_lainnya && (
                    <p className="text-[11.5px] text-[#6E6E73] bg-[#F5F5F7]/70 rounded-xl px-3 py-2">
                      <strong>Catatan Pengunjung:</strong>{" "}
                      {selectedSurvey.tujuan_lainnya}
                    </p>
                  )}
                </div>
              )}

              {/* Chat Thread Box */}
              <div className="apple-card flex flex-col rounded-3xl bg-white overflow-hidden h-[460px]">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3.5">
                  {messages.length === 0 ? (
                    <p className="py-16 text-center text-[12.5px] text-[#86868B]">
                      Belum ada pesan pada percakapan ini.
                    </p>
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.sender_type === "admin";
                      const match = m.message.match(CATALOG_TAG_REGEX);
                      let catalog: Record<string, string> | null = null;
                      let text = m.message;
                      if (match) {
                        try {
                          catalog = JSON.parse(match[1]);
                          text = (match[2] || "").trim();
                        } catch {
                          // fallback raw
                        }
                      }

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${
                            isAdmin ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] ${
                              isAdmin
                                ? "rounded-br-xs bg-[#0071E3] text-white"
                                : "rounded-bl-xs bg-[#F5F5F7] text-[#1D1D1F]"
                            }`}
                          >
                            {catalog && (
                              <div className="mb-2 rounded-xl bg-white p-3 text-[#1D1D1F] border border-[#D2D2D7]/60">
                                <p className="inline-flex items-center gap-1.5 text-[9.5px] font-bold uppercase text-[#0071E3] mb-1">
                                  <SmartphoneIcon className="h-3.5 w-3.5" />
                                  <span>KATALOG PRODUK DARI PENGUNJUNG</span>
                                </p>
                                <p className="text-[13px] font-bold">
                                  {catalog.unit}
                                </p>
                                <p className="text-[11px] text-[#6E6E73]">
                                  {catalog.storage} • {catalog.warna} • Paket{" "}
                                  {catalog.durasi} ({catalog.harga})
                                </p>
                                {(catalog.cabang || catalog.jadwal) && (
                                  <p className="inline-flex flex-wrap items-center gap-2 text-[10.5px] text-[#0071E3] mt-1 font-medium">
                                    <span className="inline-flex items-center gap-1">
                                      <MapPinIcon className="h-3 w-3" />
                                      {catalog.cabang}
                                    </span>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1">
                                      <CalendarIcon className="h-3 w-3" />
                                      {catalog.jadwal}
                                    </span>
                                  </p>
                                )}
                              </div>
                            )}
                            {text && (
                              <p className="whitespace-pre-wrap">{text}</p>
                            )}
                          </div>
                          <span className="mt-1 px-1 text-[10px] text-[#86868B]">
                            {isAdmin ? "Admin" : "Pengunjung"} •{" "}
                            {new Date(m.created_at).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                <form
                  onSubmit={handleSendReply}
                  className="p-3.5 bg-[#F5F5F7] border-t border-[#D2D2D7]/60 flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ketik balasan Admin..."
                    className="flex-1 rounded-full bg-white px-4 py-2.5 text-[13px] text-[#1D1D1F] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 px-5 py-2.5 text-[12.5px] font-semibold text-white"
                  >
                    Kirim
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// TAB 7: PROFIL ADMIN (Reference Image 10)
// ======================================================
interface AdminProfilTabProps {
  admin: AdminProfile;
  branchesCount: number;
  onProfileUpdated: (updated: AdminProfile) => void;
  onLogout: () => void;
}

export function AdminProfilTab({
  admin,
  branchesCount,
  onProfileUpdated,
  onLogout,
}: AdminProfilTabProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [fullName, setFullName] = useState(admin.full_name || "");
  const [phone, setPhone] = useState(admin.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        })
        .eq("id", admin.id);

      if (error) {
        setFeedback(`⚠️ Gagal memperbarui profil: ${error.message}`);
      } else {
        onProfileUpdated({
          ...admin,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        });
        setEditingProfile(false);
        setFeedback("✓ Profil admin berhasil diperbarui.");
      }
    } catch {
      setFeedback("⚠️ Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setFeedback("⚠️ Kata sandi baru minimal 6 karakter.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setFeedback(`⚠️ Gagal mengubah sandi: ${error.message}`);
      } else {
        setNewPassword("");
        setChangingPassword(false);
        setFeedback("✓ Kata sandi berhasil diperbarui.");
      }
    } catch {
      setFeedback("⚠️ Terjadi kesalahan saat mengubah kata sandi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl py-6 space-y-6">
      {feedback && (
        <div className="rounded-2xl bg-[#E8F2FF] border border-[#0071E3]/30 px-4 py-3 text-center text-[12.5px] font-semibold text-[#0071E3]">
          {feedback}
        </div>
      )}

      {/* Top Profile Identity Card */}
      <div className="apple-card rounded-[32px] bg-white p-8 sm:p-8 text-center space-y-4">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#0071E3] to-[#00346B] text-2xl font-bold text-white shadow-lg">
          {getInitials(admin.full_name || admin.email)}
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3] shadow-md border border-white">
            <CameraIcon className="h-3.5 w-3.5" />
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">
            {admin.full_name || "Administrator iRent"}
          </h1>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingProfile((p) => !p);
              setChangingPassword(false);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-6 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all"
          >
            <EditIcon className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setChangingPassword((p) => !p);
              setEditingProfile(false);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#F5F5F7] hover:bg-[#E8F2FF] px-6 py-2.5 text-[12.5px] font-semibold text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            <span>Ubah Sandi</span>
          </button>
        </div>

        {/* Inline Edit Profile Form */}
        {editingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-[#F5F5F7] text-left space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1">
                  Nama Lengkap Admin
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl bg-[#F5F5F7] px-3.5 py-2.5 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 811-6890-8888"
                  className="w-full rounded-xl bg-[#F5F5F7] px-3.5 py-2.5 text-[13px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="rounded-full bg-[#F5F5F7] px-4 py-2 text-[12px] font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#0071E3] text-white px-5 py-2 text-[12px] font-semibold"
              >
                {saving ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </div>
          </form>
        )}

        {/* Inline Change Password Form */}
        {changingPassword && (
          <form
            onSubmit={handleSavePassword}
            className="mt-6 pt-6 border-t border-[#F5F5F7] text-left space-y-4"
          >
            <div>
              <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1">
                Kata Sandi Baru (Minimal 6 Karakter)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru..."
                className="w-full rounded-xl bg-[#F5F5F7] px-3.5 py-2.5 text-[13px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setChangingPassword(false)}
                className="rounded-full bg-[#F5F5F7] px-4 py-2 text-[12px] font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#0071E3] text-white px-5 py-2 text-[12px] font-semibold"
              >
                {saving ? "Memperbarui..." : "Perbarui Sandi"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Contact & Account Details Card */}
      <div className="apple-card rounded-[32px] bg-white p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-widest text-[#86868B] pb-2 border-b border-[#F5F5F7]">
          <span>INFORMASI KONTAK &amp; AKUN</span>
        </div>

        <div className="divide-y divide-[#F5F5F7]">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
                <MailIcon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-[11px] text-[#86868B]">Alamat Email Resmi</p>
                <p className="text-[13.5px] font-bold text-[#1D1D1F]">
                  {admin.email}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#E8F2FF] px-3 py-1 text-[10.5px] font-bold text-[#0071E3]">
              Terverifikasi
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
                <SmartphoneIcon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-[11px] text-[#86868B]">
                  Nomor Telepon &amp; WhatsApp
                </p>
                <p className="text-[13.5px] font-bold text-[#1D1D1F]">
                  {admin.phone || "+62 811-6890-8888"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Logout Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-red-50 border border-[#D2D2D7]/70 hover:border-red-200 px-6 py-2.5 text-[13px] font-semibold text-[#1D1D1F] hover:text-red-600 transition-colors shadow-2xs"
        >
          <LogOutIcon className="h-4 w-4" />
          <span>Keluar Sesi (Logout)</span>
        </button>
      </div>
    </div>
  );
}
