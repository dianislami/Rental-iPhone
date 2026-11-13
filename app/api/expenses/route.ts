
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

// ============================================
// GET: Mengambil seluruh data pengeluaran
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

    // 2. Mengambil parameter filter
    const searchParams = request.nextUrl.searchParams;

    const branchId = searchParams.get("branch_id");
    const tanggalMulai = searchParams.get("tanggal_mulai");
    const tanggalSelesai = searchParams.get("tanggal_selesai");

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 3. Validasi branch_id
    if (branchId && !uuidRegex.test(branchId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format branch_id tidak valid.",
        },
        { status: 400 }
      );
    }

    // 4. Validasi tanggal
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

    // 5. Query data pengeluaran
    let query = supabase
      .from("expenses")
      .select(`
        *,
        branches (
          id,
          nama_cabang,
          kota
        )
      `)
      .order("tanggal", { ascending: false })
      .order("created_at", { ascending: false });

    // 6. Filter cabang
    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    // 7. Filter periode tanggal
    if (tanggalMulai) {
      query = query.gte("tanggal", tanggalMulai);
    }

    if (tanggalSelesai) {
      query = query.lte("tanggal", tanggalSelesai);
    }

    // 8. Eksekusi query
    const { data, error } = await query;

    if (error) {
      console.error("GET EXPENSES ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data pengeluaran.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data pengeluaran berhasil diambil.",
        total: data.length,
        filters: {
          branch_id: branchId,
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
        },
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET EXPENSES API ERROR:", error);

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
// POST: Menambahkan pengeluaran operasional
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
      "branch_id",
      "nominal",
      "tanggal",
      "keterangan",
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

    // 4. Validasi branch_id
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      typeof body.branch_id !== "string" ||
      !uuidRegex.test(body.branch_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "branch_id harus berupa UUID yang valid.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi nominal
    if (
      typeof body.nominal !== "number" ||
      !Number.isFinite(body.nominal) ||
      body.nominal <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Nominal pengeluaran harus berupa angka lebih dari 0.",
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

    if (!isValidDate(body.tanggal)) {
      return NextResponse.json(
        {
          success: false,
          message: "Tanggal harus menggunakan format YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    // 7. Validasi keterangan
    if (
      body.keterangan !== undefined &&
      body.keterangan !== null &&
      typeof body.keterangan !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Keterangan harus berupa teks atau null.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 8. Menyimpan data pengeluaran
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        branch_id: body.branch_id,
        admin_id: admin.id,
        nominal: body.nominal,
        tanggal: body.tanggal,
        keterangan: body.keterangan?.trim() || null,
      })
      .select(`
        *,
        branches (
          id,
          nama_cabang,
          kota
        )
      `)
      .single();

    if (error) {
      console.error("CREATE EXPENSE ERROR:", error);

      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            message: "Cabang tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menambahkan pengeluaran.",
        },
        { status: 500 }
      );
    }

    // 9. Respons berhasil
    return NextResponse.json(
      {
        success: true,
        message: "Pengeluaran operasional berhasil ditambahkan.",
        data,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("CREATE EXPENSE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
