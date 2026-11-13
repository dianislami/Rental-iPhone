
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    // Memverifikasi identitas berdasarkan JWT
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.json(
        {
          success: false,
          message: "Sesi tidak valid atau belum login.",
        },
        { status: 401 }
      );
    }

    const userId = claimsData.claims.sub;

    // Memastikan pengguna terdaftar sebagai admin
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
      console.error("PROFILE CHECK ERROR:", profileError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa profil admin.",
        },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Akun tidak memiliki akses admin.",
        },
        { status: 403 }
      );
    }

    // Mengambil email dari klaim JWT
    const email = claimsData.claims.email;

    return NextResponse.json(
      {
        success: true,
        message: "Sesi admin aktif.",
        data: {
          id: profile.id,
          email,
          full_name: profile.full_name,
          phone: profile.phone,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("AUTH ME ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
