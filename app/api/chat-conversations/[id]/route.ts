
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// GET: Mengambil detail percakapan dan pesan
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
          message: "ID percakapan tidak valid.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Mengambil data percakapan
    const { data: conversation, error: conversationError } =
      await supabase
        .from("chat_conversations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (conversationError) {
      console.error(
        "GET CONVERSATION DETAIL ERROR:",
        conversationError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil detail percakapan.",
        },
        { status: 500 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: "Percakapan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // 2. Mengambil seluruh pesan dalam percakapan
    const { data: messages, error: messagesError } =
      await supabase
        .from("chat_messages")
        .select(`
          id,
          conversation_id,
          sender_type,
          admin_id,
          message,
          is_read,
          created_at
        `)
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });

    if (messagesError) {
      console.error(
        "GET CONVERSATION MESSAGES ERROR:",
        messagesError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil pesan percakapan.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Detail percakapan berhasil diambil.",
        data: {
          ...conversation,
          total_messages: messages.length,
          messages,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "GET CONVERSATION DETAIL API ERROR:",
      error
    );

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
// PATCH: Mengubah status percakapan
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
          message: "ID percakapan tidak valid.",
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

    // 4. Hanya status yang boleh diubah
    const fields = Object.keys(body);

    if (
      fields.length !== 1 ||
      fields[0] !== "status"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Hanya kolom status yang dapat diperbarui.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi status
    if (!["open", "closed"].includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status harus open atau closed.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 6. Memeriksa keberadaan percakapan
    const { data: existing, error: searchError } =
      await supabase
        .from("chat_conversations")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (searchError) {
      console.error(
        "SEARCH CONVERSATION ERROR:",
        searchError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa percakapan.",
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Percakapan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // 7. Memperbarui status
    const { data, error } = await supabase
      .from("chat_conversations")
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(
        "UPDATE CONVERSATION ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memperbarui status percakapan.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Status percakapan berhasil diperbarui.",
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "UPDATE CONVERSATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
