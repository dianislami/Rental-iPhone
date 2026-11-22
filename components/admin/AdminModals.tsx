"use client";

import React, { useEffect, useState } from "react";
import { IphoneVisual } from "@/components/public/IphoneVisual";
import { formatRupiah, getColorHex } from "@/lib/public-data";
import {
  Branch,
  CustomerRecord,
  ExpenseRecord,
  IphoneUnit,
  PriceVariant,
  RentalTransaction,
} from "@/lib/admin-types";

// ======================================================
// 1. MODAL TAMBAH / EDIT CABANG (Reference Image 3)
// ======================================================
interface BranchModalProps {
  open: boolean;
  initialBranch: Branch | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BranchModal({
  open,
  initialBranch,
  onClose,
  onSaved,
}: BranchModalProps) {
  const [namaCabang, setNamaCabang] = useState("");
  const [kota, setKota] = useState("");
  const [alamat, setAlamat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNamaCabang(initialBranch?.nama_cabang || "");
      setKota(initialBranch?.kota || "");
      setAlamat(initialBranch?.alamat || "");
      setError(null);
    }
  }, [open, initialBranch]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!namaCabang.trim() || !kota.trim()) {
      setError("Nama cabang dan kota wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = initialBranch
        ? `/api/branches/${initialBranch.id}`
        : "/api/branches";
      const method = initialBranch ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_cabang: namaCabang.trim(),
          kota: kota.trim(),
          alamat: alamat.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal menyimpan data cabang.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Terjadi kesalahan jaringan saat menyimpan cabang.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-[28px] bg-white p-6 sm:p-8 shadow-2xl border border-[#D2D2D7]/70 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#F5F5F7]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                  {initialBranch ? "Edit Data Cabang" : "Tambah Cabang Baru"}
                </h2>
                <span className="rounded-full bg-[#E8F2FF] px-2.5 py-0.5 text-[10px] font-bold text-[#0071E3]">
                  Aceh Expansion
                </span>
              </div>
              <p className="text-[12px] text-[#6E6E73] mt-0.5">
                Registrasikan outlet atau distribution hub untuk armada rental
                iRent.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3] transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[12.5px] text-red-700">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#0071E3] mb-3">
              🏢 1. INFORMASI CABANG &amp; LOKASI (DATABASE BRANCHES)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Nama Cabang / Distribution Hub{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaCabang}
                  onChange={(e) => setNamaCabang(e.target.value)}
                  placeholder="Contoh: Banda Aceh Flagship / Bireuen Central"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Kota / Wilayah <span className="text-[#0071E3]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kota}
                  onChange={(e) => setKota(e.target.value)}
                  placeholder="Contoh: Banda Aceh"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
              Alamat Lengkap Outlet
            </label>
            <textarea
              rows={3}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Nama jalan, nomor bangunan, gampong/kelurahan, dan patokan landmark terdekat..."
              className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#F5F5F7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] px-5 py-2.5 text-[12.5px] font-semibold text-[#1D1D1F] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 px-6 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all"
            >
              <span>✓</span>
              {saving
                ? "Menyimpan..."
                : initialBranch
                ? "Simpan Perubahan Cabang"
                : "Simpan & Daftarkan Cabang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ======================================================
// 2. MODAL TAMBAH / EDIT UNIT IPHONE & VARIAN HARGA (Image 4)
// ======================================================
interface DraftVariant {
  id?: string;
  nama_varian: string;
  harga: string;
  harga_promo: string;
  promo_start: string;
  promo_end: string;
  badge: string;
  promo_description: string;
  is_active: boolean;
}

interface IphoneUnitModalProps {
  open: boolean;
  initialUnit: IphoneUnit | null;
  branches: Branch[];
  defaultBranchId?: string;
  existingVariants: PriceVariant[];
  onClose: () => void;
  onSaved: () => void;
}

const POPULAR_MODELS = [
  "iPhone 16 Pro Max",
  "iPhone 16 Pro",
  "iPhone 16",
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14 Pro",
  "iPhone 13 Pro Max",
];

const STORAGE_OPTIONS = ["128GB", "256GB", "512GB", "1TB"];

const COLOR_PRESETS = [
  { name: "Desert Titanium", hex: "#C5B49E" },
  { name: "Natural Titanium", hex: "#9A968E" },
  { name: "White Titanium", hex: "#EBECE7" },
  { name: "Black Titanium", hex: "#323130" },
  { name: "Blue Titanium", hex: "#475361" },
  { name: "Ultramarine", hex: "#0071E3" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Space Black", hex: "#2B2B2D" },
];

export function IphoneUnitModal({
  open,
  initialUnit,
  branches,
  defaultBranchId,
  existingVariants,
  onClose,
  onSaved,
}: IphoneUnitModalProps) {
  const [branchId, setBranchId] = useState("");
  const [namaUnit, setNamaUnit] = useState("");
  const [tipe, setTipe] = useState("iPhone 16 Pro");
  const [storage, setStorage] = useState("256GB");
  const [warna, setWarna] = useState("Desert Titanium");
  const [batteryHealth, setBatteryHealth] = useState("100%");
  const [status, setStatus] = useState<"aktif" | "perawatan" | "nonaktif">(
    "aktif"
  );
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  // Price variants state
  const [unitVariants, setUnitVariants] = useState<DraftVariant[]>([]);
  const [newVarName, setNewVarName] = useState("1 Hari (24 Jam)");
  const [newVarHarga, setNewVarHarga] = useState("210000");
  const [newVarPromo, setNewVarPromo] = useState("");
  const [newVarStart, setNewVarStart] = useState("");
  const [newVarEnd, setNewVarEnd] = useState("");
  const [newVarBadge, setNewVarBadge] = useState("");
  const [newVarDesc, setNewVarDesc] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (initialUnit) {
      setBranchId(initialUnit.branch_id);
      setNamaUnit(initialUnit.nama_unit);
      setTipe(initialUnit.tipe);
      setStorage(initialUnit.storage);
      setWarna(initialUnit.warna);
      setBatteryHealth(initialUnit.battery_health);
      setStatus(initialUnit.status);
      setDisplayOrder(initialUnit.display_order || 0);
      setImageUrl(initialUnit.image_url || "");
      setDeskripsi(initialUnit.deskripsi || "");

      const filtered = existingVariants
        .filter((v) => v.iphone_id === initialUnit.id)
        .map((v) => ({
          id: v.id,
          nama_varian: v.nama_varian,
          harga: String(v.harga),
          harga_promo: v.harga_promo ? String(v.harga_promo) : "",
          promo_start: v.promo_start || "",
          promo_end: v.promo_end || "",
          badge: v.badge || "",
          promo_description: v.promo_description || "",
          is_active: v.is_active,
        }));
      setUnitVariants(filtered);
    } else {
      const firstBranch = defaultBranchId || branches[0]?.id || "";
      setBranchId(firstBranch);
      setTipe("iPhone 16 Pro");
      setStorage("256GB");
      setWarna("Desert Titanium");
      setNamaUnit("iPhone 16 Pro 256GB Desert Titanium");
      setBatteryHealth("100%");
      setStatus("aktif");
      setDisplayOrder(0);
      setImageUrl("");
      setDeskripsi(
        "Unit resmi Grade-A terkalibrasi, kamera jernih 4K, dan bebas akun iCloud."
      );
      setUnitVariants([
        {
          nama_varian: "1 Hari",
          harga: "210000",
          harga_promo: "",
          promo_start: "",
          promo_end: "",
          badge: "Paling Populer",
          promo_description: "Sewa 24 Jam Penuh",
          is_active: true,
        },
      ]);
    }
  }, [open, initialUnit, branches, defaultBranchId, existingVariants]);

  if (!open) return null;

  function handleAutoLabel(nextTipe: string, nextStorage: string, nextWarna: string) {
    if (!initialUnit) {
      setNamaUnit(`${nextTipe} ${nextStorage} ${nextWarna}`.trim());
    }
  }

  async function handleAddVariantDraft() {
    const parsedHarga = Number(newVarHarga);
    if (!newVarName.trim() || !Number.isFinite(parsedHarga) || parsedHarga <= 0) {
      setError("Nama varian dan harga normal (> 0) wajib diisi.");
      return;
    }

    const parsedPromo = newVarPromo.trim() ? Number(newVarPromo) : null;
    if (parsedPromo !== null) {
      if (parsedPromo <= 0 || parsedPromo > parsedHarga) {
        setError("Harga promo harus > 0 dan tidak melebihi harga normal.");
        return;
      }
      if (!newVarStart || !newVarEnd) {
        setError(
          "Jika mengisi harga promo, tanggal mulai dan akhir promo wajib diisi."
        );
        return;
      }
    }

    setError(null);

    // If editing an existing unit, save directly to POST /api/price-variants
    if (initialUnit?.id) {
      try {
        const res = await fetch("/api/price-variants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            iphone_id: initialUnit.id,
            nama_varian: newVarName.trim(),
            harga: parsedHarga,
            harga_promo: parsedPromo,
            promo_start: parsedPromo ? newVarStart : null,
            promo_end: parsedPromo ? newVarEnd : null,
            badge: newVarBadge.trim() || null,
            promo_description: newVarDesc.trim() || null,
            is_active: true,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.message || "Gagal menambahkan varian harga.");
          return;
        }
        setUnitVariants((prev) => [
          ...prev,
          {
            id: json.data.id,
            nama_varian: json.data.nama_varian,
            harga: String(json.data.harga),
            harga_promo: json.data.harga_promo
              ? String(json.data.harga_promo)
              : "",
            promo_start: json.data.promo_start || "",
            promo_end: json.data.promo_end || "",
            badge: json.data.badge || "",
            promo_description: json.data.promo_description || "",
            is_active: json.data.is_active,
          },
        ]);
        onSaved();
      } catch {
        setError("Gagal menghubungi server untuk menambah varian harga.");
        return;
      }
    } else {
      // Add to local draft list for new unit creation
      setUnitVariants((prev) => [
        ...prev,
        {
          nama_varian: newVarName.trim(),
          harga: String(parsedHarga),
          harga_promo: parsedPromo ? String(parsedPromo) : "",
          promo_start: parsedPromo ? newVarStart : "",
          promo_end: parsedPromo ? newVarEnd : "",
          badge: newVarBadge.trim(),
          promo_description: newVarDesc.trim(),
          is_active: true,
        },
      ]);
    }

    setNewVarName("");
    setNewVarHarga("");
    setNewVarPromo("");
    setNewVarBadge("");
    setNewVarDesc("");
  }

  async function handleRemoveVariant(idx: number) {
    const target = unitVariants[idx];
    if (!target) return;

    if (target.id) {
      try {
        const res = await fetch(`/api/price-variants/${target.id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.message || "Gagal menghapus varian harga.");
          return;
        }
        onSaved();
      } catch {
        setError("Gagal menghapus varian harga.");
        return;
      }
    }

    setUnitVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !branchId ||
      !namaUnit.trim() ||
      !tipe.trim() ||
      !storage.trim() ||
      !warna.trim() ||
      !batteryHealth.trim()
    ) {
      setError("Seluruh spesifikasi wajib unit iPhone harus dilengkapi.");
      return;
    }

    const formattedBh = batteryHealth.trim().includes("%")
      ? batteryHealth.trim()
      : `${batteryHealth.trim()}%`;

    setSaving(true);
    setError(null);

    try {
      const url = initialUnit
        ? `/api/iphones/${initialUnit.id}`
        : "/api/iphones";
      const method = initialUnit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: branchId,
          nama_unit: namaUnit.trim(),
          tipe: tipe.trim(),
          storage: storage.trim(),
          warna: warna.trim(),
          battery_health: formattedBh,
          status,
          display_order: Number(displayOrder) || 0,
          image_url: imageUrl.trim() || null,
          deskripsi: deskripsi.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal menyimpan unit iPhone.");
        return;
      }

      const savedIphoneId = json.data?.id || initialUnit?.id;

      // If creating a new unit, also create all draft price variants
      if (!initialUnit && savedIphoneId && unitVariants.length > 0) {
        for (const v of unitVariants) {
          const h = Number(v.harga);
          const hp = v.harga_promo ? Number(v.harga_promo) : null;
          if (v.nama_varian.trim() && Number.isFinite(h) && h > 0) {
            await fetch("/api/price-variants", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                iphone_id: savedIphoneId,
                nama_varian: v.nama_varian.trim(),
                harga: h,
                harga_promo: hp,
                promo_start: hp && v.promo_start ? v.promo_start : null,
                promo_end: hp && v.promo_end ? v.promo_end : null,
                badge: v.badge.trim() || null,
                promo_description: v.promo_description.trim() || null,
                is_active: v.is_active,
              }),
            });
          }
        }
      }

      onSaved();
      onClose();
    } catch {
      setError("Terjadi kesalahan saat menyimpan data unit iPhone.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-[28px] bg-white p-6 sm:p-8 shadow-2xl border border-[#D2D2D7]/70 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#F5F5F7]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                  {initialUnit ? "Edit Unit iPhone" : "Tambah Unit iPhone Baru"}
                </h2>
                <span className="rounded-full bg-[#E8F2FF] px-2.5 py-0.5 text-[10px] font-bold text-[#0071E3]">
                  Katalog Database
                </span>
              </div>
              <p className="text-[12px] text-[#6E6E73] mt-0.5">
                Input spesifikasi perangkat, alokasi cabang, varian harga sewa
                dinamis, dan konfigurasi promo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3] transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[12.5px] text-red-700">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* SECTION 01: INFORMASI DASAR UNIT & HARDWARE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8F2FF] text-[11px] font-bold text-[#0071E3]">
                  01
                </span>
                <h3 className="text-[14px] font-bold text-[#1D1D1F]">
                  Informasi Dasar Unit &amp; Hardware
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">
                SPESIFIKASI FISIK
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Alokasi Cabang Showroom{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  required
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] font-medium text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
                >
                  <option value="" disabled>
                    Pilih Cabang...
                  </option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_cabang} ({b.kota})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Nama Unit (Public Label){" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaUnit}
                  onChange={(e) => setNamaUnit(e.target.value)}
                  placeholder="iPhone 16 Pro 256GB Desert Titanium"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Model iPhone Selector */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-2">
                Model / Tipe iPhone <span className="text-[#0071E3]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                {POPULAR_MODELS.slice(0, 6).map((m) => {
                  const active = tipe.toLowerCase() === m.toLowerCase();
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setTipe(m);
                        handleAutoLabel(m, storage, warna);
                      }}
                      className={`rounded-xl py-2.5 px-3 text-[12px] font-semibold transition-all ${
                        active
                          ? "bg-[#0071E3] text-white shadow-xs"
                          : "bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3]"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={tipe}
                onChange={(e) => {
                  setTipe(e.target.value);
                  handleAutoLabel(e.target.value, storage, warna);
                }}
                placeholder="Atau ketik model iPhone lainnya (contoh: iPhone 13 Pro)..."
                className="w-full rounded-xl bg-[#F5F5F7] px-3.5 py-2 text-[12.5px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Storage / Kapasitas NVMe */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-semibold text-[#1D1D1F]">
                  Storage / Kapasitas NVMe{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <span className="text-[10.5px] text-[#86868B]">
                  Standar Penyimpanan Apple
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {STORAGE_OPTIONS.map((st) => {
                  const active =
                    storage.replace(/\s+/g, "").toUpperCase() ===
                    st.replace(/\s+/g, "").toUpperCase();
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setStorage(st);
                        handleAutoLabel(tipe, st, warna);
                      }}
                      className={`rounded-xl py-2.5 text-[12.5px] font-semibold transition-all border ${
                        active
                          ? "border-[#0071E3] bg-[#E8F2FF]/60 text-[#0071E3]"
                          : "border-transparent bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF]/40"
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pilihan Warna Resmi Apple */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-2">
                Pilihan Warna Resmi Apple{" "}
                <span className="text-[#0071E3]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {COLOR_PRESETS.map((c) => {
                  const active = warna.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setWarna(c.name);
                        handleAutoLabel(tipe, storage, c.name);
                      }}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all border ${
                        active
                          ? "border-[#0071E3] bg-white text-[#1D1D1F] shadow-2xs"
                          : "border-transparent bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF]/40"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={warna}
                onChange={(e) => {
                  setWarna(e.target.value);
                  handleAutoLabel(tipe, storage, e.target.value);
                }}
                placeholder="Atau ketik warna lainnya..."
                className="w-full rounded-xl bg-[#F5F5F7] px-3.5 py-2 text-[12.5px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Battery Health, Status, Display Order */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-semibold text-[#1D1D1F]">
                    Battery Health
                  </label>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700">
                    ● Terkalibrasi
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(e.target.value)}
                  placeholder="100%"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] font-semibold text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Status Operasional Unit
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as "aktif" | "perawatan" | "nonaktif"
                    )
                  }
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] font-semibold text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
                >
                  <option value="aktif">Aktif (Tersedia)</option>
                  <option value="perawatan">Perawatan (Maintenance)</option>
                  <option value="nonaktif">Nonaktif (Arsip)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Urutan Tampil (Order)
                </label>
                <input
                  type="number"
                  min={0}
                  value={displayOrder}
                  onChange={(e) =>
                    setDisplayOrder(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] font-semibold text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Foto Unit Studio & Deskripsi */}
            <div className="rounded-2xl bg-[#F5F5F7] p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="h-20 w-20 shrink-0 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#D2D2D7]/60">
                <IphoneVisual
                  model={tipe || namaUnit}
                  colorName={warna}
                  colorHex={getColorHex(warna)}
                  imageUrl={imageUrl || null}
                  variant="card"
                  className="h-full w-full"
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="block text-[12px] font-semibold text-[#1D1D1F]">
                  URL Foto Unit Studio (Opsional — Otomatis Render 3D jika
                  dikosongkan)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... (URL gambar PNG/JPG/WebP)"
                  className="w-full rounded-xl bg-white px-3.5 py-2 text-[12.5px] text-[#1D1D1F] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                Deskripsi Spesifikasi Unit
              </label>
              <textarea
                rows={2}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Deskripsi kondisi unit, kelengkapan kamera, atau catatan khusus..."
                className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[12.5px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 02: STRUKTUR VARIAN HARGA SEWA MULTI-TIER */}
          <div className="pt-5 border-t border-[#F5F5F7] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8F2FF] text-[11px] font-bold text-[#0071E3]">
                  02
                </span>
                <h3 className="text-[14px] font-bold text-[#1D1D1F]">
                  Struktur Varian Harga Sewa Multi-Tier
                </h3>
              </div>
              <span className="text-[10.5px] font-semibold text-[#0071E3]">
                Sinkronisasi Real-Time Katalog
              </span>
            </div>

            {/* Existing / Added Variants List */}
            {unitVariants.length > 0 && (
              <div className="space-y-2">
                {unitVariants.map((v, idx) => (
                  <div
                    key={v.id || idx}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-3 border border-[#D2D2D7]/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-white px-2.5 py-1 text-[12px] font-bold text-[#1D1D1F] shadow-2xs">
                        {v.nama_varian}
                      </span>
                      {v.badge && (
                        <span className="rounded-full bg-[#0071E3] px-2.5 py-0.5 text-[10px] font-bold text-white">
                          {v.badge}
                        </span>
                      )}
                      <span className="text-[13px] font-bold text-[#0071E3]">
                        {formatRupiah(Number(v.harga_promo || v.harga))}
                      </span>
                      {v.harga_promo && (
                        <span className="text-[11px] line-through text-[#86868B]">
                          {formatRupiah(Number(v.harga))}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-[11.5px] font-semibold text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Variant Sub-Form */}
            <div className="rounded-2xl bg-[#F5F5F7]/70 p-4 border border-[#D2D2D7]/60 space-y-3">
              <p className="text-[11.5px] font-bold text-[#1D1D1F]">
                + Tambah Paket Durasi &amp; Harga Sewa
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E73] mb-1">
                    Nama Varian Durasi
                  </label>
                  <input
                    type="text"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="Contoh: 1 Hari / 3 Hari"
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E73] mb-1">
                    Harga Normal (Rp)
                  </label>
                  <input
                    type="number"
                    value={newVarHarga}
                    onChange={(e) => setNewVarHarga(e.target.value)}
                    placeholder="210000"
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E73] mb-1">
                    Badge (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newVarBadge}
                    onChange={(e) => setNewVarBadge(e.target.value)}
                    placeholder="Best Seller / Diskon 15%"
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E73] mb-1">
                    Harga Promo (Opsional)
                  </label>
                  <input
                    type="number"
                    value={newVarPromo}
                    onChange={(e) => setNewVarPromo(e.target.value)}
                    placeholder="Kosongkan jika normal"
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E73] mb-1">
                    Mulai Promo (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={newVarStart}
                    onChange={(e) => setNewVarStart(e.target.value)}
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E73] mb-1">
                    Akhir Promo (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={newVarEnd}
                    onChange={(e) => setNewVarEnd(e.target.value)}
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <input
                  type="text"
                  value={newVarDesc}
                  onChange={(e) => setNewVarDesc(e.target.value)}
                  placeholder="Deskripsi singkat paket (contoh: Paket Liburan Sabang)..."
                  className="flex-1 rounded-xl bg-white px-3 py-2 text-[12px] border border-[#D2D2D7]/70"
                />
                <button
                  type="button"
                  onClick={handleAddVariantDraft}
                  className="shrink-0 rounded-xl bg-[#E8F2FF] hover:bg-[#0071E3] text-[#0071E3] hover:text-white px-4 py-2 text-[12px] font-semibold transition-colors"
                >
                  + Tambahkan Varian
                </button>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-[#F5F5F7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] px-5 py-2.5 text-[12.5px] font-semibold text-[#1D1D1F]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 px-6 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25"
            >
              <span>✓</span>
              {saving
                ? "Menyimpan..."
                : initialUnit
                ? "Simpan Perubahan Unit"
                : "Simpan Unit & Varian"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ======================================================
// 3. MODAL TAMBAH / UPDATE TRANSAKSI SEWA (Image 6)
// ======================================================
interface RentalModalProps {
  open: boolean;
  initialRental: RentalTransaction | null;
  branches: Branch[];
  iphones: IphoneUnit[];
  priceVariants: PriceVariant[];
  customers: CustomerRecord[];
  defaultConversationId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RentalModal({
  open,
  initialRental,
  branches,
  iphones,
  priceVariants,
  customers,
  defaultConversationId,
  onClose,
  onSaved,
}: RentalModalProps) {
  const [namaPelanggan, setNamaPelanggan] = useState("");
  const [noWhatsapp, setNoWhatsapp] = useState("");
  const [jaminan, setJaminan] = useState("");
  const [lokasiPenggunaan, setLokasiPenggunaan] = useState("");

  const [branchId, setBranchId] = useState("");
  const [iphoneId, setIphoneId] = useState("");
  const [priceVariantId, setPriceVariantId] = useState("");

  const [tanggalPengambilan, setTanggalPengambilan] = useState("");
  const [jamPengambilan, setJamPengambilan] = useState("14:00");
  const [tanggalPengembalian, setTanggalPengembalian] = useState("");
  const [jamPengembalian, setJamPengembalian] = useState("14:00");

  const [totalBayar, setTotalBayar] = useState<string>("0");
  const [dp, setDp] = useState<string>("0");
  const [statusSewa, setStatusSewa] = useState<
    "terjadwal" | "sedang_disewa" | "selesai" | "dibatalkan"
  >("terjadwal");
  const [catatan, setCatatan] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    if (initialRental) {
      setNamaPelanggan(initialRental.customers?.nama || "");
      setNoWhatsapp(initialRental.customers?.no_whatsapp || "");
      setJaminan(initialRental.jaminan || "");
      setLokasiPenggunaan(initialRental.lokasi_penggunaan || "");
      setBranchId(initialRental.branch_id);
      setIphoneId(initialRental.iphone_id);
      setPriceVariantId(initialRental.price_variant_id);
      setTanggalPengambilan(initialRental.tanggal_pengambilan);
      setJamPengambilan(
        (initialRental.jam_pengambilan || "14:00").slice(0, 5)
      );
      setTanggalPengembalian(initialRental.tanggal_pengembalian);
      setJamPengembalian(
        (initialRental.jam_pengembalian || "14:00").slice(0, 5)
      );
      setTotalBayar(String(initialRental.total_bayar));
      setDp(String(initialRental.dp));
      setStatusSewa(initialRental.status_sewa);
      setCatatan(initialRental.catatan || "");
    } else {
      const defaultBranch = branches[0]?.id || "";
      const branchUnits = iphones.filter(
        (u) => u.branch_id === defaultBranch && u.status === "aktif"
      );
      const firstUnit = branchUnits[0] || iphones[0] || null;
      const unitVars = firstUnit
        ? priceVariants.filter(
            (v) => v.iphone_id === firstUnit.id && v.is_active
          )
        : [];
      const firstVar = unitVars[0] || null;
      const initialPrice = firstVar
        ? firstVar.harga_promo ?? firstVar.harga
        : 0;

      setNamaPelanggan("");
      setNoWhatsapp("");
      setJaminan("KTP Asli / KTM Mahasiswa");
      setLokasiPenggunaan("Wilayah Aceh");
      setBranchId(firstUnit?.branch_id || defaultBranch);
      setIphoneId(firstUnit?.id || "");
      setPriceVariantId(firstVar?.id || "");
      setTanggalPengambilan(todayStr);
      setJamPengambilan("14:00");
      setTanggalPengembalian(tomorrowStr);
      setJamPengembalian("14:00");
      setTotalBayar(String(initialPrice));
      setDp(String(initialPrice));
      setStatusSewa("terjadwal");
      setCatatan("Kondisi mulus 100%, termasuk kabel USB-C & case pelindung.");
    }
  }, [open, initialRental, branches, iphones, priceVariants]);

  if (!open) return null;

  const availableUnitsForBranch = iphones.filter(
    (u) =>
      (!branchId || u.branch_id === branchId) &&
      (u.status === "aktif" || u.id === initialRental?.iphone_id)
  );

  const variantsForSelectedUnit = priceVariants.filter(
    (v) =>
      v.iphone_id === iphoneId &&
      (v.is_active || v.id === initialRental?.price_variant_id)
  );

  function handleBranchChange(newBranchId: string) {
    setBranchId(newBranchId);
    const unitsInBranch = iphones.filter(
      (u) => u.branch_id === newBranchId && u.status === "aktif"
    );
    const nextUnit = unitsInBranch[0] || null;
    setIphoneId(nextUnit?.id || "");
    if (nextUnit) {
      const vars = priceVariants.filter(
        (v) => v.iphone_id === nextUnit.id && v.is_active
      );
      const v0 = vars[0] || null;
      setPriceVariantId(v0?.id || "");
      if (v0) {
        const price = v0.harga_promo ?? v0.harga;
        setTotalBayar(String(price));
        setDp(String(price));
      }
    } else {
      setPriceVariantId("");
    }
  }

  function handleUnitChange(newUnitId: string) {
    setIphoneId(newUnitId);
    const matchedUnit = iphones.find((u) => u.id === newUnitId);
    if (matchedUnit && matchedUnit.branch_id !== branchId) {
      setBranchId(matchedUnit.branch_id);
    }
    const vars = priceVariants.filter(
      (v) => v.iphone_id === newUnitId && v.is_active
    );
    const v0 = vars[0] || null;
    setPriceVariantId(v0?.id || "");
    if (v0) {
      const price = v0.harga_promo ?? v0.harga;
      setTotalBayar(String(price));
      setDp(String(price));
    }
  }

  function handleVariantSelect(v: PriceVariant) {
    setPriceVariantId(v.id);
    const price = v.harga_promo ?? v.harga;
    setTotalBayar(String(price));
    setDp(String(price));
  }

  const numTotal = Number(totalBayar) || 0;
  const numDp = Number(dp) || 0;
  const sisaBayar = Math.max(0, numTotal - numDp);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchId || !iphoneId || !priceVariantId) {
      setError(
        "Pastikan Cabang, Unit iPhone, dan Varian Paket Sewa telah dipilih."
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (initialRental) {
        // PATCH /api/rentals/[id]
        const res = await fetch(`/api/rentals/${initialRental.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch_id: branchId,
            iphone_id: iphoneId,
            price_variant_id: priceVariantId,
            tanggal_pengambilan: tanggalPengambilan,
            jam_pengambilan: jamPengambilan.slice(0, 5),
            tanggal_pengembalian: tanggalPengembalian,
            jam_pengembalian: jamPengembalian.slice(0, 5),
            total_bayar: numTotal,
            dp: numDp,
            status_sewa: statusSewa,
            lokasi_penggunaan: lokasiPenggunaan.trim() || null,
            jaminan: jaminan.trim() || null,
            catatan: catatan.trim() || null,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.message || "Gagal memperbarui transaksi rental.");
          return;
        }
      } else {
        // POST /api/rentals
        if (!namaPelanggan.trim() || !noWhatsapp.trim()) {
          setError("Nama lengkap dan nomor WhatsApp pelanggan wajib diisi.");
          return;
        }

        const payload: Record<string, unknown> = {
          nama_pelanggan: namaPelanggan.trim(),
          no_whatsapp: noWhatsapp.trim(),
          branch_id: branchId,
          iphone_id: iphoneId,
          price_variant_id: priceVariantId,
          tanggal_pengambilan: tanggalPengambilan,
          jam_pengambilan: jamPengambilan.slice(0, 5),
          tanggal_pengembalian: tanggalPengembalian,
          jam_pengembalian: jamPengembalian.slice(0, 5),
          total_bayar: numTotal,
          dp: numDp,
          lokasi_penggunaan: lokasiPenggunaan.trim() || null,
          jaminan: jaminan.trim() || null,
          catatan: catatan.trim() || null,
        };

        if (defaultConversationId) {
          payload.chat_conversation_id = defaultConversationId;
        }

        const res = await fetch("/api/rentals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.message || "Gagal membuat transaksi penyewaan.");
          return;
        }
      }

      onSaved();
      onClose();
    } catch {
      setError("Terjadi kesalahan jaringan saat menyimpan transaksi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 sm:p-8 shadow-2xl border border-[#D2D2D7]/70 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#F5F5F7]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0071E3] text-white font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                {initialRental
                  ? "Detail & Update Transaksi Sewa"
                  : "Tambah Transaksi Baru"}
              </h2>
              {defaultConversationId && !initialRental && (
                <p className="text-[11px] font-semibold text-[#0071E3]">
                  Terhubung ke Sesi Live Chat #{defaultConversationId.slice(0, 8)}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3]"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[12.5px] text-red-700">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* 1. IDENTITAS & CUSTOMER INFORMATION */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#86868B]">
                1. IDENTITAS &amp; CUSTOMER INFORMATION
              </p>
              {!initialRental && customers.length > 0 && (
                <select
                  onChange={(e) => {
                    const found = customers.find((c) => c.id === e.target.value);
                    if (found) {
                      setNamaPelanggan(found.nama);
                      setNoWhatsapp(found.no_whatsapp);
                    }
                  }}
                  defaultValue=""
                  className="rounded-lg bg-[#E8F2FF] px-2.5 py-1 text-[11px] font-semibold text-[#0071E3] focus:outline-none"
                >
                  <option value="" disabled>
                    Pilih Pelanggan Terdaftar...
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama} ({c.no_whatsapp})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1">
                  Nama Lengkap <span className="text-[#0071E3]">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(initialRental)}
                  value={namaPelanggan}
                  onChange={(e) => setNamaPelanggan(e.target.value)}
                  placeholder="Teuku Raihan Syahputra"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] font-medium text-[#1D1D1F] disabled:opacity-70"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1">
                  Nomor WhatsApp <span className="text-[#0071E3]">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(initialRental)}
                  value={noWhatsapp}
                  onChange={(e) => setNoWhatsapp(e.target.value)}
                  placeholder="+62 812-6901-9921"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] font-medium text-[#1D1D1F] disabled:opacity-70"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1">
                  Jaminan Identitas (KTP / KTM)
                </label>
                <input
                  type="text"
                  value={jaminan}
                  onChange={(e) => setJaminan(e.target.value)}
                  placeholder="KTP Asli - Brankas Cabang Loker #04"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] text-[#1D1D1F]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1">
                  Lokasi Penggunaan
                </label>
                <input
                  type="text"
                  value={lokasiPenggunaan}
                  onChange={(e) => setLokasiPenggunaan(e.target.value)}
                  placeholder="Banda Aceh / Wisata Sabang"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] text-[#1D1D1F]"
                />
              </div>
            </div>
          </div>

          {/* 2. DETAIL UNIT & DURASI SEWA */}
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#86868B] mb-3">
              2. DETAIL UNIT &amp; DURASI SEWA
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1">
                  Cabang Transaksi <span className="text-[#0071E3]">*</span>
                </label>
                <select
                  value={branchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  required
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] font-medium text-[#1D1D1F]"
                >
                  <option value="" disabled>
                    Pilih Cabang...
                  </option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_cabang} ({b.kota})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1">
                  Pilih Unit iPhone <span className="text-[#0071E3]">*</span>
                </label>
                <select
                  value={iphoneId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  required
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] font-medium text-[#1D1D1F]"
                >
                  <option value="" disabled>
                    Pilih Unit iPhone...
                  </option>
                  {availableUnitsForBranch.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama_unit} ({u.storage} - {u.warna})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1.5">
                  Varian Paket Sewa <span className="text-[#0071E3]">*</span>
                </label>
                {variantsForSelectedUnit.length === 0 ? (
                  <p className="rounded-xl bg-amber-50 p-2.5 text-[11.5px] text-amber-800">
                    Unit ini belum memiliki varian harga aktif. Tambahkan varian
                    harga di menu Cabang &amp; Unit terlebih dahulu.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {variantsForSelectedUnit.map((v) => {
                      const active = priceVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleVariantSelect(v)}
                          className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-all ${
                            active
                              ? "bg-[#0071E3] text-white shadow-xs"
                              : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8F2FF]"
                          }`}
                        >
                          {v.nama_varian} (
                          {formatRupiah(v.harga_promo ?? v.harga)})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1.5">
                  Jadwal Pengambilan &amp; Pengembalian
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <input
                      type="date"
                      required
                      value={tanggalPengambilan}
                      onChange={(e) => setTanggalPengambilan(e.target.value)}
                      className="w-full rounded-xl bg-[#F5F5F7] px-3 py-2 text-[12px] font-medium"
                    />
                    <input
                      type="time"
                      required
                      value={jamPengambilan}
                      onChange={(e) => setJamPengambilan(e.target.value)}
                      className="w-full rounded-xl bg-[#F5F5F7] px-3 py-1.5 text-[12px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="date"
                      required
                      value={tanggalPengembalian}
                      onChange={(e) => setTanggalPengembalian(e.target.value)}
                      className="w-full rounded-xl bg-[#F5F5F7] px-3 py-2 text-[12px] font-medium"
                    />
                    <input
                      type="time"
                      required
                      value={jamPengembalian}
                      onChange={(e) => setJamPengembalian(e.target.value)}
                      className="w-full rounded-xl bg-[#F5F5F7] px-3 py-1.5 text-[12px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. RINCIAN FINANSIAL & PEMBAYARAN */}
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#86868B] mb-2.5">
              3. RINCIAN FINANSIAL &amp; PEMBAYARAN
            </p>

            <div className="rounded-2xl bg-[#F5F5F7] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#6E6E73]">
                  Total Harga Sewa
                </span>
                <span className="text-[16px] font-bold text-[#0071E3]">
                  {formatRupiah(numTotal)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10.5px] font-semibold text-[#6E6E73] mb-1">
                    Total Bayar (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={totalBayar}
                    onChange={(e) => setTotalBayar(e.target.value)}
                    className="w-full rounded-xl bg-white px-3 py-2 text-[13px] font-bold text-[#1D1D1F] border border-[#D2D2D7]/70"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-[#6E6E73] mb-1">
                    DP / Uang Masuk (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={numTotal}
                    required
                    value={dp}
                    onChange={(e) => setDp(e.target.value)}
                    className="w-full rounded-xl bg-white px-3 py-2 text-[13px] font-bold text-[#0071E3] border border-[#D2D2D7]/70"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-[#6E6E73] mb-1">
                    Sisa Pembayaran
                  </label>
                  <div className="w-full rounded-xl bg-[#EBEBEF] px-3 py-2 text-[13px] font-semibold text-[#6E6E73]">
                    {formatRupiah(sisaBayar)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. STATUS SEWA (WHEN EDITING) & CATATAN */}
          <div className="space-y-3">
            {initialRental && (
              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1.5">
                  Update Status Sewa
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: "terjadwal", label: "Terjadwal" },
                      { id: "sedang_disewa", label: "Sedang Disewa" },
                      { id: "selesai", label: "Selesai" },
                      { id: "dibatalkan", label: "Dibatalkan" },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusSewa(st.id)}
                      className={`rounded-xl py-2 text-[12px] font-semibold transition-all ${
                        statusSewa === st.id
                          ? "bg-[#0071E3] text-white shadow-xs"
                          : "bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF]"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-widest text-[#86868B] mb-1.5">
                4. CATATAN &amp; INSPEKSI FISIK AWAL
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Kondisi mulus 100%, battery health 100%, include pouch original & kabel type C."
                className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[12.5px] text-[#1D1D1F]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#F5F5F7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] px-5 py-2.5 text-[12.5px] font-semibold text-[#1D1D1F]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 px-6 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25"
            >
              {saving
                ? "Menyimpan..."
                : initialRental
                ? "Perbarui Transaksi"
                : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ======================================================
// 4. MODAL INPUT / EDIT PENGELUARAN BARU (Image 9)
// ======================================================
interface ExpenseModalProps {
  open: boolean;
  initialExpense: ExpenseRecord | null;
  branches: Branch[];
  onClose: () => void;
  onSaved: () => void;
}

const EXPENSE_CATEGORIES = [
  { id: "Sparepart & Reparasi", icon: "🔧" },
  { id: "Aksesoris & Packaging", icon: "📦" },
  { id: "Utilitas & Internet", icon: "🛜" },
  { id: "Konsumsi & Rutin", icon: "☕" },
];

export function ExpenseModal({
  open,
  initialExpense,
  branches,
  onClose,
  onSaved,
}: ExpenseModalProps) {
  const [tanggal, setTanggal] = useState("");
  const [branchId, setBranchId] = useState("");
  const [kategori, setKategori] = useState("Sparepart & Reparasi");
  const [deskripsi, setDeskripsi] = useState("");
  const [nominal, setNominal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (initialExpense) {
      setTanggal(initialExpense.tanggal);
      setBranchId(initialExpense.branch_id);
      setNominal(String(initialExpense.nominal));

      const rawKet = initialExpense.keterangan || "";
      const match = rawKet.match(/^\[(.*?)\]\s*(.*)$/);
      if (match) {
        setKategori(match[1]);
        setDeskripsi(match[2]);
      } else {
        setDeskripsi(rawKet);
      }
    } else {
      setTanggal(new Date().toISOString().slice(0, 10));
      setBranchId(branches[0]?.id || "");
      setKategori("Sparepart & Reparasi");
      setDeskripsi("");
      setNominal("");
    }
  }, [open, initialExpense, branches]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numNominal = Number(nominal);
    if (!branchId || !tanggal || !Number.isFinite(numNominal) || numNominal <= 0) {
      setError("Cabang, tanggal, dan nominal (> 0) wajib diisi.");
      return;
    }

    const combinedKeterangan = deskripsi.trim()
      ? `[${kategori}] ${deskripsi.trim()}`
      : `[${kategori}] Pengeluaran Operasional`;

    setSaving(true);
    setError(null);

    try {
      const url = initialExpense
        ? `/api/expenses/${initialExpense.id}`
        : "/api/expenses";
      const method = initialExpense ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: branchId,
          tanggal,
          nominal: numNominal,
          keterangan: combinedKeterangan,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal menyimpan data pengeluaran.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Terjadi kesalahan jaringan saat menyimpan pengeluaran.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-[28px] bg-white p-6 sm:p-8 shadow-2xl border border-[#D2D2D7]/70 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#F5F5F7]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3] text-xl">
              🧾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                  {initialExpense
                    ? "Edit Pengeluaran Operasional"
                    : "Input Pengeluaran Baru"}
                </h2>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600">
                  Debit Kas (-Rp)
                </span>
              </div>
              <p className="text-[12px] text-[#6E6E73] mt-0.5">
                Pencatatan manual beban operasional cabang yang akan langsung
                mengurangi saldo kas konsolidasi.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3]"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[12.5px] text-red-700">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#86868B] mb-3">
              01 • DETAIL TRANSAKSI CABANG
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] font-medium text-[#1D1D1F]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Cabang / Outlet Beban
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  required
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] font-medium text-[#1D1D1F]"
                >
                  <option value="" disabled>
                    Pilih Cabang...
                  </option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_cabang} ({b.kota})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Kategori Beban Operasional */}
          <div>
            <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-2">
              Kategori Beban Operasional
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {EXPENSE_CATEGORIES.map((cat) => {
                const active = kategori === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setKategori(cat.id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center transition-all border ${
                      active
                        ? "border-[#0071E3] bg-[#E8F2FF]/60 text-[#0071E3] font-bold shadow-2xs"
                        : "border-transparent bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF]/30"
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-[11px] leading-tight">{cat.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 02 Nominal & Deskripsi */}
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#86868B] mb-3">
              02 • NOMINAL &amp; KETERANGANPENGELUARAN
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Deskripsi Pengeluaran
                </label>
                <input
                  type="text"
                  required
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Contoh: Restock 50x Tempered Glass 9H & Box Pengiriman Unit"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-semibold text-[#1D1D1F]">
                    Nominal Pengeluaran (IDR)
                  </label>
                  <span className="text-[10.5px] font-semibold text-red-600">
                    ● Mengurangi Saldo Kas
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[#1D1D1F]">
                    - Rp
                  </span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value)}
                    placeholder="1250000"
                    className="w-full rounded-2xl bg-[#F5F5F7] pl-14 pr-4 py-3.5 text-[17px] font-bold text-[#1D1D1F]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#F5F5F7] flex items-center justify-between gap-3">
            <span className="text-[11px] text-[#86868B]">
              🛡️ Enkripsi Jurnal Terlindungi
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] px-5 py-2.5 text-[12.5px] font-semibold text-[#1D1D1F]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 px-6 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25"
              >
                <span>✓</span>
                {saving ? "Menyimpan..." : "Simpan Pengeluaran"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
