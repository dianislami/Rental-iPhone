
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("branches")
      .select("id, nama_cabang, kota")
      .order("nama_cabang");

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data cabang",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Koneksi Supabase berhasil",
      total: data.length,
      data,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
}
