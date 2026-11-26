"use client";

import React, { useEffect, useRef, useState } from "react";
import { IphoneVisual } from "@/components/public/IphoneVisual";
import { AdminDropdown } from "@/components/ui/AdminDropdown";
import {
  AlertTriangleIcon,
  BatteryIcon,
  BuildingIcon,
  CameraIcon,
  CheckIcon,
  ClipboardListIcon,
  CoffeeIcon,
  EyeIcon,
  MapPinIcon,
  PackageIcon,
  PlusIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  StoreIcon,
  TrashIcon,
  UserIcon,
  WifiIcon,
  WrenchIcon,
} from "@/components/ui/Icons";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-5 overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xl max-h-[88vh] flex flex-col rounded-[28px] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-[#D2D2D7]/70 overflow-hidden"
      >
        {/* FIXED HEADER */}
        <div className="shrink-0 px-6 sm:px-8 pt-5 sm:pt-6 pb-4 bg-white border-b border-[#F5F5F7] flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
              <StoreIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                  {initialBranch ? "Edit Data Cabang" : "Tambah Cabang Baru"}
                </h2>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[12.5px] text-red-700">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <p className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-[#0071E3] mb-3">
              <BuildingIcon className="h-3.5 w-3.5" />
              <span>1. INFORMASI CABANG &amp; LOKASI (DATABASE BRANCHES)</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Nama Cabang{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaCabang}
                  onChange={(e) => setNamaCabang(e.target.value)}
                  placeholder="Contoh: Banda Aceh Flagship / Bireuen Central"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
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
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
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
              className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="shrink-0 px-6 sm:px-8 py-4 bg-white border-t border-[#F5F5F7] flex items-center justify-end gap-3 z-10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] px-5 py-2.5 text-[12.5px] font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 px-6 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all cursor-pointer"
          >
            <CheckIcon className="h-3.5 w-3.5" />
            <span>
              {saving
                ? "Menyimpan..."
                : initialBranch
                ? "Simpan Perubahan Cabang"
                : "Simpan & Daftarkan Cabang"}
            </span>
          </button>
        </div>
      </form>
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
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setUploadedFileName(
        initialUnit.image_url ? "foto-unit-tersimpan.png" : ""
      );
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
      setUploadedFileName("");
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

  function handleAutoLabel(
    nextTipe: string,
    nextStorage: string,
    nextWarna: string
  ) {
    if (!initialUnit) {
      setNamaUnit(`${nextTipe} ${nextStorage} ${nextWarna}`.trim());
    }
  }

  function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Format file harus berupa gambar (JPG, JPEG, PNG, atau WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 10MB.");
      return;
    }

    setUploadingImage(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setUploadingImage(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const mime =
            file.type === "image/png" || file.type === "image/webp"
              ? file.type
              : "image/jpeg";
          const compressedDataUrl = canvas.toDataURL(
            mime,
            mime === "image/png" ? undefined : 0.86
          );
          setImageUrl(compressedDataUrl);
        } else {
          setImageUrl(result);
        }
        setUploadedFileName(file.name);
        setUploadingImage(false);
      };
      img.onerror = () => {
        setImageUrl(result);
        setUploadedFileName(file.name);
        setUploadingImage(false);
      };
      img.src = result;
    };
    reader.onerror = () => {
      setError("Gagal membaca file foto yang dipilih.");
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-5 overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-[28px] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-[#D2D2D7]/70 overflow-hidden"
      >
        {/* FIXED HEADER */}
        <div className="shrink-0 px-6 sm:px-8 pt-5 sm:pt-6 pb-4 bg-white border-b border-[#F5F5F7] flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
              <SmartphoneIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                  {initialUnit ? "Edit Unit iPhone" : "Tambah Unit iPhone Baru"}
                </h2>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[12.5px] text-red-700">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 01: INFORMASI DASAR UNIT & HARDWARE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8F2FF] text-[11px] font-bold text-[#0071E3]">
                  01
                </span>
                <h3 className="text-[14px] font-bold text-[#1D1D1F]">
                  Informasi Unit 
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Alokasi Cabang{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <AdminDropdown
                  variant="field"
                  value={branchId}
                  onChange={(val) => setBranchId(val)}
                  placeholder="Pilih Cabang..."
                  icon={<StoreIcon className="h-4 w-4" />}
                  options={branches.map((b) => ({
                    value: b.id,
                    label: `${b.nama_cabang} (${b.kota})`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Nama Unit{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaUnit}
                  onChange={(e) => setNamaUnit(e.target.value)}
                  placeholder="iPhone 16 Pro 256GB Desert Titanium"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Model / Tipe iPhone (Input Manual) */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                Model / Tipe iPhone <span className="text-[#0071E3]">*</span>
              </label>
              <input
                type="text"
                required
                value={tipe}
                onChange={(e) => {
                  setTipe(e.target.value);
                  handleAutoLabel(e.target.value, storage, warna);
                }}
                placeholder="Ketik model / tipe iPhone (contoh: iPhone 16 Pro / iPhone 15 Pro Max)..."
                className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
              />
            </div>

            {/* Storage / Kapasitas NVMe */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-semibold text-[#1D1D1F]">
                  Storage / Kapasitas NVMe{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
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
                      className={`rounded-xl py-2.5 text-[12.5px] font-semibold transition-all border cursor-pointer ${
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
                Warna Unit{" "}
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
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all border cursor-pointer ${
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
                className="w-full rounded-xl bg-[#F5F5F7] px-3.5 py-2 text-[12.5px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
              />
            </div>

            {/* Battery Health, Status, Display Order */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-semibold text-[#1D1D1F]">
                    Battery Health
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(e.target.value)}
                  placeholder="100%"
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] font-semibold text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Status Operasional Unit
                </label>
                <AdminDropdown
                  variant="field"
                  value={status}
                  onChange={(val) =>
                    setStatus(val as "aktif" | "perawatan" | "nonaktif")
                  }
                  options={[
                    { value: "aktif", label: "Aktif (Tersedia)" },
                    { value: "perawatan", label: "Perawatan (Maintenance)" },
                    { value: "nonaktif", label: "Nonaktif (Arsip)" },
                  ]}
                />
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
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] font-semibold text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Foto Unit Studio (Upload File Gambar / Otomatis Gambar Default) */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                Foto Unit (Opsional)
              </label>
              <div className="rounded-2xl bg-[#F5F5F7] p-4 flex flex-col sm:flex-row items-center gap-4 border border-[#D2D2D7]/50">
                <div className="h-24 w-24 shrink-0 rounded-2xl bg-white p-2.5 flex items-center justify-center border border-[#D2D2D7]/60 shadow-2xs">
                  <IphoneVisual
                    model={tipe || namaUnit}
                    colorName={warna}
                    colorHex={getColorHex(warna)}
                    imageUrl={imageUrl || null}
                    variant="card"
                    className="h-full w-full"
                  />
                </div>

                <div className="flex-1 w-full space-y-2.5 text-center sm:text-left">
                  <div>
                    <p className="text-[13px] font-bold text-[#1D1D1F] truncate">
                      {imageUrl
                        ? uploadedFileName || "Foto Unit Kustom Terpasang"
                        : "Gambar Default Otomatis"}
                    </p>
                    <p className="text-[11.5px] text-[#6E6E73] mt-0.5">
                      {imageUrl
                        ? "Foto kustom akan ditampilkan di katalog. Hapus foto jika ingin kembali ke gambar default."
                        : "Jika tidak mengupload foto, unit otomatis menggunakan gambar iPhone default sesuai tipe & warna."}
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-[#E8F2FF] border border-[#D2D2D7]/80 hover:border-[#0071E3]/40 px-3.5 py-2 text-[12px] font-semibold text-[#0071E3] shadow-2xs transition-all cursor-pointer"
                    >
                      <CameraIcon className="h-3.5 w-3.5 text-[#0071E3]" />
                      <span>
                        {uploadingImage
                          ? "Memproses Foto..."
                          : imageUrl
                          ? "Ganti Foto"
                          : "Upload Foto"}
                      </span>
                    </button>

                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl("");
                          setUploadedFileName("");
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-red-50 border border-[#D2D2D7]/80 hover:border-red-200 px-3.5 py-2 text-[12px] font-semibold text-red-600 transition-all cursor-pointer"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}

                    <span className="text-[11px] text-[#86868B]">
                      Format: JPG, JPEG, PNG, WEBP (Maks. 10MB)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                Deskripsi Unit
              </label>
              <textarea
                rows={2}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Deskripsi kondisi unit, kelengkapan kamera, atau catatan khusus..."
                className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[12.5px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
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
                  Harga Sewa
                </h3>
              </div>
            </div>

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
                      className="inline-flex items-center gap-1 rounded-lg bg-white hover:bg-red-50 px-2.5 py-1 text-[11.5px] font-semibold text-red-600 border border-[#D2D2D7]/60 hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      <span>Hapus</span>
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-[12.5px] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <input
                  type="text"
                  value={newVarDesc}
                  onChange={(e) => setNewVarDesc(e.target.value)}
                  placeholder="Deskripsi singkat paket (contoh: Paket Liburan Sabang)..."
                  className="flex-1 rounded-xl bg-white px-3 py-2 text-[12px] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddVariantDraft}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#E8F2FF] hover:bg-[#0071E3] text-[#0071E3] hover:text-white px-4 py-2 text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  <span>Tambahkan Varian</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="shrink-0 px-6 sm:px-8 py-4 bg-white border-t border-[#F5F5F7] flex items-center justify-end gap-3 z-10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] px-5 py-2.5 text-[12.5px] font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 px-6 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all cursor-pointer"
          >
            <CheckIcon className="h-3.5 w-3.5" />
            <span>
              {saving
                ? "Menyimpan..."
                : initialUnit
                ? "Simpan Perubahan Unit"
                : "Simpan Unit & Varian"}
            </span>
          </button>
        </div>
      </form>
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
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
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
    setSelectedCustomerId("");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-5 overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-[28px] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-[#D2D2D7]/70 overflow-hidden"
      >
        {/* FIXED HEADER */}
        <div className="shrink-0 px-6 sm:px-8 pt-5 sm:pt-6 pb-4 bg-white border-b border-[#F5F5F7] flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
              <ClipboardListIcon className="h-6 w-6" />
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
            aria-label="Tutup modal"
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[12.5px] text-red-700">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. IDENTITAS & CUSTOMER INFORMATION */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#86868B]">
                1. IDENTITAS CUSTOMER
              </p>
              {!initialRental && customers.length > 0 && (
                <AdminDropdown
                  variant="compact"
                  align="right"
                  value={selectedCustomerId}
                  placeholder="Pilih Pelanggan Terdaftar..."
                  icon={<UserIcon className="h-3.5 w-3.5" />}
                  onChange={(val) => {
                    setSelectedCustomerId(val);
                    const found = customers.find((c) => c.id === val);
                    if (found) {
                      setNamaPelanggan(found.nama);
                      setNoWhatsapp(found.no_whatsapp);
                    }
                  }}
                  options={customers.map((c) => ({
                    value: c.id,
                    label: c.nama,
                    sublabel: c.no_whatsapp,
                  }))}
                />
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
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] font-medium text-[#1D1D1F] disabled:opacity-70 border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
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
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] font-medium text-[#1D1D1F] disabled:opacity-70 border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
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
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
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
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[13px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
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
                <AdminDropdown
                  variant="field"
                  value={branchId}
                  onChange={handleBranchChange}
                  placeholder="Pilih Cabang..."
                  icon={<StoreIcon className="h-4 w-4" />}
                  options={branches.map((b) => ({
                    value: b.id,
                    label: `${b.nama_cabang} (${b.kota})`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#1D1D1F] mb-1">
                  Pilih Unit iPhone <span className="text-[#0071E3]">*</span>
                </label>
                <AdminDropdown
                  variant="field"
                  value={iphoneId}
                  onChange={handleUnitChange}
                  placeholder="Pilih Unit iPhone..."
                  icon={<SmartphoneIcon className="h-4 w-4" />}
                  options={availableUnitsForBranch.map((u) => ({
                    value: u.id,
                    label: u.nama_unit,
                    sublabel: `${u.storage} • ${u.warna}`,
                  }))}
                />
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
                          className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-all cursor-pointer ${
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
                      className="w-full rounded-xl bg-[#F5F5F7] px-3 py-2 text-[12px] font-medium border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
                    />
                    <input
                      type="time"
                      required
                      value={jamPengambilan}
                      onChange={(e) => setJamPengambilan(e.target.value)}
                      className="w-full rounded-xl bg-[#F5F5F7] px-3 py-1.5 text-[12px] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="date"
                      required
                      value={tanggalPengembalian}
                      onChange={(e) => setTanggalPengembalian(e.target.value)}
                      className="w-full rounded-xl bg-[#F5F5F7] px-3 py-2 text-[12px] font-medium border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
                    />
                    <input
                      type="time"
                      required
                      value={jamPengembalian}
                      onChange={(e) => setJamPengembalian(e.target.value)}
                      className="w-full rounded-xl bg-[#F5F5F7] px-3 py-1.5 text-[12px] border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. RINCIAN FINANSIAL & PEMBAYARAN */}
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#86868B] mb-2.5">
              3. DETAIL PEMBAYARAN
            </p>

            <div className="rounded-2xl bg-[#F5F5F7] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#0071E3]">
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-[13px] font-bold text-[#1D1D1F] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-[13px] font-bold text-[#0071E3] border border-[#D2D2D7]/70 focus:border-[#0071E3] focus:outline-none"
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
                      className={`rounded-xl py-2 text-[12px] font-semibold transition-all cursor-pointer ${
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
                4. CATATAN
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Kondisi mulus 100%, battery health 100%, include pouch original & kabel type C."
                className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-2.5 text-[12.5px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="shrink-0 px-6 sm:px-8 py-4 bg-white border-t border-[#F5F5F7] flex items-center justify-end gap-3 z-10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] px-5 py-2.5 text-[12.5px] font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 px-6 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all cursor-pointer"
          >
            <CheckIcon className="h-3.5 w-3.5" />
            <span>
              {saving
                ? "Menyimpan..."
                : initialRental
                ? "Perbarui Transaksi"
                : "Simpan Transaksi"}
            </span>
          </button>
        </div>
      </form>
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
  { id: "Sparepart & Reparasi", icon: <WrenchIcon className="h-4.5 w-4.5" /> },
  {
    id: "Aksesoris & Packaging",
    icon: <PackageIcon className="h-4.5 w-4.5" />,
  },
  { id: "Utilitas & Internet", icon: <WifiIcon className="h-4.5 w-4.5" /> },
  { id: "Konsumsi & Rutin", icon: <CoffeeIcon className="h-4.5 w-4.5" /> },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-5 overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xl max-h-[88vh] flex flex-col rounded-[28px] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-[#D2D2D7]/70 overflow-hidden"
      >
        {/* FIXED HEADER */}
        <div className="shrink-0 px-6 sm:px-8 pt-5 sm:pt-6 pb-4 bg-white border-b border-[#F5F5F7] flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
              <ReceiptIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                  {initialExpense
                    ? "Edit Pengeluaran Operasional"
                    : "Input Pengeluaran Baru"}
                </h2>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[12.5px] text-red-700">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] font-medium text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
                  Cabang
                </label>
                <AdminDropdown
                  variant="field"
                  value={branchId}
                  onChange={(val) => setBranchId(val)}
                  placeholder="Pilih Cabang..."
                  icon={<StoreIcon className="h-4 w-4" />}
                  options={branches.map((b) => ({
                    value: b.id,
                    label: `${b.nama_cabang} (${b.kota})`,
                  }))}
                />
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
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center transition-all border cursor-pointer ${
                      active
                        ? "border-[#0071E3] bg-[#E8F2FF] text-[#0071E3] font-bold shadow-2xs"
                        : "border-transparent bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8F2FF]/50"
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F2FF] text-[#0071E3]">
                      {cat.icon}
                    </span>
                    <span className="text-[11px] leading-tight">{cat.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 02 Nominal & Deskripsi */}
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#86868B] mb-3">
              02 • NOMINAL &amp; KETERANGAN PENGELUARAN
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
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
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
                    className="w-full rounded-2xl bg-[#F5F5F7] pl-14 pr-4 py-3.5 text-[17px] font-bold text-[#1D1D1F] border border-transparent focus:border-[#0071E3] focus:bg-white focus:ring-3 focus:ring-[#0071E3]/10 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="shrink-0 px-6 sm:px-8 py-4 bg-white border-t border-[#F5F5F7] flex items-center justify-end gap-3 z-10">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] px-5 py-2.5 text-[12.5px] font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 px-6 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all cursor-pointer"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              <span>{saving ? "Menyimpan..." : "Simpan Pengeluaran"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ======================================================
// 5. MODAL DETAIL KATALOG PERANGKAT (READ-ONLY / VIEW ONLY)
// ======================================================
interface IphoneCatalogDetailModalProps {
  open: boolean;
  unit: IphoneUnit | null;
  variants: PriceVariant[];
  onClose: () => void;
}

export function IphoneCatalogDetailModal({
  open,
  unit,
  variants,
  onClose,
}: IphoneCatalogDetailModalProps) {
  if (!open || !unit) return null;

  const unitVariants = variants.filter(
    (v) => v.iphone_id === unit.id && v.is_active
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-5 overflow-hidden">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-[28px] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-[#D2D2D7]/70 overflow-hidden">
        {/* FIXED HEADER */}
        <div className="shrink-0 px-6 sm:px-8 pt-5 sm:pt-6 pb-4 bg-white border-b border-[#F5F5F7] flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
              <EyeIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                  Detail Unit Katalog
                </h2>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8F2FF] hover:text-[#0071E3] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE BODY (PURE READ-ONLY) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-5 space-y-6">
          {/* Top Product Hero Preview */}
          <div className="rounded-3xl bg-[#F5F5F7] p-5 flex flex-col sm:flex-row items-center gap-6 border border-[#D2D2D7]/50">
            <div className="h-44 w-44 shrink-0 rounded-2xl bg-white p-4 flex items-center justify-center border border-[#D2D2D7]/60 shadow-2xs">
              <IphoneVisual
                model={unit.tipe || unit.nama_unit}
                colorName={unit.warna}
                colorHex={unit.color_hex || getColorHex(unit.warna)}
                imageUrl={unit.image_url}
                variant="detail"
                className="h-full w-full"
              />
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#0071E3] shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]" />
                  {unit.status === "aktif"
                    ? "Tersedia Hari Ini"
                    : unit.status === "perawatan"
                    ? "Sedang Perawatan"
                    : "Nonaktif"}
                </span>
                {unit.highlight_badge && (
                  <span className="rounded-full bg-[#0071E3] px-3 py-1 text-[10.5px] font-bold text-white">
                    {unit.highlight_badge}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1D1D1F]">
                  {unit.nama_unit}
                </h3>
                <p className="inline-flex items-center gap-1.5 text-[12.5px] text-[#6E6E73] mt-1">
                  <MapPinIcon className="h-3.5 w-3.5 text-[#0071E3]" />
                  <span>
                    {unit.branches?.nama_cabang || "Cabang Resmi"} (
                    {unit.branches?.kota || "Aceh"})
                  </span>
                </p>
              </div>

              {unit.deskripsi && (
                <p className="text-[12.5px] leading-relaxed text-[#6E6E73]">
                  {unit.deskripsi}
                </p>
              )}
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0071E3] mb-3">
              SPESIFIKASI PERANGKAT
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-[#F5F5F7] p-3.5">
                <p className="text-[10px] font-bold uppercase text-[#86868B]">
                  MODEL / TIPE
                </p>
                <p className="mt-1 text-[13.5px] font-bold text-[#1D1D1F]">
                  {unit.tipe}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F5F5F7] p-3.5">
                <p className="text-[10px] font-bold uppercase text-[#86868B]">
                  KAPASITAS
                </p>
                <p className="mt-1 text-[13.5px] font-bold text-[#1D1D1F]">
                  {unit.storage}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F5F5F7] p-3.5">
                <p className="text-[10px] font-bold uppercase text-[#86868B]">
                  WARNA UNIT
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-black/15"
                    style={{
                      backgroundColor:
                        unit.color_hex || getColorHex(unit.warna),
                    }}
                  />
                  <p className="text-[13.5px] font-bold text-[#1D1D1F] truncate">
                    {unit.warna}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F5F5F7] p-3.5">
                <p className="text-[10px] font-bold uppercase text-[#86868B]">
                  BATTERY HEALTH
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#1D1D1F]">
                  <BatteryIcon className="h-4 w-4 text-[#0071E3]" />
                  <span>{unit.battery_health}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Price Variants Read-Only List */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0071E3] mb-3">
              PAKET DURASI &amp; HARGA SEWA ({unitVariants.length} PAKET)
            </p>
            {unitVariants.length === 0 ? (
              <div className="rounded-2xl bg-[#F5F5F7] p-4 text-center text-[12.5px] text-[#86868B]">
                Belum ada paket varian harga yang diatur untuk unit ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unitVariants.map((v) => {
                  const hasPromo =
                    v.harga_promo !== null &&
                    v.harga_promo > 0 &&
                    v.harga_promo < v.harga;
                  return (
                    <div
                      key={v.id}
                      className="rounded-2xl bg-[#F5F5F7] p-4 border border-[#D2D2D7]/50 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-[#1D1D1F]">
                            {v.nama_varian}
                          </span>
                          {v.badge && (
                            <span className="rounded-full bg-[#0071E3] px-2.5 py-0.5 text-[9.5px] font-bold text-white">
                              {v.badge}
                            </span>
                          )}
                        </div>
                        {v.promo_description && (
                          <p className="text-[11px] text-[#6E6E73] mt-0.5">
                            {v.promo_description}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        {hasPromo && (
                          <p className="text-[11px] line-through text-[#86868B]">
                            {formatRupiah(v.harga)}
                          </p>
                        )}
                        <p className="text-[15px] font-bold text-[#0071E3]">
                          {formatRupiah(hasPromo ? v.harga_promo! : v.harga)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="shrink-0 px-6 sm:px-8 py-4 bg-white border-t border-[#F5F5F7] flex items-center justify-between gap-3 z-10">
          <span className="text-[11.5px] text-[#86868B]">
            Untuk mengubah spesifikasi atau harga, gunakan menu{" "}
            <strong className="text-[#1D1D1F]">Cabang &amp; Unit</strong>.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-6 py-2.5 text-[12.5px] font-semibold text-white shadow-sm shadow-[#0071E3]/25 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
