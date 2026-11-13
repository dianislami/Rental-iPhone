
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// GET: Mengambil pesan berdasarkan percakapan
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

    // 2. Mengambil conversation_id
    const conversationId =
      request.nextUrl.searchParams.get("conversation_id");

    if (!conversationId || !uuidRegex.test(conversationId)) {
      return NextResponse.json(
        {
          success: false,
          message: "conversation_id wajib diisi dengan UUID yang valid.",
        },
        { status: 400 }
      );
    }

    // 3. Mengambil pesan
    const { data, error } = await supabase
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
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET CHAT MESSAGES ERROR:", error);

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
        message: "Pesan berhasil diambil.",
        total: data.length,
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET CHAT MESSAGES API ERROR:", error);

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
// POST: Mengirim pesan pengunjung atau admin
// ============================================
export async function POST(request: NextRequest) {
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
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    // 2. Menentukan jenis pengirim
    const { admin } = await requireAdmin();

    const isAdmin = !!admin;

    // Pengunjung wajib menggunakan akun anonim
    if (!isAdmin && !user.is_anonymous) {
      return NextResponse.json(
        {
          success: false,
          message: "Akun pengunjung harus menggunakan sesi anonim.",
        },
        { status: 403 }
      );
    }

    const senderType = isAdmin ? "admin" : "visitor";
    const adminId = isAdmin ? admin.id : null;

    // 3. Membaca request body
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

    // 4. Validasi field
    const allowedFields = ["conversation_id", "message"];

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

    // 5. Validasi conversation_id
    if (
      typeof body.conversation_id !== "string" ||
      !uuidRegex.test(body.conversation_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "conversation_id tidak valid.",
        },
        { status: 400 }
      );
    }

    // 6. Validasi pesan
    if (
      typeof body.message !== "string" ||
      !body.message.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Pesan tidak boleh kosong.",
        },
        { status: 400 }
      );
    }

    const message = body.message.trim();

    if (message.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: "Pesan maksimal 5000 karakter.",
        },
        { status: 400 }
      );
    }

    // 7. Memeriksa percakapan
    // RLS memastikan pengunjung hanya dapat
    // mengakses percakapannya sendiri.
    const {
      data: conversation,
      error: conversationError,
    } = await supabase
      .from("chat_conversations")
      .select("id, status")
      .eq("id", body.conversation_id)
      .maybeSingle();

    if (conversationError) {
      console.error(
        "CHECK CONVERSATION ERROR:",
        conversationError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa percakapan.",
        },
        { status: 500 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: "Percakapan tidak ditemukan atau tidak memiliki akses.",
        },
        { status: 404 }
      );
    }

    // 8. Memeriksa status percakapan
    if (!isAdmin && conversation.status !== "open") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Percakapan telah ditutup oleh admin. Anda tidak dapat mengirim pesan lagi.",
        },
        { status: 409 }
      );
    }

    // 9. Memeriksa survei khusus pengunjung
    // Admin tidak diwajibkan mengisi survei.
    if (!isAdmin) {
      const { data: survey, error: surveyError } =
        await supabase
          .from("customer_surveys")
          .select("id")
          .eq("conversation_id", body.conversation_id)
          .maybeSingle();

      if (surveyError) {
        console.error(
          "CHECK CUSTOMER SURVEY ERROR:",
          surveyError
        );

        return NextResponse.json(
          {
            success: false,
            message: "Gagal memeriksa status survei.",
          },
          { status: 500 }
        );
      }

      if (!survey) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Silakan isi survei terlebih dahulu sebelum memulai Live Chat.",
          },
          { status: 403 }
        );
      }
    }

    // 10. Menyimpan pesan
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: body.conversation_id,
        sender_type: senderType,
        admin_id: adminId,
        message,
        is_read: false,
      })
      .select(`
        id,
        conversation_id,
        sender_type,
        admin_id,
        message,
        is_read,
        created_at
      `)
      .single();

    if (error) {
      console.error("CREATE CHAT MESSAGE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengirim pesan.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pesan berhasil dikirim.",
        data,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("CREATE CHAT MESSAGE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
