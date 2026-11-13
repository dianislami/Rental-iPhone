
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

// ============================================
// GET: Mengambil seluruh data transaksi rental
// ============================================
export async function GET(request: NextRequest) {
  try {
    // 1. Pemeriksaan hak akses admin
    const { admin, response } = await requireAdmin();

    if (response) return response;

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses admin diperlukan.",
        },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // 2. Mengambil parameter filter dari URL
    const searchParams = request.nextUrl.searchParams;

    const branchId = searchParams.get("branch_id");
    const statusSewa = searchParams.get("status_sewa");
    const statusPembayaran = searchParams.get("status_pembayaran");
    const tanggalMulai = searchParams.get("tanggal_mulai");
    const tanggalSelesai = searchParams.get("tanggal_selesai");

    // 3. Validasi UUID cabang
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (branchId && !uuidRegex.test(branchId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format branch_id tidak valid.",
        },
        { status: 400 }
      );
    }

    // 4. Validasi status sewa
    const allowedStatusSewa = [
      "terjadwal",
      "sedang_disewa",
      "selesai",
      "dibatalkan",
    ];

    if (
      statusSewa &&
      !allowedStatusSewa.includes(statusSewa)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Status sewa tidak valid.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi status pembayaran
    const allowedStatusPembayaran = [
      "belum_bayar",
      "dp",
      "lunas",
    ];

    if (
      statusPembayaran &&
      !allowedStatusPembayaran.includes(statusPembayaran)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Status pembayaran tidak valid.",
        },
        { status: 400 }
      );
    }

    // 6. Validasi format tanggal
    const isValidDate = (value: string): boolean => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (
      (tanggalMulai && !isValidDate(tanggalMulai)) ||
      (tanggalSelesai && !isValidDate(tanggalSelesai))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Format tanggal harus YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    if (
      tanggalMulai &&
      tanggalSelesai &&
      tanggalMulai > tanggalSelesai
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tanggal mulai tidak boleh melebihi tanggal selesai.",
        },
        { status: 400 }
      );
    }

    // 7. Query data rental beserta relasinya
    let query = supabase
      .from("rentals")
      .select(`
        *,
        customers (
          id,
          nama,
          no_whatsapp
        ),
        iphones (
          id,
          nama_unit,
          tipe,
          storage,
          warna
        ),
        branches (
          id,
          nama_cabang,
          kota
        ),
        price_variants (
          id,
          nama_varian,
          harga,
          harga_promo
        )
      `)
      .order("created_at", { ascending: false });

    // 8. Menerapkan filter jika tersedia
    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    if (statusSewa) {
      query = query.eq("status_sewa", statusSewa);
    }

    if (statusPembayaran) {
      query = query.eq("status_pembayaran", statusPembayaran);
    }

    if (tanggalMulai) {
      query = query.gte("tanggal_pengambilan", tanggalMulai);
    }

    if (tanggalSelesai) {
      query = query.lte("tanggal_pengambilan", tanggalSelesai);
    }

    // 9. Eksekusi query
    const { data, error } = await query;

    if (error) {
      console.error("GET RENTALS ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data transaksi rental.",
        },
        { status: 500 }
      );
    }

    // 10. Respons berhasil
    return NextResponse.json(
      {
        success: true,
        message: "Data transaksi rental berhasil diambil.",
        total: data.length,
        filters: {
          branch_id: branchId,
          status_sewa: statusSewa,
          status_pembayaran: statusPembayaran,
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
        },
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET RENTALS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Membuat transaksi penyewaan
// ============================================
export async function POST(request: NextRequest) {
  try {
    // 1. Pemeriksaan hak akses admin
    const { admin, response } = await requireAdmin();

    if (response) return response;

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses admin diperlukan.",
        },
        { status: 403 }
      );
    }

    // 2. Membaca request body
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Request body harus berupa JSON yang valid.",
        },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Format data tidak valid.",
        },
        { status: 400 }
      );
    }

    // 3. Memeriksa kolom yang diizinkan
    const allowedFields = [
      "nama_pelanggan",
      "no_whatsapp",
      "iphone_id",
      "branch_id",
      "price_variant_id",
      "tanggal_pengambilan",
      "jam_pengambilan",
      "tanggal_pengembalian",
      "jam_pengembalian",
      "total_bayar",
      "dp",
      "lokasi_penggunaan",
      "jaminan",
      "catatan",
      "chat_conversation_id",
    ];

    const unknownFields = Object.keys(body).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Terdapat kolom yang tidak diizinkan.",
          fields: unknownFields,
        },
        { status: 400 }
      );
    }

    // 4. Validasi UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const uuidFields = [
      "iphone_id",
      "branch_id",
      "price_variant_id",
    ];

    for (const field of uuidFields) {
      if (
        typeof body[field] !== "string" ||
        !uuidRegex.test(body[field])
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} harus berupa UUID yang valid.`,
          },
          { status: 400 }
        );
      }
    }

    if (
      body.chat_conversation_id !== undefined &&
      body.chat_conversation_id !== null &&
      (
        typeof body.chat_conversation_id !== "string" ||
        !uuidRegex.test(body.chat_conversation_id)
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "chat_conversation_id tidak valid.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi data pelanggan
    if (
      typeof body.nama_pelanggan !== "string" ||
      !body.nama_pelanggan.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama pelanggan wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body.no_whatsapp !== "string" ||
      !body.no_whatsapp.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Nomor WhatsApp wajib diisi.",
        },
        { status: 400 }
      );
    }

    // 6. Validasi tanggal
    const isValidDate = (value: unknown): boolean => {
      if (typeof value !== "string") return false;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (
      !isValidDate(body.tanggal_pengambilan) ||
      !isValidDate(body.tanggal_pengembalian)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Format tanggal harus YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    // 7. Validasi jam
    const isValidTime = (value: unknown): boolean => {
      if (typeof value !== "string") return false;

      if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)) {
        return false;
      }

      return true;
    };

    if (
      !isValidTime(body.jam_pengambilan) ||
      !isValidTime(body.jam_pengembalian)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Format jam harus HH:MM atau HH:MM:SS.",
        },
        { status: 400 }
      );
    }

    const waktuPengambilan = new Date(
      `${body.tanggal_pengambilan}T${body.jam_pengambilan}`
    );

    const waktuPengembalian = new Date(
      `${body.tanggal_pengembalian}T${body.jam_pengembalian}`
    );

    if (waktuPengembalian <= waktuPengambilan) {
      return NextResponse.json(
        {
          success: false,
          message: "Waktu pengembalian harus setelah waktu pengambilan.",
        },
        { status: 400 }
      );
    }

    // 8. Validasi pembayaran
    if (
      typeof body.total_bayar !== "number" ||
      !Number.isFinite(body.total_bayar) ||
      body.total_bayar < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Total pembayaran harus berupa angka minimal 0.",
        },
        { status: 400 }
      );
    }

    const dp = body.dp ?? 0;

    if (
      typeof dp !== "number" ||
      !Number.isFinite(dp) ||
      dp < 0 ||
      dp > body.total_bayar
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "DP harus berupa angka antara 0 dan total pembayaran.",
        },
        { status: 400 }
      );
    }

    // 9. Validasi kolom opsional
    for (const field of [
      "lokasi_penggunaan",
      "jaminan",
      "catatan",
    ]) {
      if (
        body[field] !== undefined &&
        body[field] !== null &&
        typeof body[field] !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} harus berupa teks atau null.`,
          },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // 10. Membuat transaksi melalui PostgreSQL RPC
    const { data, error } = await supabase.rpc(
      "create_rental_transaction",
      {
        p_nama_pelanggan: body.nama_pelanggan.trim(),
        p_no_whatsapp: body.no_whatsapp.trim(),
        p_iphone_id: body.iphone_id,
        p_branch_id: body.branch_id,
        p_price_variant_id: body.price_variant_id,
        p_tanggal_pengambilan: body.tanggal_pengambilan,
        p_jam_pengambilan: body.jam_pengambilan,
        p_tanggal_pengembalian: body.tanggal_pengembalian,
        p_jam_pengembalian: body.jam_pengembalian,
        p_total_bayar: body.total_bayar,
        p_dp: dp,
        p_lokasi_penggunaan:
          body.lokasi_penggunaan?.trim() || null,
        p_jaminan: body.jaminan?.trim() || null,
        p_catatan: body.catatan?.trim() || null,
        p_chat_conversation_id:
          body.chat_conversation_id ?? null,
      }
    );

    if (error) {
      console.error("CREATE RENTAL RPC ERROR:", error);

      const errorMessage = error.message || "";

      // Bentrok jadwal
      if (errorMessage.includes("RENTAL_SCHEDULE_CONFLICT")) {
        return NextResponse.json(
          {
            success: false,
            message: "Unit iPhone sudah memiliki jadwal penyewaan pada periode tersebut.",
          },
          { status: 409 }
        );
      }

      // Data tidak ditemukan
      if (
        errorMessage.includes("IPHONE_NOT_FOUND") ||
        errorMessage.includes("PRICE_VARIANT_NOT_FOUND")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Unit iPhone atau varian harga tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      if (
        errorMessage.includes("BRANCH_MISMATCH") ||
        errorMessage.includes("PRICE_VARIANT_MISMATCH")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Cabang, unit iPhone, dan varian harga tidak sesuai.",
          },
          { status: 400 }
        );
      }

      if (errorMessage.includes("PRICE_VARIANT_INACTIVE")) {
        return NextResponse.json(
          {
            success: false,
            message: "Varian harga sedang tidak aktif.",
          },
          { status: 400 }
        );
      }

      if (
        errorMessage.includes("INVALID_RENTAL_PERIOD") ||
        errorMessage.includes("INVALID_TOTAL_PAYMENT") ||
        errorMessage.includes("INVALID_DP") ||
        errorMessage.includes("CUSTOMER_DATA_REQUIRED")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Data transaksi tidak memenuhi ketentuan.",
          },
          { status: 400 }
        );
      }

      if (errorMessage.includes("ADMIN_REQUIRED")) {
        return NextResponse.json(
          {
            success: false,
            message: "Akses admin diperlukan.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Gagal membuat transaksi penyewaan.",
        },
        { status: 500 }
      );
    }

    // 11. Respons berhasil
    return NextResponse.json(
      {
        success: true,
        message: "Transaksi penyewaan berhasil dibuat.",
        is_existing_customer: data.is_existing_customer,
        customer: data.customer,
        rental: data.rental,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("CREATE RENTAL API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
