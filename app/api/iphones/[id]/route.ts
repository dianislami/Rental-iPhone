
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET: Detail iPhone
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "ID iPhone tidak valid." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("iphones")
      .select(`
        *,
        branches (
          nama_cabang,
          kota
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("GET IPHONE DETAIL ERROR:", error);

      return NextResponse.json(
        { success: false, message: "Gagal mengambil detail iPhone." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Unit iPhone tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Detail iPhone berhasil diambil.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET IPHONE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// PATCH: Memperbarui data iPhone
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
        { success: false, message: "ID iPhone tidak valid." },
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

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { success: false, message: "Format data tidak valid." },
        { status: 400 }
      );
    }

    const updates: Record<string, string | number | null> = {};

    const stringFields = [
      "nama_unit",
      "tipe",
      "storage",
      "warna",
      "battery_health",
    ];

    for (const field of stringFields) {
      if (Object.hasOwn(body, field)) {
        if (
          typeof body[field] !== "string" ||
          !body[field].trim()
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `${field} tidak boleh kosong.`,
            },
            { status: 400 }
          );
        }

        updates[field] = body[field].trim();
      }
    }

    if (Object.hasOwn(body, "branch_id")) {
      if (
        typeof body.branch_id !== "string" ||
        !uuidRegex.test(body.branch_id)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Format branch_id tidak valid.",
          },
          { status: 400 }
        );
      }

      updates.branch_id = body.branch_id;
    }

    if (Object.hasOwn(body, "status")) {
      const allowedStatus = [
        "aktif",
        "perawatan",
        "nonaktif",
      ];

      if (
        typeof body.status !== "string" ||
        !allowedStatus.includes(body.status)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Status harus aktif, perawatan, atau nonaktif.",
          },
          { status: 400 }
        );
      }

      updates.status = body.status;
    }

    for (const field of ["deskripsi", "image_url"]) {
      if (Object.hasOwn(body, field)) {
        if (
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

        updates[field] =
          typeof body[field] === "string"
            ? body[field].trim() || null
            : null;
      }
    }

    if (Object.hasOwn(body, "display_order")) {
      if (
        !Number.isInteger(body.display_order) ||
        body.display_order < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "display_order harus berupa bilangan bulat nonnegatif.",
          },
          { status: 400 }
        );
      }

      updates.display_order = body.display_order;
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

    const { data, error } = await supabase
      .from("iphones")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("UPDATE IPHONE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memperbarui data iPhone.",
        },
        { status: 500 }
      );
    }

    if (!data) {
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
        success: true,
        message: "Data iPhone berhasil diperbarui.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE IPHONE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus unit iPhone
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
        { success: false, message: "ID iPhone tidak valid." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("iphones")
      .delete()
      .eq("id", id)
      .select("id, nama_unit, tipe")
      .maybeSingle();

    if (error) {
      console.error("DELETE IPHONE ERROR:", error);

      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            message: "Unit tidak dapat dihapus karena masih digunakan oleh data lain.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menghapus unit iPhone.",
        },
        { status: 500 }
      );
    }

    if (!data) {
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
        success: true,
        message: "Unit iPhone berhasil dihapus.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE IPHONE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
