
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// GET: Mengambil detail transaksi rental
// ============================================
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
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

    // 2. Mengambil ID dari URL
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID transaksi tidak valid.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 3. Mengambil detail transaksi beserta relasinya
    const { data, error } = await supabase
      .from("rentals")
      .select(`
        *,
        customers (
          id,
          nama,
          no_whatsapp,
          created_at
        ),
        iphones (
          id,
          nama_unit,
          tipe,
          storage,
          warna,
          battery_health,
          status,
          image_url
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
          harga_promo,
          badge,
          promo_description,
          promo_start,
          promo_end,
          is_active
        )
      `)
      .eq("id", id)
      .maybeSingle();

    // 4. Penanganan error database
    if (error) {
      console.error("GET RENTAL DETAIL ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil detail transaksi rental.",
        },
        { status: 500 }
      );
    }

    // 5. Memeriksa keberadaan transaksi
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaksi rental tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // 6. Respons berhasil
    return NextResponse.json(
      {
        success: true,
        message: "Detail transaksi rental berhasil diambil.",
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET RENTAL DETAIL API ERROR:", error);

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
// PATCH: Memperbarui transaksi rental
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Pemeriksaan admin
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

    // 2. Validasi ID transaksi
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID transaksi tidak valid.",
        },
        { status: 400 }
      );
    }

    // 3. Membaca body
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

    // 4. Memeriksa field yang diizinkan
    const allowedFields = [
      "iphone_id",
      "branch_id",
      "price_variant_id",
      "tanggal_pengambilan",
      "jam_pengambilan",
      "tanggal_pengembalian",
      "jam_pengembalian",
      "total_bayar",
      "dp",
      "status_sewa",
      "lokasi_penggunaan",
      "jaminan",
      "catatan",
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

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada data yang diperbarui.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi UUID
    const uuidFields = [
      "iphone_id",
      "branch_id",
      "price_variant_id",
    ];

    for (const field of uuidFields) {
      if (
        Object.hasOwn(body, field) &&
        (
          typeof body[field] !== "string" ||
          !uuidRegex.test(body[field])
        )
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

    for (const field of [
      "tanggal_pengambilan",
      "tanggal_pengembalian",
    ]) {
      if (
        Object.hasOwn(body, field) &&
        !isValidDate(body[field])
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} harus menggunakan format YYYY-MM-DD.`,
          },
          { status: 400 }
        );
      }
    }

    // 7. Validasi jam
    const isValidTime = (value: unknown): boolean => {
      return (
        typeof value === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
      );
    };

    for (const field of [
      "jam_pengambilan",
      "jam_pengembalian",
    ]) {
      if (
        Object.hasOwn(body, field) &&
        !isValidTime(body[field])
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} harus menggunakan format HH:MM atau HH:MM:SS.`,
          },
          { status: 400 }
        );
      }
    }

    // 8. Validasi nominal pembayaran
    for (const field of ["total_bayar", "dp"]) {
      if (
        Object.hasOwn(body, field) &&
        (
          typeof body[field] !== "number" ||
          !Number.isFinite(body[field]) ||
          body[field] < 0
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} harus berupa angka minimal 0.`,
          },
          { status: 400 }
        );
      }
    }

    // 9. Validasi status sewa
    const allowedStatus = [
      "terjadwal",
      "sedang_disewa",
      "selesai",
      "dibatalkan",
    ];

    if (
      Object.hasOwn(body, "status_sewa") &&
      !allowedStatus.includes(body.status_sewa)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Status sewa tidak valid.",
        },
        { status: 400 }
      );
    }

    // 10. Validasi kolom teks
    for (const field of [
      "lokasi_penggunaan",
      "jaminan",
      "catatan",
    ]) {
      if (
        Object.hasOwn(body, field) &&
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

    // 11. Memanggil PostgreSQL RPC
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "update_rental_transaction",
      {
        p_rental_id: id,
        p_updates: body,
      }
    );

    if (error) {
      console.error("UPDATE RENTAL RPC ERROR:", error);

      const errorMessage = error.message || "";

      if (errorMessage.includes("RENTAL_NOT_FOUND")) {
        return NextResponse.json(
          {
            success: false,
            message: "Transaksi rental tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      if (errorMessage.includes("RENTAL_SCHEDULE_CONFLICT")) {
        return NextResponse.json(
          {
            success: false,
            message: "Jadwal penyewaan bertabrakan dengan transaksi lain.",
          },
          { status: 409 }
        );
      }

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

      if (errorMessage.includes("BRANCH_MISMATCH")) {
        return NextResponse.json(
          {
            success: false,
            message: "Cabang tidak sesuai dengan unit iPhone.",
          },
          { status: 400 }
        );
      }

      if (
        errorMessage.includes("PRICE_VARIANT_MISMATCH") ||
        errorMessage.includes("PRICE_VARIANT_INACTIVE") ||
        errorMessage.includes("INVALID_RENTAL_PERIOD") ||
        errorMessage.includes("INVALID_TOTAL_PAYMENT") ||
        errorMessage.includes("INVALID_DP") ||
        errorMessage.includes("INVALID_RENTAL_STATUS") ||
        errorMessage.includes("INVALID_UPDATE")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Data perubahan transaksi tidak memenuhi ketentuan.",
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
          message: "Gagal memperbarui transaksi rental.",
        },
        { status: 500 }
      );
    }

    // 12. Respons berhasil
    return NextResponse.json(
      {
        success: true,
        message: "Transaksi rental berhasil diperbarui.",
        data: data.rental,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("UPDATE RENTAL API ERROR:", error);

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
// DELETE: Membatalkan transaksi rental
// ============================================
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
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

    // 2. Validasi ID transaksi
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID transaksi tidak valid.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 3. Memanggil fungsi pembatalan PostgreSQL
    const { data, error } = await supabase.rpc(
      "cancel_rental_transaction",
      {
        p_rental_id: id,
      }
    );

    // 4. Penanganan error
    if (error) {
      console.error("CANCEL RENTAL ERROR:", error);

      const errorMessage = error.message || "";

      if (errorMessage.includes("RENTAL_NOT_FOUND")) {
        return NextResponse.json(
          {
            success: false,
            message: "Transaksi rental tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      if (
        errorMessage.includes("RENTAL_CANNOT_BE_CANCELLED")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Transaksi yang sedang disewa atau sudah selesai tidak dapat dibatalkan melalui endpoint ini.",
          },
          { status: 409 }
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
          message: "Gagal membatalkan transaksi rental.",
        },
        { status: 500 }
      );
    }

    // 5. Respons berhasil
    return NextResponse.json(
      {
        success: true,
        message: data.message,
        already_cancelled: data.already_cancelled,
        data: data.rental,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE RENTAL API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
