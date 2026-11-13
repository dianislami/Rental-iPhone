
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

// GET: Mengambil seluruh data cabang
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("branches")
      .select("id, nama_cabang, alamat, kota, created_at")
      .order("nama_cabang", { ascending: true });

    if (error) {
      console.error("GET BRANCHES ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data cabang.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data cabang berhasil diambil.",
        total: data.length,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET BRANCHES API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

// POST: Menambahkan cabang (khusus admin)
export async function POST(request: NextRequest) {
  try {

    // Memeriksa hak akses admin
    const { admin, response } = await requireAdmin();

    if (response) {
    return response;
    }

    if (!admin) {
    return NextResponse.json(
        {
        success: false,
        message: "Akses admin diperlukan.",
        },
        { status: 403 }
    );
    }

    // Membaca request body
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

    const nama_cabang =
      typeof body.nama_cabang === "string"
        ? body.nama_cabang.trim()
        : "";

    const kota =
      typeof body.kota === "string"
        ? body.kota.trim()
        : "";

    const alamat =
      typeof body.alamat === "string"
        ? body.alamat.trim()
        : null;

    // Validasi input wajib
    if (!nama_cabang || !kota) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama cabang dan kota wajib diisi.",
        },
        { status: 400 }
      );
    }

    // Menyimpan data cabang
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("branches")
      .insert({
        nama_cabang,
        kota,
        alamat: alamat || null,
      })
      .select("id, nama_cabang, alamat, kota, created_at")
      .single();

    if (error) {
      console.error("CREATE BRANCH ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menambahkan cabang.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cabang berhasil ditambahkan.",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE BRANCH API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
