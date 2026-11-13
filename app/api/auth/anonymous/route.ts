
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================
// POST: Membuat sesi pengunjung anonim
// ============================================
export async function POST() {
  try {
    const supabase = await createClient();

    // 1. Memeriksa sesi pengguna yang sedang aktif
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // 2. Jika sudah login sebagai pengunjung anonim
    if (user && !userError && user.is_anonymous) {
      return NextResponse.json(
        {
          success: true,
          message: "Sesi pengunjung anonim sudah aktif.",
          data: {
            id: user.id,
            is_anonymous: true,
          },
        },
        { status: 200 }
      );
    }

    // 3. Jika masih login menggunakan akun admin
    // atau akun biasa, jangan membuat sesi baru
    if (user && !userError && !user.is_anonymous) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sesi akun biasa terdeteksi. Gunakan sesi pengunjung terpisah.",
        },
        { status: 409 }
      );
    }

    // 4. Membuat sesi pengunjung anonim baru
    const {
      data,
      error: anonymousError,
    } = await supabase.auth.signInAnonymously();

    if (anonymousError) {
      console.error(
        "ANONYMOUS SIGN IN ERROR:",
        anonymousError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal membuat sesi pengunjung anonim.",
        },
        { status: 400 }
      );
    }

    // 5. Memastikan data pengguna tersedia
    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pengunjung anonim tidak ditemukan.",
        },
        { status: 500 }
      );
    }

    // 6. Memastikan akun benar-benar anonim
    if (!data.user.is_anonymous) {
      return NextResponse.json(
        {
          success: false,
          message: "Identitas pengunjung bukan akun anonim.",
        },
        { status: 500 }
      );
    }

    // 7. Respons berhasil
    return NextResponse.json(
      {
        success: true,
        message: "Sesi pengunjung anonim berhasil dibuat.",
        data: {
          id: data.user.id,
          is_anonymous: data.user.is_anonymous,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("ANONYMOUS AUTH API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
