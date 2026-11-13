
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  // 1. Verifikasi sesi pengguna
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      admin: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Silakan login terlebih dahulu.",
        },
        { status: 401 }
      ),
    };
  }

  const userId = claimsData.claims.sub;

  // 2. Verifikasi keberadaan profil admin
  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", userId)
      .maybeSingle();

  if (profileError) {
    console.error("ADMIN PROFILE ERROR:", profileError);

    return {
      admin: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Gagal memverifikasi hak akses admin.",
        },
        { status: 500 }
      ),
    };
  }

  // 3. Tolak pengguna tanpa profil admin
  if (!profile) {
    return {
      admin: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Forbidden. Anda tidak memiliki akses admin.",
        },
        { status: 403 }
      ),
    };
  }

  // 4. Admin berhasil diverifikasi
  return {
    admin: {
      id: profile.id,
      email: claimsData.claims.email,
      full_name: profile.full_name,
      phone: profile.phone,
    },
    response: null,
  };
}
