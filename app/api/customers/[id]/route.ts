
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// GET: Mengambil detail pelanggan
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
        { success: false, message: "Akses admin diperlukan." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "ID pelanggan tidak valid." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("customers")
      .select("id, nama, no_whatsapp, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("GET CUSTOMER DETAIL ERROR:", error);

      return NextResponse.json(
        { success: false, message: "Gagal mengambil detail pelanggan." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Pelanggan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Detail pelanggan berhasil diambil.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET CUSTOMER API ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH: Memperbarui data pelanggan
// ============================================
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
        { success: false, message: "ID pelanggan tidak valid." },
        { status: 400 }
      );
    }

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

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Format data tidak valid." },
        { status: 400 }
      );
    }

    const allowedFields = ["nama", "no_whatsapp"];

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

    const updates: {
      nama?: string;
      no_whatsapp?: string;
    } = {};

    // Validasi nama
    if (Object.hasOwn(body, "nama")) {
      if (
        typeof body.nama !== "string" ||
        !body.nama.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Nama pelanggan tidak boleh kosong.",
          },
          { status: 400 }
        );
      }

      updates.nama = body.nama.trim();
    }

    // Validasi nomor WhatsApp
    if (Object.hasOwn(body, "no_whatsapp")) {
      if (
        typeof body.no_whatsapp !== "string" ||
        !body.no_whatsapp.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Nomor WhatsApp tidak boleh kosong.",
          },
          { status: 400 }
        );
      }

      updates.no_whatsapp = body.no_whatsapp.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada data yang diperbarui.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Memeriksa apakah nomor WhatsApp baru sudah digunakan
    if (updates.no_whatsapp) {
      const { data: existingCustomer, error: searchError } =
        await supabase
          .from("customers")
          .select("id")
          .eq("no_whatsapp", updates.no_whatsapp)
          .neq("id", id)
          .limit(1)
          .maybeSingle();

      if (searchError) {
        console.error("CHECK WHATSAPP ERROR:", searchError);

        return NextResponse.json(
          {
            success: false,
            message: "Gagal memeriksa nomor WhatsApp.",
          },
          { status: 500 }
        );
      }

      if (existingCustomer) {
        return NextResponse.json(
          {
            success: false,
            message: "Nomor WhatsApp sudah digunakan pelanggan lain.",
          },
          { status: 409 }
        );
      }
    }

    // Memperbarui data pelanggan
    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select("id, nama, no_whatsapp, created_at")
      .maybeSingle();

    if (error) {
      console.error("UPDATE CUSTOMER ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memperbarui data pelanggan.",
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Pelanggan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data pelanggan berhasil diperbarui.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE CUSTOMER API ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: Menghapus data pelanggan
// ============================================
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
        { success: false, message: "ID pelanggan tidak valid." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .select("id, nama, no_whatsapp")
      .maybeSingle();

    if (error) {
      console.error("DELETE CUSTOMER ERROR:", error);

      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            message: "Pelanggan tidak dapat dihapus karena masih memiliki relasi dengan transaksi.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menghapus data pelanggan.",
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Pelanggan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data pelanggan berhasil dihapus.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE CUSTOMER API ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
