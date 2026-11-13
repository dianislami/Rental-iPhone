
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// PATCH: Menandai pesan sudah dibaca
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
          message: "ID pesan tidak valid.",
        },
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
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      body.is_read !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Hanya status is_read = true yang diperbolehkan.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("id", id)
      .eq("sender_type", "visitor")
      .select(`
        id,
        conversation_id,
        sender_type,
        admin_id,
        message,
        is_read,
        created_at
      `)
      .maybeSingle();

    if (error) {
      console.error("UPDATE CHAT MESSAGE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memperbarui status pesan.",
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Pesan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pesan berhasil ditandai sudah dibaca.",
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("UPDATE CHAT MESSAGE API ERROR:", error);

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
// DELETE: Menghapus pesan (Admin)
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
          message: "ID pesan tidak valid.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: existing, error: searchError } =
      await supabase
        .from("chat_messages")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (searchError) {
      console.error("SEARCH CHAT MESSAGE ERROR:", searchError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa pesan.",
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Pesan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE CHAT MESSAGE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menghapus pesan.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pesan berhasil dihapus.",
        deleted_id: id,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE CHAT MESSAGE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
