
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Membaca request body
    const body = await request.json();

    const email =
      typeof body.email === "string" ? body.email.trim() : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    // 2. Validasi input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email dan password wajib diisi.",
        },
        { status: 400 }
      );
    }

    // 3. Membuat koneksi Supabase server
    const supabase = await createClient();

    // 4. Autentikasi menggunakan Supabase Auth
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Email atau password tidak valid.",
        },
        { status: 401 }
      );
    }

    // 5. Memastikan pengguna terdaftar sebagai admin
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", data.user.id)
        .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          message: "Akun tidak memiliki akses admin.",
        },
        { status: 403 }
      );
    }

    // 6. Login berhasil
    return NextResponse.json(
      {
        success: true,
        message: "Login admin berhasil.",
        data: {
          id: profile.id,
          email: data.user.email,
          full_name: profile.full_name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("LOGIN API ERROR:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
