
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// GET: Mengambil data survei (Admin)
// ============================================
export async function GET(request: NextRequest) {
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

    const supabase = await createClient();

    const conversationId =
      request.nextUrl.searchParams.get("conversation_id");

    if (
      conversationId &&
      !uuidRegex.test(conversationId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "conversation_id tidak valid.",
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from("customer_surveys")
      .select(`
        *,
        chat_conversations (
          id,
          visitor_auth_id,
          status,
          created_at
        )
      `)
      .order("created_at", { ascending: false });

    if (conversationId) {
      query = query.eq("conversation_id", conversationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET CUSTOMER SURVEYS ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data survei.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data survei berhasil diambil.",
        total: data.length,
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET CUSTOMER SURVEYS API ERROR:", error);

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
// POST: Menyimpan survei pengunjung
// ============================================
export async function POST(request: NextRequest) {
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
          message: "Sesi pengunjung tidak valid atau belum login.",
        },
        { status: 401 }
      );
    }

    // 2. Membaca body
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

    // 3. Memeriksa field yang diizinkan
    const allowedFields = [
      "conversation_id",
      "rentang_usia",
      "jenis_kelamin",
      "pekerjaan",
      "domisili",
      "pengalaman_sewa",
      "tujuan_penyewaan",
      "tujuan_lainnya",
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

    // 4. Validasi conversation_id
    if (
      typeof body.conversation_id !== "string" ||
      !uuidRegex.test(body.conversation_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "conversation_id harus berupa UUID yang valid.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi seluruh pertanyaan wajib
    const requiredFields = [
      "rentang_usia",
      "jenis_kelamin",
      "pekerjaan",
      "domisili",
      "pengalaman_sewa",
      "tujuan_penyewaan",
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

    // 6. Validasi tujuan lainnya
    if (
      body.tujuan_lainnya !== undefined &&
      body.tujuan_lainnya !== null &&
      typeof body.tujuan_lainnya !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "tujuan_lainnya harus berupa teks atau null.",
        },
        { status: 400 }
      );
    }

    // 7. Memeriksa kepemilikan percakapan
    // RLS memastikan pengunjung hanya dapat mengakses
    // percakapan miliknya sendiri.
    const { data: conversation, error: conversationError } =
      await supabase
        .from("chat_conversations")
        .select("id, status")
        .eq("id", body.conversation_id)
        .maybeSingle();

    if (conversationError) {
      console.error(
        "CHECK SURVEY CONVERSATION ERROR:",
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
          message: "Percakapan tidak ditemukan atau bukan milik Anda.",
        },
        { status: 404 }
      );
    }

    if (conversation.status !== "open") {
      return NextResponse.json(
        {
          success: false,
          message: "Percakapan sudah ditutup.",
        },
        { status: 409 }
      );
    }

    // 8. Memeriksa survei yang sudah pernah dikirim
    const { data: existingSurvey, error: searchError } =
      await supabase
        .from("customer_surveys")
        .select("id")
        .eq("conversation_id", body.conversation_id)
        .maybeSingle();

    if (searchError) {
      console.error("SEARCH SURVEY ERROR:", searchError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa data survei.",
        },
        { status: 500 }
      );
    }

    if (existingSurvey) {
      return NextResponse.json(
        {
          success: false,
          message: "Survei untuk percakapan ini sudah pernah diisi.",
        },
        { status: 409 }
      );
    }

    // 9. Menyimpan survei
    const { data, error } = await supabase
      .from("customer_surveys")
      .insert({
        conversation_id: body.conversation_id,
        rentang_usia: body.rentang_usia.trim(),
        jenis_kelamin: body.jenis_kelamin.trim(),
        pekerjaan: body.pekerjaan.trim(),
        domisili: body.domisili.trim(),
        pengalaman_sewa: body.pengalaman_sewa.trim(),
        tujuan_penyewaan: body.tujuan_penyewaan.trim(),
        tujuan_lainnya:
          body.tujuan_lainnya?.trim() || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("CREATE SURVEY ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menyimpan data survei.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Survei berhasil disimpan. Anda dapat melanjutkan ke Live Chat.",
        data,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("CREATE SURVEY API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
