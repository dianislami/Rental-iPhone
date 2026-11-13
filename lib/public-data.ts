export interface Branch {
  id: string;
  nama_cabang: string;
  alamat: string | null;
  kota: string;
  created_at?: string;
  // Computed from real database relations
  unit_count?: number;
  google_maps_url?: string;
}

export interface PriceVariant {
  id: string;
  iphone_id: string;
  nama_varian: string;
  harga: number;
  harga_promo: number | null;
  badge: string | null;
  promo_description: string | null;
  promo_start: string | null;
  promo_end: string | null;
  is_active: boolean;
  created_at?: string;
  iphones?: {
    nama_unit: string;
    tipe: string;
    storage: string;
  } | null;
}

export interface IphoneUnit {
  id: string;
  branch_id: string;
  nama_unit: string;
  tipe: string;
  storage: string;
  warna: string;
  battery_health: string;
  status: "aktif" | "perawatan" | "nonaktif";
  deskripsi: string | null;
  image_url: string | null;
  display_order: number;
  created_at?: string;
  branches?: {
    nama_cabang: string;
    kota: string;
  } | null;
  // Computed from real database fields & price_variants
  color_hex?: string;
  highlight_badge?: string | null;
  availability_label?: string;
  price_per_day?: number | null;
  original_price_per_day?: number | null;
  discount_percent?: number | null;
  variants?: PriceVariant[];
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("Rp", "Rp ");
}

export function getColorHex(colorName: string): string {
  const lower = (colorName || "").toLowerCase();
  if (lower.includes("desert") || lower.includes("gold") || lower.includes("emas"))
    return "#C5B49E";
  if (lower.includes("natural") || lower.includes("titanium") && !lower.includes("blue") && !lower.includes("black") && !lower.includes("white"))
    return "#9A968E";
  if (lower.includes("blue") && lower.includes("titanium")) return "#475361";
  if (
    lower.includes("ultramarine") ||
    lower.includes("blue") ||
    lower.includes("biru")
  )
    return "#0071E3";
  if (lower.includes("purple") || lower.includes("ungu")) return "#594F63";
  if (
    lower.includes("white") ||
    lower.includes("silver") ||
    lower.includes("putih") ||
    lower.includes("perak")
  )
    return "#EBECE7";
  if (lower.includes("pink") || lower.includes("rose") || lower.includes("merah muda"))
    return "#E8A5B8";
  if (lower.includes("red") || lower.includes("merah")) return "#D92D20";
  if (
    lower.includes("green") ||
    lower.includes("teal") ||
    lower.includes("hijau")
  )
    return "#689B9A";
  if (lower.includes("yellow") || lower.includes("kuning")) return "#FACC15";
  return "#323130";
}

export function isPromoValid(variant: PriceVariant): boolean {
  if (
    variant.harga_promo === null ||
    variant.harga_promo === undefined ||
    variant.harga_promo <= 0 ||
    variant.harga_promo >= variant.harga
  ) {
    return false;
  }

  if (!variant.promo_start || !variant.promo_end) {
    return true;
  }

  const today = new Date().toISOString().slice(0, 10);
  return today >= variant.promo_start && today <= variant.promo_end;
}

export function getEffectivePrice(variant: PriceVariant): number {
  return isPromoValid(variant) && variant.harga_promo
    ? variant.harga_promo
    : variant.harga;
}

export function enrichBranchWithUnits(
  raw: Branch,
  allIphones: IphoneUnit[]
): Branch {
  const count = allIphones.filter(
    (u) =>
      u.branch_id === raw.id ||
      (u.branches?.nama_cabang &&
        u.branches.nama_cabang.toLowerCase() === raw.nama_cabang.toLowerCase())
  ).length;

  const query = [raw.nama_cabang, raw.alamat, raw.kota]
    .filter(Boolean)
    .join(", ");

  return {
    ...raw,
    unit_count: count,
    google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      query
    )}`,
  };
}

export function enrichIphoneUnit(
  unit: IphoneUnit,
  allVariants: PriceVariant[]
): IphoneUnit {
  // Ambil hanya varian harga aktif milik unit iPhone ini dari database
  const unitVariants = allVariants
    .filter((v) => v.iphone_id === unit.id && v.is_active !== false)
    .sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));

  // Cari varian utama (prioritaskan 1 hari / 24 jam, atau harga terendah)
  const primaryVariant =
    unitVariants.find(
      (v) =>
        v.nama_varian.toLowerCase().includes("1 hari") ||
        v.nama_varian.toLowerCase().includes("24 jam") ||
        v.nama_varian.toLowerCase().includes("harian")
    ) || unitVariants[0] || null;

  const promoActive = primaryVariant ? isPromoValid(primaryVariant) : false;
  const effectivePrice = primaryVariant
    ? getEffectivePrice(primaryVariant)
    : null;
  const originalPrice =
    primaryVariant && promoActive ? primaryVariant.harga : null;

  const discountPct =
    originalPrice && effectivePrice && originalPrice > effectivePrice
      ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
      : null;

  const badgeFromDb =
    unitVariants.find((v) => v.badge && v.badge.trim())?.badge ||
    (discountPct ? `DISKON ${discountPct}%` : null);

  return {
    ...unit,
    color_hex: getColorHex(unit.warna),
    price_per_day: effectivePrice,
    original_price_per_day: originalPrice,
    discount_percent: discountPct,
    highlight_badge: badgeFromDb,
    availability_label:
      unit.status === "aktif"
        ? "TERSEDIA"
        : unit.status === "perawatan"
        ? "PERAWATAN"
        : "NONAKTIF",
    variants: unitVariants,
  };
}
