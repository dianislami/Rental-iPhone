import { Branch, IphoneUnit, PriceVariant } from "@/lib/public-data";

export type { Branch, IphoneUnit, PriceVariant };

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
}

export interface CustomerRecord {
  id: string;
  nama: string;
  no_whatsapp: string;
  created_at?: string;
}

export interface RentalTransaction {
  id: string;
  customer_id: string;
  iphone_id: string;
  branch_id: string;
  price_variant_id: string;
  chat_conversation_id?: string | null;
  tanggal_pengambilan: string;
  jam_pengambilan: string;
  tanggal_pengembalian: string;
  jam_pengembalian: string;
  total_bayar: number;
  dp: number;
  sisa_bayar?: number;
  status_pembayaran: "belum_bayar" | "dp" | "lunas";
  status_sewa: "terjadwal" | "sedang_disewa" | "selesai" | "dibatalkan";
  lokasi_penggunaan?: string | null;
  jaminan?: string | null;
  catatan?: string | null;
  created_at: string;
  customers?: {
    id: string;
    nama: string;
    no_whatsapp: string;
  } | null;
  iphones?: {
    id: string;
    nama_unit: string;
    tipe: string;
    storage: string;
    warna: string;
    battery_health?: string;
    status?: string;
    image_url?: string | null;
  } | null;
  branches?: {
    id: string;
    nama_cabang: string;
    kota: string;
  } | null;
  price_variants?: {
    id: string;
    nama_varian: string;
    harga: number;
    harga_promo: number | null;
  } | null;
}

export interface ExpenseRecord {
  id: string;
  branch_id: string;
  admin_id?: string | null;
  nominal: number;
  tanggal: string;
  keterangan: string | null;
  created_at: string;
  branches?: {
    id: string;
    nama_cabang: string;
    kota: string;
  } | null;
}

export interface AdminChatConversation {
  id: string;
  visitor_auth_id: string;
  status: "open" | "closed";
  created_at: string;
  updated_at?: string;
  last_message_at?: string | null;
}

export interface AdminChatMessage {
  id: string;
  conversation_id: string;
  sender_type: "visitor" | "admin";
  admin_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CustomerSurveyRecord {
  id: string;
  conversation_id: string;
  rentang_usia: string;
  jenis_kelamin: string;
  pekerjaan: string;
  domisili: string;
  pengalaman_sewa: string;
  tujuan_penyewaan: string;
  tujuan_lainnya: string | null;
  created_at: string;
}

export function getInitials(name: string): string {
  const parts = (name || "User").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatShortDateId(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(
      dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr
    );
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatTimeShort(timeStr: string): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5) + " WIB";
}

export function getRentalRemainingInfo(rental: RentalTransaction): {
  label: string;
  subLabel: string;
  isOverdue: boolean;
} {
  if (rental.status_sewa === "selesai") {
    return { label: "Closed Out", subLabel: "Selesai", isOverdue: false };
  }
  if (rental.status_sewa === "dibatalkan") {
    return { label: "Dibatalkan", subLabel: "-", isOverdue: false };
  }

  const now = new Date();
  const pickupTime = new Date(
    `${rental.tanggal_pengambilan}T${(rental.jam_pengambilan || "09:00").slice(
      0,
      5
    )}:00`
  );
  const returnTime = new Date(
    `${rental.tanggal_pengembalian}T${(
      rental.jam_pengembalian || "21:00"
    ).slice(0, 5)}:00`
  );

  if (rental.status_sewa === "terjadwal") {
    const diffMs = pickupTime.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) {
      return {
        label: "Jadwal Pickup",
        subLabel: "Siap Diambil",
        isOverdue: false,
      };
    }
    if (diffHours < 24) {
      return {
        label: `Mulai ${diffHours} Jam`,
        subLabel: "Terjadwal",
        isOverdue: false,
      };
    }
    const days = Math.ceil(diffHours / 24);
    return {
      label: `Mulai dlm ${days} hari`,
      subLabel: "Reservasi",
      isOverdue: false,
    };
  }

  // sedang_disewa
  const diffMs = returnTime.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) {
    const overdueHours = Math.abs(diffHours);
    return {
      label: `+${overdueHours} Jam Overdue`,
      subLabel: "Terlambat Kembali",
      isOverdue: true,
    };
  }

  if (diffHours <= 24) {
    return {
      label: `Sisa ${diffHours} Jam`,
      subLabel: diffHours <= 3 ? "Due Soon" : "Tepat Waktu",
      isOverdue: false,
    };
  }

  const days = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;
  return {
    label: `Sisa ${days}h ${remHours}j`,
    subLabel: "Tepat Waktu",
    isOverdue: false,
  };
}
