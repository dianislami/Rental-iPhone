
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// ============================================
// GET: Mengambil detail pengeluaran
// ============================================
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
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

    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID pengeluaran tidak valid.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        branches (
          id,
          nama_cabang,
          kota
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("GET EXPENSE DETAIL ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil detail pengeluaran.",
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pengeluaran tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Detail pengeluaran berhasil diambil.",
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET EXPENSE DETAIL API ERROR:", error);

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
// PATCH: Memperbarui data pengeluaran
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

    // 2. Validasi ID
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID pengeluaran tidak valid.",
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

    // 4. Memeriksa kolom yang diizinkan
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

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada data yang diperbarui.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi branch_id
    if (
      Object.hasOwn(body, "branch_id") &&
      (
        typeof body.branch_id !== "string" ||
        !uuidRegex.test(body.branch_id)
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "branch_id harus berupa UUID yang valid.",
        },
        { status: 400 }
      );
    }

    // 6. Validasi nominal
    if (
      Object.hasOwn(body, "nominal") &&
      (
        typeof body.nominal !== "number" ||
        !Number.isFinite(body.nominal) ||
        body.nominal <= 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Nominal harus berupa angka lebih dari 0.",
        },
        { status: 400 }
      );
    }

    // 7. Validasi tanggal
    if (
      Object.hasOwn(body, "tanggal") &&
      !isValidDate(body.tanggal)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tanggal harus menggunakan format YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    // 8. Validasi keterangan
    if (
      Object.hasOwn(body, "keterangan") &&
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

    // 9. Memeriksa keberadaan pengeluaran
    const { data: existingExpense, error: searchError } =
      await supabase
        .from("expenses")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (searchError) {
      console.error("SEARCH EXPENSE ERROR:", searchError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa data pengeluaran.",
        },
        { status: 500 }
      );
    }

    if (!existingExpense) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pengeluaran tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // 10. Menyiapkan data yang diperbarui
    const updateData: {
      branch_id?: string;
      nominal?: number;
      tanggal?: string;
      keterangan?: string | null;
    } = {};

    if (Object.hasOwn(body, "branch_id")) {
      updateData.branch_id = body.branch_id;
    }

    if (Object.hasOwn(body, "nominal")) {
      updateData.nominal = body.nominal;
    }

    if (Object.hasOwn(body, "tanggal")) {
      updateData.tanggal = body.tanggal;
    }

    if (Object.hasOwn(body, "keterangan")) {
      updateData.keterangan =
        body.keterangan === null
          ? null
          : body.keterangan.trim() || null;
    }

    // 11. Memperbarui data
    const { data, error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", id)
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
      console.error("UPDATE EXPENSE ERROR:", error);

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
          message: "Gagal memperbarui data pengeluaran.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data pengeluaran berhasil diperbarui.",
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("UPDATE EXPENSE API ERROR:", error);

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
// DELETE: Menghapus data pengeluaran
// ============================================
export async function DELETE(
  _request: NextRequest,
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

    // 2. Validasi ID
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID pengeluaran tidak valid.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 3. Memeriksa keberadaan data
    const { data: existingExpense, error: searchError } =
      await supabase
        .from("expenses")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (searchError) {
      console.error("SEARCH EXPENSE DELETE ERROR:", searchError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa data pengeluaran.",
        },
        { status: 500 }
      );
    }

    if (!existingExpense) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pengeluaran tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // 4. Menghapus data
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE EXPENSE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menghapus data pengeluaran.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data pengeluaran berhasil dihapus.",
        deleted_id: id,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE EXPENSE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
