
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

// ============================================
// GET: Mengambil percakapan
// Admin: seluruh percakapan
// Pengunjung: percakapan miliknya sendiri
// ============================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Memeriksa sesi pengguna
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Sesi tidak valid atau belum login.",
        },
        { status: 401 }
      );
    }

    // ========================================
    // 2. GET UNTUK PENGUNJUNG ANONIM
    // ========================================
    if (user.is_anonymous) {
      const {
        data: conversation,
        error,
      } = await supabase
        .from("chat_conversations")
        .select(`
          id,
          visitor_auth_id,
          status,
          created_at,
          updated_at,
          last_message_at
        `)
        .eq("visitor_auth_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "GET VISITOR CONVERSATION ERROR:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message: "Gagal mengambil percakapan pengunjung.",
          },
          { status: 500 }
        );
      }

      if (!conversation) {
        return NextResponse.json(
          {
            success: false,
            message: "Anda belum memiliki percakapan.",
            is_existing_conversation: false,
            data: null,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Percakapan pengunjung berhasil diambil.",
          is_existing_conversation: true,
          is_closed: conversation.status === "closed",
          data: conversation,
        },
        { status: 200 }
      );
    }

    // ========================================
    // 3. GET UNTUK ADMIN
    // ========================================
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    // Validasi filter status
    if (
      status &&
      !["open", "closed"].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Status percakapan tidak valid.",
        },
        { status: 400 }
      );
    }

    // Mengambil seluruh percakapan
    let query = supabase
      .from("chat_conversations")
      .select(`
        id,
        visitor_auth_id,
        status,
        created_at,
        updated_at,
        last_message_at
      `)
      .order("last_message_at", {
        ascending: false,
        nullsFirst: false,
      })
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "GET CHAT CONVERSATIONS ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data percakapan.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data percakapan berhasil diambil.",
        total: data.length,
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "GET CHAT CONVERSATIONS API ERROR:",
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
// POST: Membuat atau mengambil percakapan
// berdasarkan identitas pengunjung anonim
// ============================================
export async function POST() {
  try {
    const supabase = await createClient();

    // 1. Memeriksa sesi pengunjung
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Silakan login sebagai pengunjung terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    // 2. Memastikan akun anonim
    if (!user.is_anonymous) {
      return NextResponse.json(
        {
          success: false,
          message: "Sesi pengunjung anonim diperlukan.",
        },
        { status: 403 }
      );
    }

    // 3. Mencari percakapan terakhir milik pengunjung
    const {
      data: existingConversation,
      error: searchError,
    } = await supabase
      .from("chat_conversations")
      .select(`
        id,
        visitor_auth_id,
        status,
        created_at,
        updated_at,
        last_message_at
      `)
      .eq("visitor_auth_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (searchError) {
      console.error(
        "SEARCH CONVERSATION ERROR:",
        searchError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa percakapan sebelumnya.",
        },
        { status: 500 }
      );
    }

    // 4. Jika percakapan ditutup admin
    if (existingConversation?.status === "closed") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akses Live Chat Anda telah dibatasi oleh admin.",
          is_blocked: true,
        },
        { status: 403 }
      );
    }

    // 5. Jika percakapan masih terbuka
    if (existingConversation?.status === "open") {
      return NextResponse.json(
        {
          success: true,
          message: "Anda sudah memiliki percakapan aktif.",
          is_existing_conversation: true,
          data: existingConversation,
        },
        { status: 200 }
      );
    }

    // 6. Membuat percakapan baru
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        visitor_auth_id: user.id,
        status: "open",
      })
      .select(`
        id,
        visitor_auth_id,
        status,
        created_at,
        updated_at,
        last_message_at
      `)
      .single();

    if (error) {
      console.error(
        "CREATE CONVERSATION ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal membuat percakapan baru.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Percakapan berhasil dibuat.",
        is_existing_conversation: false,
        data,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(
      "CREATE CONVERSATION API ERROR:",
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
