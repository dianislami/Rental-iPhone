"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { IphoneVisual } from "@/components/public/IphoneVisual";
import {
  enrichBranchWithUnits,
  enrichIphoneUnit,
  formatRupiah,
  getColorHex,
} from "@/lib/public-data";
import {
  AdminProfile,
  Branch,
  CustomerRecord,
  ExpenseRecord,
  formatShortDateId,
  formatTimeShort,
  getInitials,
  getRentalRemainingInfo,
  IphoneUnit,
  PriceVariant,
  RentalTransaction,
} from "@/lib/admin-types";
import {
  BranchModal,
  ExpenseModal,
  IphoneUnitModal,
  RentalModal,
} from "@/components/admin/AdminModals";
import {
  AdminKatalogTab,
  AdminKeuanganTab,
  AdminLiveChatTab,
  AdminProfilTab,
} from "@/components/admin/AdminTabsSecondary";

type AdminTabId =
  | "dashboard"
  | "cabang-unit"
  | "katalog"
  | "transaksi"
  | "keuangan"
  | "live-chat"
  | "profil";

function AdminConsoleContent() {
  // Auth States
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<AdminTabId>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Core Database States
  const [loadingData, setLoadingData] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [iphones, setIphones] = useState<IphoneUnit[]>([]);
  const [priceVariants, setPriceVariants] = useState<PriceVariant[]>([]);
  const [rentals, setRentals] = useState<RentalTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);

  // Cabang & Unit Tab States
  const [selectedHubBranchId, setSelectedHubBranchId] = useState<string>("all");
  const [unitStatusFilter, setUnitStatusFilter] = useState<string>("all");
  const [unitSearch, setUnitSearch] = useState<string>("");
  const [unitPage, setUnitPage] = useState<number>(1);

  // Transaksi Tab States
  const [txBranchFilter, setTxBranchFilter] = useState<string>("all");
  const [txStatusFilter, setTxStatusFilter] = useState<string>("all");
  const [txSearch, setTxSearch] = useState<string>("");
  const [timelineStartOffset, setTimelineStartOffset] = useState<number>(0);

  // Modal States
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<IphoneUnit | null>(null);

  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<RentalTransaction | null>(
    null
  );
  const [rentalChatConvId, setRentalChatConvId] = useState<string | null>(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(
    null
  );

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  }

  // 1. Check Admin Auth Session
  const checkAdminSession = useCallback(async () => {
    setCheckingAuth(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAdmin(json.data);
        } else {
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAdminSession();
  }, [checkAdminSession]);

  // 2. Load All Admin Database Entities
  const fetchAllAdminData = useCallback(async () => {
    if (!admin) return;
    setLoadingData(true);
    try {
      const [
        branchesRes,
        iphonesRes,
        variantsRes,
        rentalsRes,
        expensesRes,
        customersRes,
      ] = await Promise.all([
        fetch("/api/branches").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/iphones").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/price-variants").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/rentals").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/expenses").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/customers").then((r) => (r.ok ? r.json() : null)),
      ]);

      const rawBranches: Branch[] = Array.isArray(branchesRes?.data)
        ? branchesRes.data
        : [];
      const rawIphones: IphoneUnit[] = Array.isArray(iphonesRes?.data)
        ? iphonesRes.data
        : [];
      const rawVariants: PriceVariant[] = Array.isArray(variantsRes?.data)
        ? variantsRes.data
        : [];
      const rawRentals: RentalTransaction[] = Array.isArray(rentalsRes?.data)
        ? rentalsRes.data
        : [];
      const rawExpenses: ExpenseRecord[] = Array.isArray(expensesRes?.data)
        ? expensesRes.data
        : [];
      const rawCustomers: CustomerRecord[] = Array.isArray(customersRes?.data)
        ? customersRes.data
        : [];

      const enrichedIphones = rawIphones.map((u) =>
        enrichIphoneUnit(u, rawVariants)
      );
      const enrichedBranches = rawBranches.map((b) =>
        enrichBranchWithUnits(b, enrichedIphones)
      );

      setBranches(enrichedBranches);
      setIphones(enrichedIphones);
      setPriceVariants(rawVariants);
      setRentals(rawRentals);
      setExpenses(rawExpenses);
      setCustomers(rawCustomers);

      if (
        selectedHubBranchId === "all" &&
        enrichedBranches.length > 0
      ) {
        setSelectedHubBranchId(enrichedBranches[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch admin console data:", err);
    } finally {
      setLoadingData(false);
    }
  }, [admin, selectedHubBranchId]);

  useEffect(() => {
    if (admin) {
      fetchAllAdminData();
    }
  }, [admin, fetchAllAdminData]);

  // Handle Admin Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;
    setLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setLoginError(json.message || "Email atau password admin tidak valid.");
        return;
      }
      await checkAdminSession();
    } catch {
      setLoginError("Gagal menghubungi server autentikasi.");
    } finally {
      setLoggingIn(false);
    }
  }

  // Handle Admin Logout
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setAdmin(null);
      setLoginPassword("");
    } catch {
      // Ignore
    }
  }

  // Delete Handlers
  async function handleDeleteBranch(branch: Branch) {
    if (
      !window.confirm(
        `Hapus cabang "${branch.nama_cabang}" (${branch.kota}) dari database?`
      )
    )
      return;
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(`⚠️ ${json.message || "Gagal menghapus cabang."}`);
        return;
      }
      showToast("✓ Cabang berhasil dihapus.");
      fetchAllAdminData();
    } catch {
      showToast("⚠️ Gagal menghapus cabang.");
    }
  }

  async function handleDeleteUnit(unit: IphoneUnit) {
    if (
      !window.confirm(
        `Hapus unit "${unit.nama_unit}" (${unit.storage}) dari database?`
      )
    )
      return;
    try {
      const res = await fetch(`/api/iphones/${unit.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(`⚠️ ${json.message || "Gagal menghapus unit iPhone."}`);
        return;
      }
      showToast("✓ Unit iPhone berhasil dihapus.");
      fetchAllAdminData();
    } catch {
      showToast("⚠️ Gagal menghapus unit iPhone.");
    }
  }

  async function handleCancelRental(rental: RentalTransaction) {
    if (
      !window.confirm(
        `Batalkan reservasi sewa untuk pelanggan "${
          rental.customers?.nama || "-"
        }"?`
      )
    )
      return;
    try {
      const res = await fetch(`/api/rentals/${rental.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(`⚠️ ${json.message || "Gagal membatalkan transaksi."}`);
        return;
      }
      showToast("✓ Transaksi berhasil dibatalkan.");
      fetchAllAdminData();
    } catch {
      showToast("⚠️ Gagal membatalkan transaksi.");
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    if (!window.confirm("Hapus catatan pengeluaran ini dari jurnal kas?"))
      return;
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(`⚠️ ${json.message || "Gagal menghapus pengeluaran."}`);
        return;
      }
      showToast("✓ Catatan pengeluaran berhasil dihapus.");
      fetchAllAdminData();
    } catch {
      showToast("⚠️ Gagal menghapus pengeluaran.");
    }
  }

  // ======================================================
  // COMPUTED METRICS FROM REAL DATABASE
  // ======================================================
  const activeRentedIphoneIds = useMemo(() => {
    const ids = new Set<string>();
    rentals.forEach((r) => {
      if (r.status_sewa === "sedang_disewa") {
        ids.add(r.iphone_id);
      }
    });
    return ids;
  }, [rentals]);

  const dashboardMetrics = useMemo(() => {
    const totalUnits = iphones.length;
    const rentedCount = activeRentedIphoneIds.size;
    const availableCount = iphones.filter(
      (u) => u.status === "aktif" && !activeRentedIphoneIds.has(u.id)
    ).length;
    const utilizationPct =
      totalUnits > 0 ? ((rentedCount / totalUnits) * 100).toFixed(1) : "0.0";

    const validRentals = rentals.filter((r) => r.status_sewa !== "dibatalkan");
    const grossIncome = validRentals.reduce(
      (sum, r) =>
        sum +
        (r.status_pembayaran === "lunas"
          ? Number(r.total_bayar) || 0
          : Number(r.dp) || Number(r.total_bayar) || 0),
      0
    );
    const totalExpense = expenses.reduce(
      (sum, e) => sum + (Number(e.nominal) || 0),
      0
    );
    const netMarginPct =
      grossIncome > 0
        ? (((grossIncome - totalExpense) / grossIncome) * 100).toFixed(1)
        : "100.0";
    const avgTransaction =
      validRentals.length > 0
        ? Math.round(grossIncome / validRentals.length)
        : 0;

    return {
      totalBranches: branches.length,
      totalUnits,
      rentedCount,
      availableCount,
      utilizationPct,
      grossIncome,
      totalExpense,
      netMarginPct,
      totalTransactions: rentals.length,
      avgTransaction,
    };
  }, [branches, iphones, rentals, expenses, activeRentedIphoneIds]);

  // Filtered units for Cabang & Unit tab
  const filteredInventoryUnits = useMemo(() => {
    return iphones.filter((u) => {
      if (
        selectedHubBranchId !== "all" &&
        u.branch_id !== selectedHubBranchId
      ) {
        return false;
      }
      if (unitStatusFilter !== "all" && u.status !== unitStatusFilter) {
        return false;
      }
      const q = (unitSearch || globalSearch).trim().toLowerCase();
      if (q) {
        const hay = `${u.nama_unit} ${u.tipe} ${u.storage} ${u.warna}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    iphones,
    selectedHubBranchId,
    unitStatusFilter,
    unitSearch,
    globalSearch,
  ]);

  const inventoryPageSize = 6;
  const totalUnitPages = Math.max(
    1,
    Math.ceil(filteredInventoryUnits.length / inventoryPageSize)
  );
  const paginatedUnits = filteredInventoryUnits.slice(
    (unitPage - 1) * inventoryPageSize,
    unitPage * inventoryPageSize
  );

  const selectedHubBranch =
    branches.find((b) => b.id === selectedHubBranchId) || branches[0] || null;

  // Filtered transactions for Transaksi tab
  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      if (txBranchFilter !== "all" && r.branch_id !== txBranchFilter) {
        return false;
      }
      const rem = getRentalRemainingInfo(r);
      if (txStatusFilter === "sedang_disewa") {
        if (r.status_sewa !== "sedang_disewa") return false;
      } else if (txStatusFilter === "terjadwal") {
        if (r.status_sewa !== "terjadwal") return false;
      } else if (txStatusFilter === "selesai") {
        if (r.status_sewa !== "selesai") return false;
      } else if (txStatusFilter === "dibatalkan") {
        if (r.status_sewa !== "dibatalkan") return false;
      } else if (txStatusFilter === "overdue") {
        if (!rem.isOverdue) return false;
      }

      const q = (txSearch || globalSearch).trim().toLowerCase();
      if (q) {
        const hay = `${r.customers?.nama || ""} ${
          r.customers?.no_whatsapp || ""
        } ${r.iphones?.nama_unit || ""} ${
          r.branches?.kota || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rentals, txBranchFilter, txStatusFilter, txSearch, globalSearch]);

  // 7-Day Visual Timeline Days for Transaksi Tab (Deferred to useEffect for Next.js 16 Cache Components)
  const [clientTodayStr, setClientTodayStr] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setClientTodayStr(`${y}-${m}-${d}`);
  }, []);

  const timelineDays = useMemo(() => {
    if (!clientTodayStr) return [];
    const [by, bm, bd] = clientTodayStr.split("-").map(Number);
    const base = new Date(by, (bm || 1) - 1, bd || 1);
    base.setDate(base.getDate() + timelineStartOffset);

    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const monthNames = [
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

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      return {
        dateStr,
        label: `${d.getDate()} ${monthNames[d.getMonth()]} (${
          dayNames[d.getDay()]
        })`,
        isToday: i === 0 && timelineStartOffset === 0,
      };
    });
  }, [clientTodayStr, timelineStartOffset]);

  // ======================================================
  // AUTH LOADING OR LOGIN SCREEN
  // ======================================================
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] p-6">
        <div className="apple-card rounded-3xl bg-white p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F2FF] p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="iRent"
              className="h-full w-full object-contain animate-pulse"
            />
          </div>
          <p className="text-[14px] font-bold text-[#1D1D1F]">
            Memverifikasi Otoritas Admin Console...
          </p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-4 py-12">
        <div className="w-full max-w-md rounded-[32px] bg-white p-8 sm:p-10 shadow-xl border border-[#D2D2D7]/70 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F7] p-2 border border-[#D2D2D7]/60 shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="iRent Admin"
                className="h-full w-full object-contain"
              />
            </div>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#0071E3] pt-1">
              IRENT ADMIN CONSOLE
            </p>
            <h1 className="text-2xl font-bold text-[#1D1D1F]">
              Masuk ke Portal Admin
            </h1>
            <p className="text-[12.5px] text-[#6E6E73]">
              Akses khusus manajemen operasional cabang, armada iPhone,
              transaksi sewa, dan arus kas iRent Aceh.
            </p>
          </div>

          {loginError && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[12.5px] text-red-700 text-center">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                Email Administrator
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@irent.id"
                className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13.5px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13.5px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 py-3.5 text-[13.5px] font-semibold text-white shadow-md shadow-[#0071E3]/25 transition-all"
            >
              {loggingIn ? "Memverifikasi Sesi..." : "Masuk ke Admin Console →"}
            </button>
          </form>

          <p className="text-center text-[11px] text-[#86868B]">
            🔒 Dilindungi oleh Supabase JWT &amp; Row Level Security
          </p>
        </div>
      </div>
    );
  }

  // Sidebar menu items
  const sidebarItems: Array<{
    id: AdminTabId;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: "cabang-unit",
      label: "Cabang & Unit",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      id: "katalog",
      label: "Katalog",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        </svg>
      ),
    },
    {
      id: "transaksi",
      label: "Transaksi",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      id: "keuangan",
      label: "Keuangan",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      id: "live-chat",
      label: "Live Chat & Survei",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: "profil",
      label: "Profil",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
      {/* ======================================================
          LEFT SIDEBAR NAVIGATION
         ====================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#F5F5F7] border-r border-[#D2D2D7]/70 flex flex-col justify-between p-4 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-2 py-2 mb-6">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="iRent"
                className="h-9 w-9 rounded-xl object-contain bg-white p-1 border border-[#D2D2D7]/60 shadow-2xs"
              />
              <div>
                <p className="text-[15px] font-bold leading-none text-[#1D1D1F]">
                  iRent
                </p>
                <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#86868B] mt-1">
                  ADMIN CONSOLE
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-sm text-[#6E6E73]"
            >
              ✕
            </button>
          </div>

          {/* Menu Links */}
          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-[#0071E3] text-white shadow-sm shadow-[#0071E3]/25"
                      : "text-[#6E6E73] hover:bg-white hover:text-[#1D1D1F]"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status Pill */}
        <div className="rounded-2xl bg-white px-4 py-3 border border-[#D2D2D7]/60 flex items-center justify-between text-[11px] shadow-2xs">
          <span className="inline-flex items-center gap-2 font-semibold text-[#6E6E73]">
            <span className="h-2 w-2 rounded-full bg-[#0071E3]" />
            Central Operations
          </span>
          <span className="text-[#86868B] font-medium">v2.4</span>
        </div>
      </aside>

      {/* ======================================================
          RIGHT MAIN WORKSPACE
         ====================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-xl border-b border-[#D2D2D7]/60 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#1D1D1F]"
            >
              ☰
            </button>
            {loadingData && (
              <span className="text-[11.5px] font-semibold text-[#0071E3] animate-pulse">
                ↻ Menyinkronkan database...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search commands bar */}
            <div className="relative hidden sm:block w-64">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868B]"
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
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search commands..."
                className="w-full rounded-full bg-[#F5F5F7] pl-9 pr-10 py-1.5 text-[12px] text-[#1D1D1F] placeholder:text-[#86868B] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-white px-1.5 py-0.5 text-[9.5px] font-semibold text-[#86868B] border border-[#D2D2D7]/60">
                ⌘K
              </span>
            </div>

            {/* Live Chat Shortcut Button */}
            <button
              type="button"
              onClick={() => setActiveTab("live-chat")}
              title="Buka Inbox Live Chat"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] hover:bg-[#E8F2FF] text-[#6E6E73] hover:text-[#0071E3] transition-colors"
            >
              💬
            </button>

            {/* Profile Avatar Button */}
            <button
              type="button"
              onClick={() => setActiveTab("profil")}
              title={admin.full_name || admin.email}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0071E3] text-white text-[12px] font-bold shadow-xs hover:bg-[#0077ED] transition-colors"
            >
              {getInitials(admin.full_name || admin.email)}
            </button>
          </div>
        </header>

        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div className="mx-4 sm:mx-8 mt-4 rounded-2xl bg-[#E8F2FF] border border-[#0071E3]/30 px-4 py-2.5 text-[12.5px] font-semibold text-[#0071E3] flex items-center justify-between">
            <span>{toastMsg}</span>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-xs underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* MAIN PAGE CONTENT */}
        <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* ==================================================
              TAB 1: DASHBOARD IRENT (Reference Image 1)
             ================================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
                  Dashboard iRent
                </h1>
                <button
                  type="button"
                  onClick={fetchAllAdminData}
                  className="rounded-full bg-white border border-[#D2D2D7]/70 px-4 py-2 text-[12px] font-semibold text-[#1D1D1F] hover:text-[#0071E3] shadow-2xs"
                >
                  ↻ Refresh Data
                </button>
              </div>

              {/* ROW 1: 4 OPERATIONAL KPI CARDS */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="apple-card rounded-3xl bg-white p-5">
                  <div className="flex items-center justify-between text-[12px] text-[#86868B]">
                    <span>Total Cabang</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#1D1D1F]">
                      🏪
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-[#1D1D1F]">
                      {dashboardMetrics.totalBranches}
                    </span>
                    <span className="text-[13px] text-[#86868B]">Cabang</span>
                  </div>
                  <p className="mt-2 text-[11px] text-[#6E6E73]">
                    <strong className="text-[#1D1D1F]">100% Aktif</strong> •
                    Wilayah Aceh
                  </p>
                </div>

                <div className="apple-card rounded-3xl bg-white p-5">
                  <div className="flex items-center justify-between text-[12px] text-[#86868B]">
                    <span>Total Unit iPhone</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#1D1D1F]">
                      📱
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-[#1D1D1F]">
                      {dashboardMetrics.totalUnits}
                    </span>
                    <span className="text-[13px] text-[#86868B]">Unit</span>
                  </div>
                  <p className="mt-2 text-[11px] text-[#6E6E73]">
                    Armada Terdaftar di Database
                  </p>
                </div>

                <div className="apple-card rounded-3xl bg-white p-5">
                  <div className="flex items-center justify-between text-[12px] text-[#86868B]">
                    <span>Unit Sedang Disewa</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3]">
                      🔑
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-[#0071E3]">
                      {dashboardMetrics.rentedCount}
                    </span>
                    <span className="text-[13px] text-[#86868B]">Unit</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-[#F5F5F7] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0071E3]"
                        style={{
                          width: `${Math.min(
                            100,
                            Number(dashboardMetrics.utilizationPct)
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#6E6E73]">
                      {dashboardMetrics.utilizationPct}% Utilitas
                    </span>
                  </div>
                </div>

                <div className="apple-card rounded-3xl bg-white p-5">
                  <div className="flex items-center justify-between text-[12px] text-[#86868B]">
                    <span>Unit Tersedia</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      ✓
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-[#1D1D1F]">
                      {dashboardMetrics.availableCount}
                    </span>
                    <span className="text-[13px] text-[#86868B]">Unit</span>
                  </div>
                  <p className="mt-2 text-[11px] text-[#6E6E73]">
                    <strong className="text-emerald-600">Siap Sewa</strong> •
                    Terinspeksi
                  </p>
                </div>
              </div>

              {/* ROW 2: FINANCIAL & TRANSACTION KPI CARDS */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-6 apple-card rounded-3xl bg-white p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] text-[#6E6E73]">
                        Total Pendapatan
                      </span>
                      <span className="rounded bg-[#E8F2FF] px-2 py-0.5 text-[9.5px] font-bold uppercase text-[#0071E3]">
                        GROSS
                      </span>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3]">
                      📈
                    </span>
                  </div>

                  <div className="my-3 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
                      {formatRupiah(dashboardMetrics.grossIncome)}
                    </span>
                    <span className="rounded-full bg-[#E8F2FF] px-3 py-1 text-[11px] font-bold text-[#0071E3]">
                      ↑ Live Database
                    </span>
                  </div>

                  <p className="text-[11.5px] text-[#86868B]">
                    Konsolidasi {dashboardMetrics.totalBranches} cabang aktif
                  </p>
                </div>

                <div className="lg:col-span-3 apple-card rounded-3xl bg-white p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[12.5px] text-[#6E6E73]">
                    <span>Total Pengeluaran</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7]">
                      💸
                    </span>
                  </div>
                  <p className="my-3 text-2xl font-bold text-[#1D1D1F]">
                    {formatRupiah(dashboardMetrics.totalExpense)}
                  </p>
                  <p className="text-[11.5px] text-[#86868B]">
                    Margin Bersih {dashboardMetrics.netMarginPct}%
                  </p>
                </div>

                <div className="lg:col-span-3 apple-card rounded-3xl bg-white p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[12.5px] text-[#6E6E73]">
                    <span>Total Transaksi</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7]">
                      🧾
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
                      {dashboardMetrics.totalTransactions}
                    </span>
                    <span className="text-[13px] text-[#86868B]">Sewa</span>
                  </div>
                  <p className="text-[11.5px] font-semibold text-[#1D1D1F]">
                    Avg {formatRupiah(dashboardMetrics.avgTransaction)}
                  </p>
                </div>
              </div>

              {/* ROW 3: RINGKASAN PER CABANG */}
              <div className="space-y-4">
                <h2 className="text-[17px] font-bold text-[#1D1D1F]">
                  Ringkasan Per Cabang
                </h2>

                {branches.length === 0 ? (
                  <div className="apple-card rounded-3xl bg-white p-8 text-center text-sm text-[#86868B]">
                    Belum ada cabang terdaftar di database.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {branches.map((b, idx) => {
                      const branchUnits = iphones.filter(
                        (u) => u.branch_id === b.id
                      );
                      const branchRented = branchUnits.filter((u) =>
                        activeRentedIphoneIds.has(u.id)
                      ).length;
                      const branchAvail = Math.max(
                        0,
                        branchUnits.length - branchRented
                      );
                      const branchRevenue = rentals
                        .filter(
                          (r) =>
                            r.branch_id === b.id &&
                            r.status_sewa !== "dibatalkan"
                        )
                        .reduce(
                          (sum, r) =>
                            sum +
                            (r.status_pembayaran === "lunas"
                              ? Number(r.total_bayar) || 0
                              : Number(r.dp) || Number(r.total_bayar) || 0),
                          0
                        );

                      return (
                        <div
                          key={b.id}
                          className="apple-card rounded-3xl bg-white p-5 flex flex-col justify-between space-y-4"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-2.5">
                              <span className="rounded-full bg-[#E8F2FF] px-2.5 py-0.5 font-bold uppercase text-[#0071E3]">
                                {idx === 0 ? "HQ SENTRAL" : "REGIONAL"}
                              </span>
                              <span className="text-[#86868B] font-medium">
                                Cabang #{String(idx + 1).padStart(2, "0")}
                              </span>
                            </div>

                            <h3 className="text-[17px] font-bold text-[#1D1D1F]">
                              {b.kota}
                            </h3>
                            <p className="text-[11.5px] text-[#86868B] truncate">
                              {b.nama_cabang}
                            </p>

                            <div className="mt-4 rounded-2xl bg-[#F5F5F7] p-3 space-y-2">
                              <div className="flex items-center justify-between text-[11.5px]">
                                <span className="text-[#6E6E73]">
                                  Total Alokasi
                                </span>
                                <span className="font-bold text-[#1D1D1F]">
                                  {branchUnits.length} Unit
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-white overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#0071E3]"
                                  style={{
                                    width: `${
                                      branchUnits.length > 0
                                        ? Math.min(
                                            100,
                                            (branchRented /
                                              branchUnits.length) *
                                              100
                                          )
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10.5px] text-[#6E6E73]">
                                <span>● Disewa: {branchRented}</span>
                                <span>● Tersedia: {branchAvail}</span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-[#F5F5F7]/70 px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-[#86868B]">
                              OMSET
                            </span>
                            <span className="text-[14px] font-bold text-[#1D1D1F]">
                              {formatRupiah(branchRevenue)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ROW 4: 3 LIVE ACTIVITY COLUMNS */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Col 1: Transaksi Terkini */}
                <div className="apple-card rounded-3xl bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F2FF] text-[#0071E3]">
                        🧾
                      </span>
                      <div>
                        <h3 className="text-[14.5px] font-bold text-[#1D1D1F]">
                          Transaksi Terkini
                        </h3>
                        <p className="text-[11px] text-[#86868B]">
                          Aktivitas booking masuk
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("transaksi")}
                      className="text-xs font-semibold text-[#0071E3] hover:underline"
                    >
                      Semua
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {rentals.slice(0, 4).length === 0 ? (
                      <p className="py-8 text-center text-xs text-[#86868B]">
                        Belum ada transaksi rental.
                      </p>
                    ) : (
                      rentals.slice(0, 4).map((r) => (
                        <div
                          key={r.id}
                          className="rounded-2xl bg-[#F5F5F7]/80 p-3.5 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12.5px] font-bold text-[#1D1D1F]">
                              {r.customers?.nama || "Pelanggan"}
                            </span>
                            <span className="text-[12.5px] font-bold text-[#0071E3]">
                              {formatRupiah(r.total_bayar)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#6E6E73]">
                            <span className="font-semibold text-[#1D1D1F] truncate">
                              {r.iphones?.nama_unit || "Unit iPhone"}
                            </span>
                            <span>{r.branches?.kota || "Aceh"}</span>
                          </div>
                          <p className="text-[10.5px] text-[#86868B]">
                            {formatShortDateId(r.tanggal_pengambilan)} • Paket{" "}
                            {r.price_variants?.nama_varian || "Harian"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Col 2: Sewa Berjalan */}
                <div className="apple-card rounded-3xl bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F2FF] text-[#0071E3]">
                        ⏱️
                      </span>
                      <div>
                        <h3 className="text-[14.5px] font-bold text-[#1D1D1F]">
                          Sewa Berjalan
                        </h3>
                        <p className="text-[11px] text-[#86868B]">
                          Status unit aktif di tangan user
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {rentals.filter(
                      (r) =>
                        r.status_sewa === "sedang_disewa" ||
                        r.status_sewa === "terjadwal"
                    ).length === 0 ? (
                      <p className="py-8 text-center text-xs text-[#86868B]">
                        Tidak ada sewa yang sedang berjalan.
                      </p>
                    ) : (
                      rentals
                        .filter(
                          (r) =>
                            r.status_sewa === "sedang_disewa" ||
                            r.status_sewa === "terjadwal"
                        )
                        .slice(0, 4)
                        .map((r) => {
                          const rem = getRentalRemainingInfo(r);
                          return (
                            <div
                              key={r.id}
                              className="rounded-2xl bg-[#F5F5F7]/80 p-3.5 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[12.5px] font-bold text-[#1D1D1F]">
                                  {r.customers?.nama || "Pelanggan"}
                                </span>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    rem.isOverdue
                                      ? "bg-red-100 text-red-700"
                                      : "bg-white text-[#0071E3] shadow-2xs"
                                  }`}
                                >
                                  ● {rem.label}
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-[#1D1D1F]">
                                {r.iphones?.nama_unit} ({r.iphones?.storage})
                              </p>
                              <div className="flex items-center justify-between text-[10.5px] text-[#86868B]">
                                <span>
                                  Pickup:{" "}
                                  {formatShortDateId(r.tanggal_pengambilan)},{" "}
                                  {formatTimeShort(r.jam_pengambilan)}
                                </span>
                                <span>{r.branches?.kota}</span>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Col 3: Pengeluaran Terkini */}
                <div className="apple-card rounded-3xl bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F2FF] text-[#0071E3]">
                        🏦
                      </span>
                      <div>
                        <h3 className="text-[14.5px] font-bold text-[#1D1D1F]">
                          Pengeluaran Terkini
                        </h3>
                        <p className="text-[11px] text-[#86868B]">
                          Beban logistik &amp; pemeliharaan
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("keuangan")}
                      className="text-xs font-semibold text-[#0071E3] hover:underline"
                    >
                      Semua
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {expenses.slice(0, 4).length === 0 ? (
                      <p className="py-8 text-center text-xs text-[#86868B]">
                        Belum ada catatan pengeluaran.
                      </p>
                    ) : (
                      expenses.slice(0, 4).map((e) => (
                        <div
                          key={e.id}
                          className="rounded-2xl bg-[#F5F5F7]/80 p-3.5 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12.5px] font-bold text-[#1D1D1F] truncate">
                              {e.keterangan || "Beban Operasional"}
                            </span>
                            <span className="text-[12.5px] font-bold text-[#1D1D1F] shrink-0">
                              {formatRupiah(e.nominal)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10.5px] text-[#86868B]">
                            <span>{formatShortDateId(e.tanggal)}</span>
                            <span className="font-semibold text-[#1D1D1F]">
                              {e.branches?.kota || "Aceh"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              TAB 2: MANAJEMEN CABANG & UNIT IPHONE (Image 2)
             ================================================== */}
          {activeTab === "cabang-unit" && (
            <div className="space-y-6">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
                  Manajemen Cabang &amp; Unit iPhone
                </h1>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={unitStatusFilter}
                    onChange={(e) => {
                      setUnitStatusFilter(e.target.value);
                      setUnitPage(1);
                    }}
                    className="rounded-full bg-white border border-[#D2D2D7]/70 px-4 py-2.5 text-[12px] font-semibold text-[#1D1D1F] shadow-2xs focus:border-[#0071E3] focus:outline-none"
                  >
                    <option value="all">⚙️ Filter Status: Semua</option>
                    <option value="aktif">● Status: Aktif</option>
                    <option value="perawatan">● Status: Perawatan</option>
                    <option value="nonaktif">● Status: Nonaktif</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingBranch(null);
                      setBranchModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all"
                  >
                    <span>+</span> Tambah Cabang
                  </button>
                </div>
              </div>

              {/* Section 1: Daftar Hub Cabang Aktif */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-[#1D1D1F]">
                      🏪 Daftar Hub Cabang Aktif
                    </span>
                    <span className="rounded-full bg-[#E8F2FF] px-2.5 py-0.5 text-[10.5px] font-bold text-[#0071E3]">
                      {branches.length} Cabang
                    </span>
                  </div>

                  {selectedHubBranchId !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedHubBranchId("all")}
                      className="text-[12px] font-semibold text-[#0071E3] hover:underline"
                    >
                      Tampilkan Semua Cabang
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {branches.map((b) => {
                    const isSelected = selectedHubBranchId === b.id;
                    const branchUnits = iphones.filter(
                      (u) => u.branch_id === b.id
                    );
                    const rentedCount = branchUnits.filter((u) =>
                      activeRentedIphoneIds.has(u.id)
                    ).length;
                    const availCount = Math.max(
                      0,
                      branchUnits.length - rentedCount
                    );

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedHubBranchId(b.id);
                          setUnitPage(1);
                        }}
                        className={`rounded-3xl bg-white p-5 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-2 border-[#0071E3] shadow-[0_8px_28px_rgba(0,113,227,0.12)]"
                            : "apple-card"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F5F7] text-[#1D1D1F]">
                              🏢
                            </span>
                            <span className="rounded-full bg-[#F5F5F7] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#1D1D1F]">
                              ● BUKA
                            </span>
                          </div>

                          <h3 className="text-[15.5px] font-bold text-[#1D1D1F]">
                            {b.nama_cabang}
                          </h3>
                          <p className="text-[11.5px] text-[#86868B] line-clamp-1 mt-0.5">
                            {b.alamat || b.kota}
                          </p>

                          <div className="mt-4 grid grid-cols-3 rounded-2xl bg-[#F5F5F7] p-2.5 text-center">
                            <div>
                              <p className="text-[9px] font-bold uppercase text-[#86868B]">
                                TOTAL UNIT
                              </p>
                              <p className="text-[15px] font-bold text-[#1D1D1F]">
                                {branchUnits.length}
                              </p>
                            </div>
                            <div className="border-x border-[#D2D2D7]/50">
                              <p className="text-[9px] font-bold uppercase text-[#86868B]">
                                TERSEDIA
                              </p>
                              <p className="text-[15px] font-bold text-[#0071E3]">
                                {availCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold uppercase text-[#86868B]">
                                DISEWA
                              </p>
                              <p className="text-[15px] font-bold text-[#1D1D1F]">
                                {rentedCount}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3.5 pt-2.5 border-t border-[#F5F5F7] flex items-center justify-between text-[11px]">
                          <span
                            className={`font-semibold ${
                              isSelected ? "text-[#0071E3]" : "text-[#86868B]"
                            }`}
                          >
                            {isSelected ? "Cabang Terpilih ✓" : "Pilih Cabang"}
                          </span>

                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBranch(b);
                                setBranchModalOpen(true);
                              }}
                              className="text-[#6E6E73] hover:text-[#0071E3] font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBranch(b)}
                              className="text-[#6E6E73] hover:text-red-600 font-semibold"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Selected Branch Detail Banner */}
              {selectedHubBranch && (
                <div className="apple-card rounded-3xl bg-white p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <span className="inline-flex items-center rounded-full bg-[#E8F2FF] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0071E3]">
                      CABANG AKTIF • {selectedHubBranch.kota.toUpperCase()}
                    </span>
                    <h2 className="text-2xl font-bold text-[#1D1D1F]">
                      {selectedHubBranch.nama_cabang}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-[12px]">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#86868B]">
                          📍 ALAMAT LENGKAP
                        </p>
                        <p className="font-medium text-[#1D1D1F] mt-0.5">
                          {selectedHubBranch.alamat ||
                            `Hub Resmi iRent ${selectedHubBranch.kota}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#86868B]">
                          💬 WHATSAPP ARMADA
                        </p>
                        <p className="font-medium text-[#1D1D1F] mt-0.5">
                          +62 811-6890-8888
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#86868B]">
                          🕒 JAM OPERASIONAL
                        </p>
                        <p className="font-medium text-[#1D1D1F] mt-0.5">
                          Setiap Hari (09:00 – 22:00 WIB)
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingUnit(null);
                      setUnitModalOpen(true);
                    }}
                    className="self-start lg:self-center inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-6 py-3 text-[13px] font-semibold text-white shadow-md shadow-[#0071E3]/25 transition-all"
                  >
                    <span>⊕</span> + Tambah Unit
                  </button>
                </div>
              )}

              {/* Section 3: Inventaris iPhone Terdaftar Table */}
              <div className="apple-card rounded-3xl bg-white overflow-hidden">
                <div className="p-5 border-b border-[#F5F5F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[15.5px] font-bold text-[#1D1D1F]">
                      Inventaris iPhone Terdaftar
                    </h3>
                    <span className="rounded-full bg-[#F5F5F7] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#6E6E73]">
                      {paginatedUnits.length} Ditampilkan dari{" "}
                      {filteredInventoryUnits.length}
                    </span>
                  </div>

                  <div className="relative sm:w-72">
                    <input
                      type="text"
                      value={unitSearch}
                      onChange={(e) => {
                        setUnitSearch(e.target.value);
                        setUnitPage(1);
                      }}
                      placeholder="Cari seri, kapasitas, atau warna..."
                      className="w-full rounded-full bg-[#F5F5F7] px-4 py-2 text-[12px] text-[#1D1D1F] placeholder:text-[#86868B] focus:bg-white focus:border focus:border-[#0071E3] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#F5F5F7] text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                        <th className="py-3.5 px-5">FOTO</th>
                        <th className="py-3.5 px-4">NAMA UNIT</th>
                        <th className="py-3.5 px-4">STORAGE</th>
                        <th className="py-3.5 px-4">WARNA</th>
                        <th className="py-3.5 px-4">BATTERY HEALTH</th>
                        <th className="py-3.5 px-4">STATUS</th>
                        <th className="py-3.5 px-4">HARGA / PROMO</th>
                        <th className="py-3.5 px-4">BADGE</th>
                        <th className="py-3.5 px-5 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F7] text-[12.5px]">
                      {paginatedUnits.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="py-12 text-center text-[#86868B]"
                          >
                            Belum ada unit iPhone pada filter cabang ini.
                          </td>
                        </tr>
                      ) : (
                        paginatedUnits.map((u) => {
                          const isRented = activeRentedIphoneIds.has(u.id);
                          return (
                            <tr
                              key={u.id}
                              className="hover:bg-[#F5F5F7]/50 transition-colors"
                            >
                              <td className="py-3.5 px-5">
                                <div className="h-12 w-12 rounded-xl bg-[#F5F5F7] p-1.5 flex items-center justify-center">
                                  <IphoneVisual
                                    model={u.tipe || u.nama_unit}
                                    colorName={u.warna}
                                    colorHex={u.color_hex}
                                    imageUrl={u.image_url}
                                    variant="card"
                                    className="h-full w-full"
                                  />
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <p className="font-bold text-[#1D1D1F]">
                                  {u.nama_unit}
                                </p>
                                <p className="text-[10.5px] text-[#86868B]">
                                  {u.tipe} •{" "}
                                  {u.branches?.nama_cabang || "Cabang"}
                                </p>
                              </td>

                              <td className="py-3.5 px-4 font-medium text-[#6E6E73]">
                                {u.storage} NVMe
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="inline-flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded-full border border-black/15"
                                    style={{
                                      backgroundColor:
                                        u.color_hex || getColorHex(u.warna),
                                    }}
                                  />
                                  <span className="font-medium text-[#1D1D1F]">
                                    {u.warna}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="font-bold text-[#1D1D1F]">
                                  🔋 {u.battery_health}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                                    isRented
                                      ? "bg-[#E8F2FF] text-[#0071E3]"
                                      : u.status === "aktif"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  ●{" "}
                                  {isRented
                                    ? "Disewa"
                                    : u.status === "aktif"
                                    ? "Tersedia"
                                    : u.status === "perawatan"
                                    ? "Maintenance"
                                    : "Nonaktif"}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                {u.price_per_day ? (
                                  <div>
                                    <p className="font-bold text-[#1D1D1F]">
                                      {formatRupiah(u.price_per_day)}
                                    </p>
                                    {u.discount_percent && (
                                      <span className="rounded bg-[#E8F2FF] px-1.5 py-0.5 text-[10px] font-bold text-[#0071E3]">
                                        Diskon {u.discount_percent}%
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[#86868B]">-</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[10.5px] font-semibold text-[#1D1D1F]">
                                  {u.highlight_badge || "Reguler"}
                                </span>
                              </td>

                              <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUnit(u);
                                      setUnitModalOpen(true);
                                    }}
                                    title="Edit Unit & Varian Harga"
                                    className="rounded-lg bg-[#F5F5F7] hover:bg-[#E8F2FF] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
                                  >
                                    ✎ Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUnit(u)}
                                    title="Hapus Unit"
                                    className="rounded-lg bg-red-50 hover:bg-red-100 px-2.5 py-1.5 text-[11.5px] font-semibold text-red-600 transition-colors"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-4 border-t border-[#F5F5F7] flex items-center justify-between text-[12px] text-[#6E6E73]">
                  <span>
                    Menampilkan {paginatedUnits.length} dari{" "}
                    {filteredInventoryUnits.length} unit terdaftar
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={unitPage <= 1}
                      onClick={() => setUnitPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg bg-[#F5F5F7] px-3 py-1 text-[11.5px] font-semibold text-[#1D1D1F] disabled:opacity-40"
                    >
                      Sebelumnya
                    </button>
                    <span className="rounded-lg bg-[#0071E3] px-3 py-1 text-[11.5px] font-bold text-white">
                      {unitPage}
                    </span>
                    <button
                      type="button"
                      disabled={unitPage >= totalUnitPages}
                      onClick={() =>
                        setUnitPage((p) => Math.min(totalUnitPages, p + 1))
                      }
                      className="rounded-lg bg-[#F5F5F7] px-3 py-1 text-[11.5px] font-semibold text-[#1D1D1F] disabled:opacity-40"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              TAB 3: KATALOG PERANGKAT (Reference Image 7)
             ================================================== */}
          {activeTab === "katalog" && (
            <AdminKatalogTab
              branches={branches}
              iphones={iphones}
              onRefresh={fetchAllAdminData}
              onSelectUnit={(unit) => {
                setEditingUnit(unit);
                setUnitModalOpen(true);
              }}
            />
          )}

          {/* ==================================================
              TAB 4: MANAJEMEN TRANSAKSI (Reference Image 5)
             ================================================== */}
          {activeTab === "transaksi" && (
            <div className="space-y-6">
              {/* Top Header & Branch Pills */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
                  Manajemen Transaksi
                </h1>

                <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-white p-1.5 border border-[#D2D2D7]/60">
                  <button
                    type="button"
                    onClick={() => setTxBranchFilter("all")}
                    className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
                      txBranchFilter === "all"
                        ? "bg-[#0071E3] text-white shadow-2xs"
                        : "text-[#6E6E73] hover:text-[#1D1D1F]"
                    }`}
                  >
                    Semua Cabang
                  </button>
                  {branches.map((b) => {
                    const active = txBranchFilter === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setTxBranchFilter(active ? "all" : b.id)
                        }
                        className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
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

              {/* 4 KPI Cards for Transaksi */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="apple-card rounded-3xl bg-white p-5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold uppercase text-[#86868B]">
                    <span>UNIT SEDANG DISEWA</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3]">
                      📡
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-[#1D1D1F]">
                      {
                        filteredRentals.filter(
                          (r) => r.status_sewa === "sedang_disewa"
                        ).length
                      }
                    </span>
                    <span className="text-[12.5px] text-[#86868B]">
                      Unit Aktif
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-[#F5F5F7] overflow-hidden">
                    <div className="h-full w-3/4 rounded-full bg-[#0071E3]" />
                  </div>
                </div>

                <div className="apple-card rounded-3xl bg-white p-5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold uppercase text-[#86868B]">
                    <span>PENDAPATAN CABANG</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7]">
                      💵
                    </span>
                  </div>
                  <p className="mt-3 text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
                    {formatRupiah(
                      filteredRentals
                        .filter((r) => r.status_sewa !== "dibatalkan")
                        .reduce((s, r) => s + (Number(r.total_bayar) || 0), 0)
                    )}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-emerald-600">
                    ↑ Akumulasi Transaksi Aktif
                  </p>
                </div>

                <div className="apple-card rounded-3xl bg-white p-5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold uppercase text-[#86868B]">
                    <span>JUMLAH TRANSAKSI</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7]">
                      🧾
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-[#1D1D1F]">
                      {filteredRentals.length}
                    </span>
                    <span className="text-[12.5px] text-[#86868B]">
                      Siklus Sewa
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-[#6E6E73]">
                    Terverifikasi KTP / Identitas
                  </p>
                </div>

                <div className="apple-card rounded-3xl bg-white p-5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold uppercase text-[#86868B]">
                    <span>UNIT TERSEDIA</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      ✓
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-[#1D1D1F]">
                      {
                        iphones.filter(
                          (u) =>
                            (txBranchFilter === "all" ||
                              u.branch_id === txBranchFilter) &&
                            u.status === "aktif" &&
                            !activeRentedIphoneIds.has(u.id)
                        ).length
                      }
                    </span>
                    <span className="text-[12.5px] text-[#86868B]">
                      Siap Disewa
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-[#6E6E73]">
                    ● Siap Serah Terima Instan
                  </p>
                </div>
              </div>

              {/* Search, Filter Pills & + Tambah Transaksi Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Cari penyewa, WhatsApp, atau unit..."
                    className="w-64 rounded-full bg-white px-4 py-2.5 text-[12.5px] text-[#1D1D1F] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
                  />

                  <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-white p-1 border border-[#D2D2D7]/60">
                    {[
                      { id: "all", label: "Semua" },
                      { id: "sedang_disewa", label: "Disewa" },
                      { id: "terjadwal", label: "Reservasi" },
                      { id: "overdue", label: "Terlambat" },
                      { id: "selesai", label: "Selesai" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setTxStatusFilter(st.id)}
                        className={`rounded-full px-3.5 py-1 text-[11.5px] font-semibold transition-all ${
                          txStatusFilter === st.id
                            ? "bg-[#0071E3] text-white"
                            : "text-[#6E6E73] hover:text-[#1D1D1F]"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingRental(null);
                    setRentalChatConvId(null);
                    setRentalModalOpen(true);
                  }}
                  className="self-start md:self-auto inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all"
                >
                  <span>+</span> Tambah Transaksi
                </button>
              </div>

              {/* Table: Daftar Sewa Berjalan & Riwayat Transaksi */}
              <div className="apple-card rounded-3xl bg-white overflow-hidden">
                <div className="p-5 border-b border-[#F5F5F7] flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-[#1D1D1F]">
                    ☑️ Daftar Sewa Berjalan &amp; Riwayat Transaksi
                  </h3>
                  <span className="text-[11.5px] text-[#86868B]">
                    Menampilkan {filteredRentals.length} transaksi
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#F5F5F7] text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                        <th className="py-3.5 px-5">CUSTOMER</th>
                        <th className="py-3.5 px-4">UNIT HARDWARE</th>
                        <th className="py-3.5 px-4">DURASI &amp; TAGIHAN</th>
                        <th className="py-3.5 px-4">PICKUP SCHEDULE</th>
                        <th className="py-3.5 px-4">RETURN DUE</th>
                        <th className="py-3.5 px-4">STATUS</th>
                        <th className="py-3.5 px-4">SISA WAKTU</th>
                        <th className="py-3.5 px-5 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F7] text-[12.5px]">
                      {filteredRentals.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-12 text-center text-[#86868B]"
                          >
                            Tidak ada data transaksi yang ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredRentals.map((r) => {
                          const rem = getRentalRemainingInfo(r);
                          return (
                            <tr
                              key={r.id}
                              className="hover:bg-[#F5F5F7]/50 transition-colors"
                            >
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F2FF] text-[11px] font-bold text-[#0071E3]">
                                    {getInitials(
                                      r.customers?.nama || "Customer"
                                    )}
                                  </span>
                                  <div>
                                    <p className="font-bold text-[#1D1D1F]">
                                      {r.customers?.nama || "-"}
                                    </p>
                                    <p className="text-[11px] text-[#86868B]">
                                      {r.customers?.no_whatsapp || "-"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <p className="font-bold text-[#1D1D1F]">
                                  {r.iphones?.nama_unit || "Unit iPhone"}
                                </p>
                                <p className="text-[11px] text-[#86868B]">
                                  {r.iphones?.storage} • {r.iphones?.warna} •{" "}
                                  {r.branches?.kota}
                                </p>
                              </td>

                              <td className="py-4 px-4">
                                <p className="font-bold text-[#1D1D1F]">
                                  {r.price_variants?.nama_varian || "Paket"}
                                </p>
                                <p className="text-[11px] font-semibold text-[#0071E3]">
                                  {formatRupiah(r.total_bayar)} (
                                  {r.status_pembayaran.toUpperCase()})
                                </p>
                              </td>

                              <td className="py-4 px-4 whitespace-nowrap">
                                <p className="font-semibold text-[#1D1D1F]">
                                  {formatShortDateId(r.tanggal_pengambilan)}
                                </p>
                                <p className="text-[11px] text-[#86868B]">
                                  {formatTimeShort(r.jam_pengambilan)}
                                </p>
                              </td>

                              <td className="py-4 px-4 whitespace-nowrap">
                                <p className="font-semibold text-[#1D1D1F]">
                                  {formatShortDateId(r.tanggal_pengembalian)}
                                </p>
                                <p className="text-[11px] text-[#86868B]">
                                  {formatTimeShort(r.jam_pengembalian)}
                                </p>
                              </td>

                              <td className="py-4 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                                    rem.isOverdue
                                      ? "bg-red-50 text-red-600"
                                      : r.status_sewa === "sedang_disewa"
                                      ? "bg-[#E8F2FF] text-[#0071E3]"
                                      : r.status_sewa === "terjadwal"
                                      ? "bg-amber-50 text-amber-700"
                                      : r.status_sewa === "selesai"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  ●{" "}
                                  {rem.isOverdue
                                    ? "Terlambat"
                                    : r.status_sewa === "sedang_disewa"
                                    ? "Disewa"
                                    : r.status_sewa === "terjadwal"
                                    ? "Reservasi"
                                    : r.status_sewa === "selesai"
                                    ? "Selesai"
                                    : "Dibatalkan"}
                                </span>
                              </td>

                              <td className="py-4 px-4">
                                <p
                                  className={`text-[12px] font-bold ${
                                    rem.isOverdue
                                      ? "text-red-600"
                                      : "text-[#1D1D1F]"
                                  }`}
                                >
                                  {rem.label}
                                </p>
                                <p className="text-[10.5px] text-[#86868B]">
                                  {rem.subLabel}
                                </p>
                              </td>

                              <td className="py-4 px-5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRental(r);
                                      setRentalModalOpen(true);
                                    }}
                                    className="rounded-xl bg-[#F5F5F7] hover:bg-[#0071E3] px-3 py-1.5 text-[11.5px] font-semibold text-[#1D1D1F] hover:text-white transition-colors"
                                  >
                                    Detail
                                  </button>
                                  {r.status_sewa === "terjadwal" && (
                                    <button
                                      type="button"
                                      onClick={() => handleCancelRental(r)}
                                      className="rounded-xl bg-red-50 hover:bg-red-100 px-2.5 py-1.5 text-[11px] font-semibold text-red-600"
                                    >
                                      Batal
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section Bottom: Kalender Sewa Visual Unit (Reference Image 5) */}
              <div className="apple-card rounded-3xl bg-white p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
                      📅
                    </span>
                    <div>
                      <h3 className="text-[15.5px] font-bold text-[#1D1D1F]">
                        Kalender Sewa Visual Unit
                      </h3>
                      <p className="text-[11.5px] text-[#86868B]">
                        Okupansi timeline hardware aktif per periode 7 hari
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F2FF] px-3 py-1 text-[10.5px] font-semibold text-[#0071E3]">
                      <span className="h-2 w-2 rounded-full bg-[#0071E3]" />
                      Sedang Berjalan
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-3 py-1 text-[10.5px] font-semibold text-[#6E6E73]">
                      <span className="h-2 w-2 rounded-full bg-[#86868B]" />
                      Reservasi Datang
                    </span>
                    <button
                      type="button"
                      onClick={() => setTimelineStartOffset((o) => o - 7)}
                      className="rounded-lg bg-[#F5F5F7] hover:bg-[#E8F2FF] px-2.5 py-1 text-xs font-bold"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineStartOffset(0)}
                      className="rounded-lg bg-[#F5F5F7] hover:bg-[#E8F2FF] px-2.5 py-1 text-[11px] font-semibold"
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineStartOffset((o) => o + 7)}
                      className="rounded-lg bg-[#F5F5F7] hover:bg-[#E8F2FF] px-2.5 py-1 text-xs font-bold"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[720px] space-y-2.5">
                    {/* Header Row */}
                    <div className="grid grid-cols-8 gap-2 pb-2 border-b border-[#F5F5F7] text-[11px] font-semibold text-[#86868B]">
                      <div>PERANGKAT</div>
                      {timelineDays.map((d) => (
                        <div
                          key={d.dateStr}
                          className={`text-center ${
                            d.isToday ? "font-bold text-[#0071E3]" : ""
                          }`}
                        >
                          {d.label}
                        </div>
                      ))}
                    </div>

                    {/* Rows for Units */}
                    {iphones
                      .filter(
                        (u) =>
                          txBranchFilter === "all" ||
                          u.branch_id === txBranchFilter
                      )
                      .slice(0, 6)
                      .map((u) => {
                        const unitRentals = rentals.filter(
                          (r) =>
                            r.iphone_id === u.id &&
                            r.status_sewa !== "dibatalkan"
                        );
                        return (
                          <div
                            key={u.id}
                            className="grid grid-cols-8 gap-2 items-center py-1.5"
                          >
                            <div className="pr-2">
                              <p className="text-[12px] font-bold text-[#1D1D1F] truncate">
                                {u.nama_unit}
                              </p>
                              <p className="text-[10px] text-[#86868B]">
                                {u.storage} • {u.warna}
                              </p>
                            </div>

                            {timelineDays.map((day) => {
                              const matchingRental = unitRentals.find(
                                (r) =>
                                  r.tanggal_pengambilan <= day.dateStr &&
                                  r.tanggal_pengembalian >= day.dateStr
                              );

                              if (!matchingRental) {
                                return (
                                  <div
                                    key={day.dateStr}
                                    className="h-11 rounded-xl bg-[#F5F5F7]/50"
                                  />
                                );
                              }

                              const isOngoing =
                                matchingRental.status_sewa === "sedang_disewa";

                              return (
                                <div
                                  key={day.dateStr}
                                  onClick={() => {
                                    setEditingRental(matchingRental);
                                    setRentalModalOpen(true);
                                  }}
                                  className={`h-11 rounded-xl px-2.5 py-1 flex flex-col justify-center cursor-pointer transition-transform hover:scale-[1.02] ${
                                    isOngoing
                                      ? "bg-[#0071E3] text-white shadow-2xs"
                                      : "bg-[#E8F2FF] text-[#0071E3] border border-[#0071E3]/30"
                                  }`}
                                >
                                  <p className="text-[10.5px] font-bold truncate">
                                    {matchingRental.customers?.nama || "Sewa"}
                                  </p>
                                  <p
                                    className={`text-[9px] truncate ${
                                      isOngoing
                                        ? "text-white/80"
                                        : "text-[#0071E3]/80"
                                    }`}
                                  >
                                    {matchingRental.jam_pengambilan.slice(0, 5)}{" "}
                                    →{" "}
                                    {matchingRental.jam_pengembalian.slice(
                                      0,
                                      5
                                    )}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              TAB 5: ARUS KAS & LAPORAN KEUANGAN (Image 8)
             ================================================== */}
          {activeTab === "keuangan" && (
            <AdminKeuanganTab
              branches={branches}
              rentals={rentals}
              expenses={expenses}
              onAddExpense={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setExpenseModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {/* ==================================================
              TAB 6: LIVE CHAT & SURVEI PENGUNJUNG
             ================================================== */}
          {activeTab === "live-chat" && (
            <AdminLiveChatTab
              onCreateRentalFromChat={(convId) => {
                setEditingRental(null);
                setRentalChatConvId(convId);
                setRentalModalOpen(true);
              }}
            />
          )}

          {/* ==================================================
              TAB 7: PROFIL ADMIN (Reference Image 10)
             ================================================== */}
          {activeTab === "profil" && (
            <AdminProfilTab
              admin={admin}
              branchesCount={branches.length}
              onProfileUpdated={(updated) => setAdmin(updated)}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>

      {/* ======================================================
          MODALS (CONNECTED DIRECTLY TO BACKEND APIs)
         ====================================================== */}
      <BranchModal
        open={branchModalOpen}
        initialBranch={editingBranch}
        onClose={() => setBranchModalOpen(false)}
        onSaved={() => {
          showToast("✓ Data cabang berhasil disimpan ke database.");
          fetchAllAdminData();
        }}
      />

      <IphoneUnitModal
        open={unitModalOpen}
        initialUnit={editingUnit}
        branches={branches}
        defaultBranchId={
          selectedHubBranchId !== "all" ? selectedHubBranchId : undefined
        }
        existingVariants={priceVariants}
        onClose={() => setUnitModalOpen(false)}
        onSaved={() => {
          showToast("✓ Data unit iPhone & varian harga berhasil disimpan.");
          fetchAllAdminData();
        }}
      />

      <RentalModal
        open={rentalModalOpen}
        initialRental={editingRental}
        branches={branches}
        iphones={iphones}
        priceVariants={priceVariants}
        customers={customers}
        defaultConversationId={rentalChatConvId}
        onClose={() => setRentalModalOpen(false)}
        onSaved={() => {
          showToast("✓ Data transaksi rental berhasil disimpan.");
          fetchAllAdminData();
        }}
      />

      <ExpenseModal
        open={expenseModalOpen}
        initialExpense={editingExpense}
        branches={branches}
        onClose={() => setExpenseModalOpen(false)}
        onSaved={() => {
          showToast("✓ Catatan pengeluaran berhasil disimpan.");
          fetchAllAdminData();
        }}
      />
    </div>
  );
}

export default function AdminConsolePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] p-6">
          <div className="apple-card rounded-3xl bg-white p-10 text-center space-y-3">
            <p className="text-[14px] font-bold text-[#1D1D1F]">
              Memuat Admin Console iRent...
            </p>
          </div>
        </div>
      }
    >
      <AdminConsoleContent />
    </Suspense>
  );
}
