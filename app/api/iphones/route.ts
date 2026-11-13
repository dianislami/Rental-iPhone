
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

// GET: Mengambil seluruh data iPhone
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("iphones")
      .select(`
        id,
        branch_id,
        nama_unit,
        tipe,
        storage,
        warna,
        battery_health,
        status,
        deskripsi,
        image_url,
        display_order,
        created_at,
        branches (
          nama_cabang,
          kota
        )
      `)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("GET IPHONES ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data iPhone.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data iPhone berhasil diambil.",
        total: data.length,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET IPHONES API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

// POST: Menambahkan unit iPhone (khusus admin)
export async function POST(request: NextRequest) {
  try {
    // 1. Memeriksa hak akses admin
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

    // 3. Validasi data wajib
    const requiredFields = [
      "branch_id",
      "nama_unit",
      "tipe",
      "storage",
      "warna",
      "battery_health",
    ];

    for (const field of requiredFields) {
      if (
        typeof body[field] !== "string" ||
        !body[field].trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} wajib diisi.`,
          },
          { status: 400 }
        );
      }
    }

    // 4. Validasi UUID branch_id
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(body.branch_id.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: "Format branch_id tidak valid.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi status
    const allowedStatus = [
      "aktif",
      "perawatan",
      "nonaktif",
    ];

    const status = body.status ?? "aktif";

    if (
      typeof status !== "string" ||
      !allowedStatus.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Status harus aktif, perawatan, atau nonaktif.",
        },
        { status: 400 }
      );
    }

    // 6. Validasi display_order
    const displayOrder = body.display_order ?? 0;

    if (
      !Number.isInteger(displayOrder) ||
      displayOrder < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "display_order harus berupa bilangan bulat nonnegatif.",
        },
        { status: 400 }
      );
    }

    // 7. Validasi kolom opsional
    for (const field of ["deskripsi", "image_url"]) {
      if (
        body[field] !== undefined &&
        body[field] !== null &&
        typeof body[field] !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} harus berupa string atau null.`,
          },
          { status: 400 }
        );
      }
    }

    // 8. Menyimpan data
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("iphones")
      .insert({
        branch_id: body.branch_id.trim(),
        nama_unit: body.nama_unit.trim(),
        tipe: body.tipe.trim(),
        storage: body.storage.trim(),
        warna: body.warna.trim(),
        battery_health: body.battery_health.trim(),
        status,
        deskripsi: body.deskripsi?.trim() || null,
        image_url: body.image_url?.trim() || null,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("CREATE IPHONE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menambahkan unit iPhone.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Unit iPhone berhasil ditambahkan.",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE IPHONE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
