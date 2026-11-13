
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

// ============================================
// GET: Mengambil seluruh data pelanggan
// ============================================
export async function GET() {
  try {
    // Pemeriksaan hak akses admin
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

    const { data, error } = await supabase
      .from("customers")
      .select("id, nama, no_whatsapp, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET CUSTOMERS ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data pelanggan.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data pelanggan berhasil diambil.",
        total: data.length,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET CUSTOMERS API ERROR:", error);

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
// POST: Menambahkan atau mengenali pelanggan
// ============================================
export async function POST(request: NextRequest) {
  try {
    // 1. Pemeriksaan hak akses admin
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

    // 2. Membaca request body
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

    // 3. Validasi nama pelanggan
    if (
      typeof body.nama !== "string" ||
      !body.nama.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama pelanggan wajib diisi.",
        },
        { status: 400 }
      );
    }

    // 4. Validasi nomor WhatsApp
    if (
      typeof body.no_whatsapp !== "string" ||
      !body.no_whatsapp.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Nomor WhatsApp wajib diisi.",
        },
        { status: 400 }
      );
    }

    const nama = body.nama.trim();
    const noWhatsapp = body.no_whatsapp.trim();

    const supabase = await createClient();

    // 5. Memeriksa apakah pelanggan sudah terdaftar
    const { data: existingCustomer, error: searchError } =
      await supabase
        .from("customers")
        .select("id, nama, no_whatsapp, created_at")
        .eq("no_whatsapp", noWhatsapp)
        .limit(1)
        .maybeSingle();

    if (searchError) {
      console.error("SEARCH CUSTOMER ERROR:", searchError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa data pelanggan.",
        },
        { status: 500 }
      );
    }

    // 6. Jika nomor sudah terdaftar
    if (existingCustomer) {
      return NextResponse.json(
        {
          success: true,
          message: "Pelanggan sudah terdaftar. Gunakan data pelanggan yang ada.",
          is_existing_customer: true,
          customer: existingCustomer,
        },
        { status: 200 }
      );
    }

    // 7. Jika pelanggan belum terdaftar,
    // buat identitas pelanggan baru
    const { data, error } = await supabase
      .from("customers")
      .insert({
        nama,
        no_whatsapp: noWhatsapp,
      })
      .select("id, nama, no_whatsapp, created_at")
      .single();

    if (error) {
      console.error("CREATE CUSTOMER ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menambahkan data pelanggan.",
        },
        { status: 500 }
      );
    }

    // 8. Respons pelanggan baru
    return NextResponse.json(
      {
        success: true,
        message: "Pelanggan baru berhasil didaftarkan.",
        is_existing_customer: false,
        customer: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE CUSTOMER API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
