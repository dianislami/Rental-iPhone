
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET: Mengambil detail cabang
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("branches")
      .select("id, nama_cabang, alamat, kota, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("GET BRANCH DETAIL ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil detail cabang.",
        },
        { status: 500 }
      );
    }

    if (!data) {
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
        success: true,
        message: "Detail cabang berhasil diambil.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET BRANCH API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

// PATCH: Memperbarui data cabang
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

    const updates: {
      nama_cabang?: string;
      kota?: string;
      alamat?: string | null;
    } = {};

    if (Object.hasOwn(body, "nama_cabang")) {
      if (
        typeof body.nama_cabang !== "string" ||
        !body.nama_cabang.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Nama cabang tidak boleh kosong.",
          },
          { status: 400 }
        );
      }

      updates.nama_cabang = body.nama_cabang.trim();
    }

    if (Object.hasOwn(body, "kota")) {
      if (
        typeof body.kota !== "string" ||
        !body.kota.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Kota tidak boleh kosong.",
          },
          { status: 400 }
        );
      }

      updates.kota = body.kota.trim();
    }

    if (Object.hasOwn(body, "alamat")) {
      if (
        body.alamat !== null &&
        typeof body.alamat !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Format alamat tidak valid.",
          },
          { status: 400 }
        );
      }

      updates.alamat =
        typeof body.alamat === "string"
          ? body.alamat.trim() || null
          : null;
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
      .from("branches")
      .update(updates)
      .eq("id", id)
      .select("id, nama_cabang, alamat, kota, created_at")
      .maybeSingle();

    if (error) {
      console.error("UPDATE BRANCH ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memperbarui data cabang.",
        },
        { status: 500 }
      );
    }

    if (!data) {
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
        success: true,
        message: "Data cabang berhasil diperbarui.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE BRANCH API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus data cabang
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

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("branches")
      .delete()
      .eq("id", id)
      .select("id, nama_cabang, kota")
      .maybeSingle();

    if (error) {
      console.error("DELETE BRANCH ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menghapus cabang. Periksa apakah cabang masih digunakan oleh data lain.",
        },
        { status: 500 }
      );
    }

    if (!data) {
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
        success: true,
        message: "Cabang berhasil dihapus.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE BRANCH API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
    