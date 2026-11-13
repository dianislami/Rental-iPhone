
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

// GET: Detail varian harga
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "ID varian harga tidak valid." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("price_variants")
      .select(`
        *,
        iphones (
          nama_unit,
          tipe,
          storage
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("GET PRICE VARIANT ERROR:", error);

      return NextResponse.json(
        { success: false, message: "Gagal mengambil detail varian harga." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Varian harga tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Detail varian harga berhasil diambil.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET PRICE VARIANT API ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// PATCH: Memperbarui varian harga
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { admin, response } = await requireAdmin();

    if (response) return response;

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Akses admin diperlukan." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "ID varian harga tidak valid." },
        { status: 400 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body harus berupa JSON yang valid." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Format data tidak valid." },
        { status: 400 }
      );
    }

    const allowedFields = [
      "iphone_id",
      "nama_varian",
      "harga",
      "harga_promo",
      "badge",
      "promo_description",
      "promo_start",
      "promo_end",
      "is_active",
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

    // Ambil data lama untuk validasi gabungan harga dan promo.
    const supabase = await createClient();

    const { data: existing, error: existingError } = await supabase
      .from("price_variants")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error("GET EXISTING PRICE VARIANT ERROR:", existingError);

      return NextResponse.json(
        { success: false, message: "Gagal memeriksa data varian harga." },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Varian harga tidak ditemukan." },
        { status: 404 }
      );
    }

    const updates: Record<string, string | number | boolean | null> = {};

    // Validasi iphone_id
    if (Object.hasOwn(body, "iphone_id")) {
      if (
        typeof body.iphone_id !== "string" ||
        !uuidRegex.test(body.iphone_id)
      ) {
        return NextResponse.json(
          { success: false, message: "iphone_id harus berupa UUID yang valid." },
          { status: 400 }
        );
      }

      updates.iphone_id = body.iphone_id;
    }

    // Validasi nama varian
    if (Object.hasOwn(body, "nama_varian")) {
      if (
        typeof body.nama_varian !== "string" ||
        !body.nama_varian.trim()
      ) {
        return NextResponse.json(
          { success: false, message: "Nama varian tidak boleh kosong." },
          { status: 400 }
        );
      }

      updates.nama_varian = body.nama_varian.trim();
    }

    // Validasi harga normal
    if (Object.hasOwn(body, "harga")) {
      if (
        typeof body.harga !== "number" ||
        !Number.isFinite(body.harga) ||
        body.harga <= 0
      ) {
        return NextResponse.json(
          { success: false, message: "Harga harus berupa angka lebih dari 0." },
          { status: 400 }
        );
      }

      updates.harga = body.harga;
    }

    // Validasi harga promo
    if (Object.hasOwn(body, "harga_promo")) {
      const value = body.harga_promo;

      if (
        value !== null &&
        (
          typeof value !== "number" ||
          !Number.isFinite(value) ||
          value <= 0
        )
      ) {
        return NextResponse.json(
          { success: false, message: "Harga promo harus berupa angka lebih dari 0 atau null." },
          { status: 400 }
        );
      }

      updates.harga_promo = value;
    }

    // Validasi kolom teks opsional
    for (const field of ["badge", "promo_description"]) {
      if (Object.hasOwn(body, field)) {
        const value = body[field];

        if (value !== null && typeof value !== "string") {
          return NextResponse.json(
            { success: false, message: `${field} harus berupa string atau null.` },
            { status: 400 }
          );
        }

        updates[field] =
          typeof value === "string" ? value.trim() || null : null;
      }
    }

    // Validasi tanggal promo
    for (const field of ["promo_start", "promo_end"]) {
      if (Object.hasOwn(body, field)) {
        const value = body[field];

        if (value !== null && !validDate(value)) {
          return NextResponse.json(
            { success: false, message: `${field} harus menggunakan format YYYY-MM-DD atau null.` },
            { status: 400 }
          );
        }

        updates[field] = value;
      }
    }

    // Validasi status aktif
    if (Object.hasOwn(body, "is_active")) {
      if (typeof body.is_active !== "boolean") {
        return NextResponse.json(
          { success: false, message: "is_active harus berupa boolean." },
          { status: 400 }
        );
      }

      updates.is_active = body.is_active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data yang diperbarui." },
        { status: 400 }
      );
    }

    // Validasi kombinasi data lama dan data baru.
    const finalHarga = updates.harga ?? existing.harga;
    const finalPromo = Object.hasOwn(updates, "harga_promo")
      ? updates.harga_promo
      : existing.harga_promo;

    const finalStart = Object.hasOwn(updates, "promo_start")
      ? updates.promo_start
      : existing.promo_start;

    const finalEnd = Object.hasOwn(updates, "promo_end")
      ? updates.promo_end
      : existing.promo_end;

    if (
      finalPromo !== null &&
      (
        Number(finalPromo) <= 0 ||
        Number(finalPromo) > Number(finalHarga)
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

    if (
      finalPromo !== null &&
      (!finalStart || !finalEnd)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Harga promo harus memiliki tanggal mulai dan akhir.",
        },
        { status: 400 }
      );
    }

    if (
      finalStart &&
      finalEnd &&
      finalStart > finalEnd
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tanggal mulai promo tidak boleh melebihi tanggal akhir.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("price_variants")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("UPDATE PRICE VARIANT ERROR:", error);

      if (error.code === "23503") {
        return NextResponse.json(
          { success: false, message: "Unit iPhone tidak ditemukan." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, message: "Gagal memperbarui varian harga." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Varian harga berhasil diperbarui.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE PRICE VARIANT API ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus varian harga
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { admin, response } = await requireAdmin();

    if (response) return response;

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Akses admin diperlukan." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "ID varian harga tidak valid." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("price_variants")
      .delete()
      .eq("id", id)
      .select("id, nama_varian, harga")
      .maybeSingle();

    if (error) {
      console.error("DELETE PRICE VARIANT ERROR:", error);

      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            message: "Varian harga tidak dapat dihapus karena masih digunakan oleh transaksi.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, message: "Gagal menghapus varian harga." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Varian harga tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Varian harga berhasil dihapus.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE PRICE VARIANT API ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
