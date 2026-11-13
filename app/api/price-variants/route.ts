
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

// GET: Mengambil seluruh varian harga
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("price_variants")
      .select(`
        id,
        iphone_id,
        nama_varian,
        harga,
        harga_promo,
        badge,
        promo_description,
        promo_start,
        promo_end,
        is_active,
        created_at,
        iphones (
          nama_unit,
          tipe,
          storage
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET PRICE VARIANTS ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data varian harga.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data varian harga berhasil diambil.",
        total: data.length,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET PRICE VARIANTS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

// POST: Menambahkan varian harga (khusus admin)
export async function POST(request: NextRequest) {
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

    // 2. Membaca JSON
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

    // 3. Validasi iphone_id
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      typeof body.iphone_id !== "string" ||
      !uuidRegex.test(body.iphone_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "iphone_id wajib berupa UUID yang valid.",
        },
        { status: 400 }
      );
    }

    // 4. Validasi nama varian
    if (
      typeof body.nama_varian !== "string" ||
      !body.nama_varian.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama varian wajib diisi.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi harga normal
    if (
      typeof body.harga !== "number" ||
      !Number.isFinite(body.harga) ||
      body.harga <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Harga harus berupa angka lebih dari 0.",
        },
        { status: 400 }
      );
    }

    // 6. Validasi harga promo
    const hargaPromo = body.harga_promo ?? null;

    if (
      hargaPromo !== null &&
      (
        typeof hargaPromo !== "number" ||
        !Number.isFinite(hargaPromo) ||
        hargaPromo <= 0 ||
        hargaPromo > body.harga
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Harga promo harus lebih dari 0 dan tidak boleh melebihi harga normal.",
        },
        { status: 400 }
      );
    }

    // 7. Validasi tanggal promo
    const promoStart = body.promo_start ?? null;
    const promoEnd = body.promo_end ?? null;

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

    for (const date of [promoStart, promoEnd]) {
      if (date !== null && !isValidDate(date)) {
        return NextResponse.json(
          {
            success: false,
            message: "Format tanggal promo harus YYYY-MM-DD.",
          },
          { status: 400 }
        );
      }
    }

    if (
      promoStart &&
      promoEnd &&
      promoStart > promoEnd
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tanggal mulai promo tidak boleh melebihi tanggal akhir.",
        },
        { status: 400 }
      );
    }

    if (
      hargaPromo !== null &&
      (!promoStart || !promoEnd)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Harga promo harus memiliki tanggal mulai dan akhir.",
        },
        { status: 400 }
      );
    }

    // 8. Validasi kolom opsional
    for (const field of ["badge", "promo_description"]) {
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

    const isActive = body.is_active ?? true;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "is_active harus berupa boolean.",
        },
        { status: 400 }
      );
    }

    // 9. Menyimpan data ke database
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("price_variants")
      .insert({
        iphone_id: body.iphone_id,
        nama_varian: body.nama_varian.trim(),
        harga: body.harga,
        harga_promo: hargaPromo,
        badge: body.badge?.trim() || null,
        promo_description:
          body.promo_description?.trim() || null,
        promo_start: promoStart,
        promo_end: promoEnd,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      console.error("CREATE PRICE VARIANT ERROR:", error);

      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            message: "Unit iPhone tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menambahkan varian harga.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Varian harga berhasil ditambahkan.",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PRICE VARIANT API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
