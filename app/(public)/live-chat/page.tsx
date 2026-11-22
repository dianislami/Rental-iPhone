"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IphoneVisual } from "@/components/public/IphoneVisual";
import { BackButton } from "@/components/public/BackButton";
import { getColorHex } from "@/lib/public-data";

interface ChatConversation {
  id: string;
  visitor_auth_id: string;
  status: "open" | "closed";
  created_at: string;
  updated_at?: string;
  last_message_at?: string | null;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: "visitor" | "admin";
  admin_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface SurveyData {
  id?: string;
  conversation_id: string;
  rentang_usia: string;
  jenis_kelamin: string;
  pekerjaan: string;
  domisili: string;
  pengalaman_sewa: string;
  tujuan_penyewaan: string;
  tujuan_lainnya: string | null;
}

interface ProductCatalogPayload {
  unitId?: string;
  unit: string;
  tipe?: string;
  storage?: string;
  warna?: string;
  baterai?: string;
  durasi?: string;
  harga?: string;
  cabang?: string;
  jadwal?: string;
  image?: string;
}

const USIA_OPTIONS = [
  "< 18 Tahun",
  "18 – 24 Tahun",
  "25 – 34 Tahun",
  "35 – 44 Tahun",
  "45+ Tahun",
];

const GENDER_OPTIONS = ["Laki-laki", "Perempuan"];

const PEKERJAAN_OPTIONS = [
  "Mahasiswa / Pelajar",
  "Kreator Konten / Fotografer",
  "Karyawan Swasta",
  "ASN / BUMN",
  "Wiraswasta / Bisnis",
  "Lainnya",
];

const DOMISILI_OPTIONS = [
  "Banda Aceh",
  "Aceh Besar",
  "Bireuen",
  "Lhokseumawe",
  "Meulaboh / Aceh Barat",
  "Luar Aceh (Wisatawan / Dinas)",
];

const PENGALAMAN_OPTIONS = [
  "Baru Pertama Kali",
  "Pernah Sewa di iRent (1–3x)",
  "Pelanggan Setia iRent (>3x)",
  "Pernah Sewa di Tempat Lain",
];

const TUJUAN_OPTIONS = [
  "Konten Kreator & Sosial Media",
  "Wisata & Liburan (Sabang / Aceh)",
  "Acara Wisuda / Pernikahan",
  "Produksi Event & Korporasi",
  "Uji Coba Sebelum Membeli",
  "Lainnya",
];

const QUICK_MESSAGES = [
  "Halo Admin, apakah unit iPhone masih tersedia hari ini?",
  "Apa saja syarat sewa untuk mahasiswa (KTM)?",
  "Saya ingin tanya paket hemat 3 hari untuk liburan.",
  "Apakah bisa ambil di Banda Aceh dan kembalikan di cabang lain?",
];

const CATALOG_TAG_REGEX =
  /^\[KATALOG_PRODUK\]([\s\S]*?)\[\/KATALOG_PRODUK\]\n?([\s\S]*)$/;

function parseCatalogMessage(raw: string): {
  catalog: ProductCatalogPayload | null;
  text: string;
} {
  const match = raw.match(CATALOG_TAG_REGEX);
  if (!match) {
    return { catalog: null, text: raw };
  }
  try {
    const parsed = JSON.parse(match[1]) as ProductCatalogPayload;
    return {
      catalog: parsed,
      text: (match[2] || "").trim(),
    };
  } catch {
    return { catalog: null, text: raw };
  }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function LiveChatContent() {
  const searchParams = useSearchParams();
  const unitIdParam = searchParams.get("unitId");
  const unitParam = searchParams.get("unit");
  const tipeParam = searchParams.get("tipe");
  const storageParam = searchParams.get("storage");
  const warnaParam = searchParams.get("warna");
  const bateraiParam = searchParams.get("baterai");
  const durasiParam = searchParams.get("durasi");
  const hargaParam = searchParams.get("harga");
  const cabangParam = searchParams.get("cabang");
  const jadwalParam = searchParams.get("jadwal");
  const imageParam = searchParams.get("image");

  // Session & Conversation States
  const [initializing, setInitializing] = useState(true);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null
  );
  const [isBlocked, setIsBlocked] = useState(false);
  const [nonAnonConflict, setNonAnonConflict] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Survey States
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  const [rentangUsia, setRentangUsia] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [pekerjaan, setPekerjaan] = useState("");
  const [domisili, setDomisili] = useState(
    cabangParam?.toLowerCase().includes("bireuen")
      ? "Bireuen"
      : cabangParam?.toLowerCase().includes("lhokseumawe")
      ? "Lhokseumawe"
      : cabangParam?.toLowerCase().includes("meulaboh")
      ? "Meulaboh / Aceh Barat"
      : ""
  );
  const [pengalamanSewa, setPengalamanSewa] = useState("");
  const [tujuanPenyewaan, setTujuanPenyewaan] = useState("");
  const [tujuanLainnya, setTujuanLainnya] = useState(
    unitParam
      ? `Tertarik menyewa ${unitParam}${durasiParam ? ` (${durasiParam})` : ""}`
      : ""
  );

  // Chat Messages States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSentSignatureRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(
        `/api/chat-messages?conversation_id=${encodeURIComponent(convId)}`
      );
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data);
      }
    } catch {
      // Ignore transient network errors
    } finally {
      setMessagesLoaded(true);
    }
  }, []);

  const initAnonymousChat = useCallback(async () => {
    setInitializing(true);
    setErrorMsg(null);
    setNonAnonConflict(false);

    try {
      // 1. Create or verify anonymous Supabase session
      const anonRes = await fetch("/api/auth/anonymous", {
        method: "POST",
      });
      const anonJson = await anonRes.json();

      if (anonRes.status === 409) {
        setNonAnonConflict(true);
        setInitializing(false);
        return;
      }

      if (!anonRes.ok || !anonJson.success) {
        setErrorMsg(
          anonJson.message || "Gagal menginisialisasi sesi pengunjung anonim."
        );
        setInitializing(false);
        return;
      }

      setVisitorId(anonJson.data?.id || null);

      // 2. Create or fetch open conversation for this anonymous visitor
      const convRes = await fetch("/api/chat-conversations", {
        method: "POST",
      });
      const convJson = await convRes.json();

      if (convRes.status === 403 && convJson.is_blocked) {
        setIsBlocked(true);
        setInitializing(false);
        return;
      }

      if (!convRes.ok || !convJson.success || !convJson.data) {
        setErrorMsg(convJson.message || "Gagal memuat ruang percakapan.");
        setInitializing(false);
        return;
      }

      const activeConv: ChatConversation = convJson.data;
      setConversation(activeConv);

      // 3. Check if survey already exists for this conversation_id
      const supabase = createClient();
      const { data: existingSurvey } = await supabase
        .from("customer_surveys")
        .select("*")
        .eq("conversation_id", activeConv.id)
        .maybeSingle();

      const localCached =
        typeof window !== "undefined"
          ? localStorage.getItem(`irent_survey_${activeConv.id}`)
          : null;

      if (existingSurvey || localCached) {
        setSurveyCompleted(true);
        await fetchMessages(activeConv.id);
      }
    } catch {
      setErrorMsg(
        "Tidak dapat terhubung ke layanan Live Chat. Pastikan koneksi internet dan konfigurasi Supabase aktif."
      );
    } finally {
      setInitializing(false);
    }
  }, [fetchMessages]);

  useEffect(() => {
    initAnonymousChat();
  }, [initAnonymousChat]);

  // Send message helper
  const sendMessageToServer = useCallback(
    async (textToSend: string, isAutoCatalog = false) => {
      const trimmed = textToSend.trim();
      if (!trimmed || !conversation?.id) return;

      if (!isAutoCatalog) {
        setSendingMessage(true);
        setErrorMsg(null);
        setInputMessage("");
      }

      try {
        const res = await fetch("/api/chat-messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversation.id,
            message: trimmed,
          }),
        });

        const json = await res.json();

        if (res.ok && json.success && json.data) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === json.data.id);
            return exists ? prev : [...prev, json.data];
          });
        } else if (!isAutoCatalog) {
          setErrorMsg(json.message || "Gagal mengirim pesan.");
          setInputMessage(trimmed);
        }
      } catch {
        if (!isAutoCatalog) {
          setErrorMsg("Gagal mengirim pesan. Periksa koneksi Anda.");
          setInputMessage(trimmed);
        }
      } finally {
        if (!isAutoCatalog) {
          setSendingMessage(false);
        }
      }
    },
    [conversation?.id]
  );

  // Automatic Shopee-style Product Catalog Message when entering from a Product Page
  useEffect(() => {
    if (
      !surveyCompleted ||
      !conversation?.id ||
      conversation.status === "closed" ||
      !messagesLoaded ||
      !unitParam
    ) {
      return;
    }

    // Unique signature for the current product + variant selection
    const currentSignature = `${unitIdParam || unitParam}__${
      warnaParam || ""
    }__${durasiParam || ""}__${hargaParam || ""}`;

    if (autoSentSignatureRef.current === currentSignature) {
      return;
    }

    const storageKey = `irent_last_sent_product_${conversation.id}`;
    const lastSentInStorage =
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;

    // Also inspect existing messages to check if the latest product catalog sent in this chat is already this exact product
    const catalogMessages = messages
      .map((m) => parseCatalogMessage(m.message).catalog)
      .filter((c): c is ProductCatalogPayload => c !== null);
    const latestCatalog =
      catalogMessages.length > 0
        ? catalogMessages[catalogMessages.length - 1]
        : null;
    const latestCatalogSignature = latestCatalog
      ? `${latestCatalog.unitId || latestCatalog.unit}__${
          latestCatalog.warna || ""
        }__${latestCatalog.durasi || ""}__${latestCatalog.harga || ""}`
      : null;

    if (
      lastSentInStorage === currentSignature ||
      latestCatalogSignature === currentSignature
    ) {
      autoSentSignatureRef.current = currentSignature;
      return;
    }

    // Mark as sent immediately so it only sends ONCE for this product
    autoSentSignatureRef.current = currentSignature;
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, currentSignature);
    }

    const catalogPayload: ProductCatalogPayload = {
      unitId: unitIdParam || undefined,
      unit: unitParam,
      tipe: tipeParam || unitParam,
      storage: storageParam || undefined,
      warna: warnaParam || undefined,
      baterai: bateraiParam || undefined,
      durasi: durasiParam || "Harian",
      harga: hargaParam || undefined,
      cabang: cabangParam || undefined,
      jadwal: jadwalParam || undefined,
      image: imageParam || undefined,
    };

    const autoMessage = `[KATALOG_PRODUK]${JSON.stringify(
      catalogPayload
    )}[/KATALOG_PRODUK]\nHalo Admin, saya tertarik menyewa unit ${unitParam}${
      durasiParam ? ` untuk durasi ${durasiParam}` : ""
    }${hargaParam ? ` (${hargaParam})` : ""}${
      jadwalParam ? ` pada jadwal ${jadwalParam}` : ""
    }. Apakah unit ini tersedia?`;

    sendMessageToServer(autoMessage, true);
  }, [
    surveyCompleted,
    conversation?.id,
    conversation?.status,
    messagesLoaded,
    messages,
    unitIdParam,
    unitParam,
    tipeParam,
    storageParam,
    warnaParam,
    bateraiParam,
    durasiParam,
    hargaParam,
    cabangParam,
    jadwalParam,
    imageParam,
    sendMessageToServer,
  ]);

  // Realtime subscription + polling when surveyCompleted and conversation is open
  useEffect(() => {
    if (!surveyCompleted || !conversation?.id) return;

    const convId = conversation.id;
    const supabase = createClient();

    const channel = supabase
      .channel(`visitor-chat-${convId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${convId}`,
        },
        () => {
          fetchMessages(convId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_conversations",
          filter: `id=eq.${convId}`,
        },
        (payload) => {
          if (
            payload.new &&
            (payload.new as ChatConversation).status === "closed"
          ) {
            setConversation((prev) =>
              prev ? { ...prev, status: "closed" } : prev
            );
          }
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchMessages(convId);
    }, 4500);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [surveyCompleted, conversation?.id, fetchMessages]);

  useEffect(() => {
    if (surveyCompleted) {
      scrollToBottom();
    }
  }, [messages.length, surveyCompleted, scrollToBottom]);

  // Handle logout if admin session conflicted with anonymous visitor
  async function handleSwitchToAnonymous() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await initAnonymousChat();
    } catch {
      setErrorMsg("Gagal beralih ke sesi pengunjung anonim.");
    }
  }

  // Handle Survey Submission
  async function handleSurveySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!conversation?.id) return;

    if (
      !rentangUsia ||
      !jenisKelamin ||
      !pekerjaan ||
      !domisili ||
      !pengalamanSewa ||
      !tujuanPenyewaan
    ) {
      setErrorMsg("Mohon lengkapi seluruh 6 pertanyaan survei wajib di bawah.");
      return;
    }

    setSubmittingSurvey(true);
    setErrorMsg(null);

    const payload: SurveyData = {
      conversation_id: conversation.id,
      rentang_usia: rentangUsia,
      jenis_kelamin: jenisKelamin,
      pekerjaan,
      domisili,
      pengalaman_sewa: pengalamanSewa,
      tujuan_penyewaan: tujuanPenyewaan,
      tujuan_lainnya: tujuanLainnya.trim() || null,
    };

    try {
      const res = await fetch("/api/customer-surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      // 201 Created or 409 Already Submitted both unlock Live Chat
      if (res.ok || res.status === 409) {
        const surveyRecord: SurveyData = json.data || payload;
        if (typeof window !== "undefined") {
          localStorage.setItem(
            `irent_survey_${conversation.id}`,
            JSON.stringify(surveyRecord)
          );
        }
        await fetchMessages(conversation.id);
        setSurveyCompleted(true);
      } else {
        setErrorMsg(json.message || "Gagal menyimpan survei pengunjung.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat mengirim survei.");
    } finally {
      setSubmittingSurvey(false);
    }
  }

  const completedCount = [
    rentangUsia,
    jenisKelamin,
    pekerjaan,
    domisili,
    pengalamanSewa,
    tujuanPenyewaan,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-6 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-5 flex items-center justify-between">
          <BackButton fallbackHref="/katalog" />
        </div>

        {/* TOP PAGE HEADER & STEP PROGRESS BAR (ONLY SHOWN DURING SURVEY) */}
        {!surveyCompleted && (
          <>
            <div className="mb-8 text-center space-y-2.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#D2D2D7]/80 px-3.5 py-1 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-[#0071E3]"></span>
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#0071E3]">
                  LIVE CHAT
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
                Ada yang Ingin Kamu Tanyakan?
              </h1>

              <p className="mx-auto max-w-2xl text-[14px] text-[#6E6E73]">
                Sebelum memulai percakapan, isi survei singkat berikut terlebih dahulu.
                Kamu tidak perlu membuat akun atau login. Setelah selesai, kamu bisa langsung menghubungi admin iRent melalui fitur Live Chat.
              </p>
            </div>

            <div className="mx-auto mb-8 max-w-md">
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-2 border border-[#D2D2D7]/60 shadow-2xs">
                <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[12px] font-semibold bg-[#0071E3] text-white shadow-xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold bg-white text-[#0071E3]">
                    1
                  </span>
                  <span>Isi Survei Pengunjung</span>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[12px] font-semibold bg-[#F5F5F7] text-[#86868B]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold bg-[#D2D2D7]/70 text-[#6E6E73]">
                    2
                  </span>
                  <span>Mulai Live Chat</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ERROR / ALERT BANNER */}
        {errorMsg && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-5 py-3.5 text-[13px] text-red-700 flex items-center justify-between gap-4">
            <span>⚠️ {errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs font-bold underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {initializing ? (
          <div className="apple-card rounded-[32px] bg-white p-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0071E3] animate-pulse">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-[15px] font-bold text-[#1D1D1F]">
              Menyiapkan Survey...
            </p>
          </div>
        ) : nonAnonConflict ? (
          /* ADMIN SESSION CONFLICT NOTICE */
          <div className="apple-card rounded-[32px] bg-white p-10 text-center max-w-lg mx-auto space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F2FF] text-[#0071E3]">
              🔐
            </div>
            <h2 className="text-lg font-bold text-[#1D1D1F]">
              Sesi Akun Admin Terdeteksi
            </h2>
            <p className="text-[13px] text-[#6E6E73] leading-relaxed">
              Browser ini sedang login menggunakan akun biasa/admin. Untuk
              menggunakan fitur Live Chat sebagai pengunjung anonim, silakan
              beralih ke sesi pengunjung terlebih dahulu.
            </p>
            <button
              type="button"
              onClick={handleSwitchToAnonymous}
              className="inline-flex items-center justify-center rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-6 py-3 text-[13px] font-semibold text-white transition-all"
            >
              Beralih ke Sesi Pengunjung Anonim
            </button>
          </div>
        ) : isBlocked ? (
          /* BLOCKED / CLOSED CONVERSATION */
          <div className="apple-card rounded-[32px] bg-white p-10 text-center max-w-lg mx-auto space-y-4">
            <h2 className="text-lg font-bold text-[#1D1D1F]">
              Sesi Percakapan Telah Ditutup
            </h2>
            <p className="text-[13px] text-[#6E6E73]">
              Sesi percakapan Anda sebelumnya telah diselesaikan atau dibatasi
              oleh Admin. Anda tetap dapat menghubungi kami melalui WhatsApp.
            </p>
            <a
              href="https://wa.me/6281168908888"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#0071E3] px-6 py-3 text-[13px] font-semibold text-white"
            >
              Hubungi via WhatsApp
            </a>
          </div>
        ) : !surveyCompleted ? (
          /* ==========================================
             PHASE 1: PRE-CHAT CUSTOMER SURVEY FORM
             ========================================== */
          <div className="apple-card rounded-[32px] bg-white p-6 sm:p-10">
            {/* Selected Unit Context Banner (if navigated from Detail page) */}
            {unitParam && (
              <div className="mb-8 rounded-2xl bg-[#E8F2FF] border border-[#0071E3]/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0071E3] text-white text-sm">
                    📱
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#0071E3]">
                      PRODUK YANG AKAN DITANYAKAN OTOMATIS
                    </p>
                    <p className="text-[13.5px] font-bold text-[#1D1D1F]">
                      {unitParam} {durasiParam ? `• Paket ${durasiParam}` : ""}{" "}
                      {hargaParam ? `• ${hargaParam}` : ""}
                    </p>
                  </div>
                </div>
                {cabangParam && (
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#0071E3]">
                    📍 {cabangParam}
                  </span>
                )}
              </div>
            )}

            {/* Header inside Survey Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#F5F5F7]">
              <div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  Data Profil Singkat Pengunjung
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F5F7] px-3.5 py-1.5 text-[12px] font-semibold text-[#1D1D1F]">
                <span className="text-[#0071E3]">{completedCount}/6</span>{" "}
                Terisi
              </div>
            </div>

            <form onSubmit={handleSurveySubmit} className="mt-7 space-y-7">
              {/* 1. Rentang Usia */}
              <div>
                <label className="block text-[13.5px] font-bold text-[#1D1D1F] mb-2.5">
                  1. Rentang Usia Anda <span className="text-[#0071E3]">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {USIA_OPTIONS.map((opt) => {
                    const active = rentangUsia === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setRentangUsia(opt)}
                        className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all ${
                          active
                            ? "bg-[#0071E3] text-white shadow-xs"
                            : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8F2FF] hover:text-[#0071E3]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Jenis Kelamin */}
              <div>
                <label className="block text-[13.5px] font-bold text-[#1D1D1F] mb-2.5">
                  2. Jenis Kelamin <span className="text-[#0071E3]">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {GENDER_OPTIONS.map((opt) => {
                    const active = jenisKelamin === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setJenisKelamin(opt)}
                        className={`rounded-full px-5 py-2 text-[12.5px] font-semibold transition-all ${
                          active
                            ? "bg-[#0071E3] text-white shadow-xs"
                            : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8F2FF] hover:text-[#0071E3]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Pekerjaan */}
              <div>
                <label className="block text-[13.5px] font-bold text-[#1D1D1F] mb-2.5">
                  3. Pekerjaan / Aktivitas Saat Ini{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {PEKERJAAN_OPTIONS.map((opt) => {
                    const active = pekerjaan === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPekerjaan(opt)}
                        className={`rounded-2xl px-4 py-3 text-left text-[12.5px] font-semibold transition-all border ${
                          active
                            ? "bg-[#0071E3] text-white border-[#0071E3] shadow-xs"
                            : "bg-[#F5F5F7]/70 text-[#1D1D1F] border-transparent hover:border-[#0071E3]/30 hover:bg-[#E8F2FF]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Domisili */}
              <div>
                <label className="block text-[13.5px] font-bold text-[#1D1D1F] mb-2.5">
                  4. Domisili / Area Cabang Terdekat{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {DOMISILI_OPTIONS.map((opt) => {
                    const active = domisili === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDomisili(opt)}
                        className={`rounded-2xl px-4 py-3 text-left text-[12.5px] font-semibold transition-all border ${
                          active
                            ? "bg-[#0071E3] text-white border-[#0071E3] shadow-xs"
                            : "bg-[#F5F5F7]/70 text-[#1D1D1F] border-transparent hover:border-[#0071E3]/30 hover:bg-[#E8F2FF]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Pengalaman Sewa */}
              <div>
                <label className="block text-[13.5px] font-bold text-[#1D1D1F] mb-2.5">
                  5. Pengalaman Menyewa iPhone{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PENGALAMAN_OPTIONS.map((opt) => {
                    const active = pengalamanSewa === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPengalamanSewa(opt)}
                        className={`rounded-2xl px-4 py-3 text-left text-[12.5px] font-semibold transition-all border ${
                          active
                            ? "bg-[#0071E3] text-white border-[#0071E3] shadow-xs"
                            : "bg-[#F5F5F7]/70 text-[#1D1D1F] border-transparent hover:border-[#0071E3]/30 hover:bg-[#E8F2FF]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Tujuan Penyewaan */}
              <div>
                <label className="block text-[13.5px] font-bold text-[#1D1D1F] mb-2.5">
                  6. Tujuan Utama Penyewaan{" "}
                  <span className="text-[#0071E3]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {TUJUAN_OPTIONS.map((opt) => {
                    const active = tujuanPenyewaan === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTujuanPenyewaan(opt)}
                        className={`rounded-2xl px-4 py-3 text-left text-[12.5px] font-semibold transition-all border ${
                          active
                            ? "bg-[#0071E3] text-white border-[#0071E3] shadow-xs"
                            : "bg-[#F5F5F7]/70 text-[#1D1D1F] border-transparent hover:border-[#0071E3]/30 hover:bg-[#E8F2FF]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. Tujuan Lainnya / Catatan Tambahan */}
              <div>
                <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">
                  Catatan Tambahan / Tipe iPhone yang Diminati{" "}
                  <span className="text-[#86868B] font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={tujuanLainnya}
                  onChange={(e) => setTujuanLainnya(e.target.value)}
                  placeholder="Contoh: Ingin sewa iPhone 16 Pro warna Natural Titanium untuk akhir pekan..."
                  className="w-full rounded-2xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] border border-[#D2D2D7]/70 focus:bg-white focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/15 transition-all"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-[#F5F5F7] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11.5px] text-[#86868B]">
                  Survei ini hanya diisi 1 kali untuk membuka sesi Live Chat
                  Anda.
                </p>

                <button
                  type="submit"
                  disabled={submittingSurvey || completedCount < 6}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[13.5px] font-semibold text-white transition-all ${
                    completedCount < 6 || submittingSurvey
                      ? "bg-[#0071E3]/45 cursor-not-allowed"
                      : "bg-[#0071E3] hover:bg-[#0077ED] shadow-md shadow-[#0071E3]/25 hover:scale-[1.01]"
                  }`}
                >
                  {submittingSurvey
                    ? "Menyimpan Survei..."
                    : "Kirim Survei & Mulai Live Chat →"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ==========================================
             PHASE 2: SINGLE UNIFIED REAL-TIME LIVE CHAT WINDOW
             ========================================== */
          <div className="apple-card flex flex-col rounded-[32px] bg-white overflow-hidden h-[640px] border border-[#D2D2D7]/70 shadow-sm">
            {/* Chat Window Top Bar */}
            <div className="apple-glass px-5 sm:px-6 py-4 border-b border-[#D2D2D7]/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F7] p-1 border border-[#D2D2D7]/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="iRent"
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#1D1D1F]">
                    Admin iRent
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-[#E8F2FF] px-3 py-1 text-[10.5px] font-semibold text-[#0071E3]">
                Live Chat
              </span>
            </div>

            {/* Chat Messages Scroll Container */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-[#FFFFFF]">
              {/* Welcome Automated Concierge Bubble */}
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] p-1 border border-[#D2D2D7]/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="iRent"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="max-w-[82%] rounded-2xl rounded-tl-xs bg-[#F5F5F7] px-4 py-3 text-[13px] leading-relaxed text-[#1D1D1F]">
                  <p className="font-semibold text-[#0071E3] text-[11px] mb-1">
                    Admin iRent
                  </p>
                  <p>
                    Halo! Sesi Live Chat Anda sudah aktif. Silakan tulis
                    pertanyaan atau unit iPhone yang ingin Anda sewa, tim admin
                    kami akan segera membalas pesan Anda di sini.
                  </p>
                </div>
              </div>

              {messages.map((msg) => {
                const isVisitor = msg.sender_type === "visitor";
                const { catalog, text } = parseCatalogMessage(msg.message);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isVisitor ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[65%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                        isVisitor
                          ? "rounded-br-xs bg-[#0071E3] text-white shadow-xs"
                          : "rounded-bl-xs bg-[#F5F5F7] text-[#1D1D1F] border border-[#D2D2D7]/50"
                      }`}
                    >
                      {!isVisitor && (
                        <p className="text-[10.5px] font-bold text-[#0071E3] mb-1">
                          Admin iRent
                        </p>
                      )}

                      {/* Attached Product Catalog Card */}
                      {catalog && (
                        <div className="mb-2.5 rounded-xl bg-white text-[#1D1D1F] p-3 shadow-xs border border-black/5">
                          <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-[#F5F5F7]">
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-[#0071E3]">
                              KATALOG PRODUK PILIHAN
                            </span>
                            {catalog.unitId && (
                              <Link
                                href={`/katalog/${catalog.unitId}`}
                                className="text-[10px] font-semibold text-[#0071E3] hover:underline"
                              >
                                Lihat Produk →
                              </Link>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="h-16 w-16 shrink-0 rounded-xl bg-[#F5F5F7] p-1.5 flex items-center justify-center overflow-hidden">
                              <IphoneVisual
                                model={catalog.tipe || catalog.unit}
                                colorName={catalog.warna || "Titanium"}
                                colorHex={getColorHex(catalog.warna || "")}
                                imageUrl={catalog.image || null}
                                variant="card"
                                className="h-full w-full"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-bold text-[#1D1D1F] truncate">
                                {catalog.unit}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                {catalog.storage && (
                                  <span className="rounded bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#1D1D1F]">
                                    {catalog.storage}
                                  </span>
                                )}
                                {catalog.warna && (
                                  <span className="rounded bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] font-medium text-[#6E6E73]">
                                    {catalog.warna}
                                  </span>
                                )}
                                {catalog.durasi && (
                                  <span className="rounded bg-[#E8F2FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#0071E3]">
                                    Paket {catalog.durasi}
                                  </span>
                                )}
                              </div>

                              {catalog.harga && (
                                <p className="mt-1.5 text-[13.5px] font-bold text-[#0071E3]">
                                  {catalog.harga}
                                </p>
                              )}
                            </div>
                          </div>

                          {(catalog.cabang || catalog.jadwal) && (
                            <div className="mt-2.5 pt-2 border-t border-[#F5F5F7] flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-[#6E6E73]">
                              {catalog.cabang && (
                                <span>{catalog.cabang}</span>
                              )}
                              {catalog.jadwal && (
                                <span>{catalog.jadwal}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {text && (
                        <p className="whitespace-pre-wrap break-words">{text}</p>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-[#86868B]">
                      <span>{formatTime(msg.created_at)}</span>
                      {isVisitor && (
                        <span>• {msg.is_read ? "Dibaca" : "Terkirim"}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Question Chips */}
            {messages.length === 0 && !unitParam && (
              <div className="px-5 py-2.5 bg-[#F5F5F7]/70 border-t border-[#D2D2D7]/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {QUICK_MESSAGES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessageToServer(q)}
                    className="shrink-0 rounded-full bg-white hover:bg-[#E8F2FF] border border-[#D2D2D7]/70 hover:border-[#0071E3]/40 px-3 py-1 text-[11px] font-medium text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Message Input Bar */}
            {conversation?.status === "closed" ? (
              <div className="p-4 bg-[#F5F5F7] text-center text-[12.5px] text-[#6E6E73] border-t border-[#D2D2D7]/60">
                Percakapan ini telah ditutup oleh Admin.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessageToServer(inputMessage);
                }}
                className="p-3.5 sm:p-4 bg-[#F5F5F7] border-t border-[#D2D2D7]/60 flex items-center gap-2.5"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ketik pesan ke Admin iRent..."
                  maxLength={5000}
                  className="flex-1 rounded-full bg-white px-4.5 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] border border-[#D2D2D7]/80 focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/15 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sendingMessage}
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-all ${
                    !inputMessage.trim() || sendingMessage
                      ? "bg-[#0071E3]/40 cursor-not-allowed"
                      : "bg-[#0071E3] hover:bg-[#0077ED] shadow-sm shadow-[#0071E3]/25 hover:scale-105"
                  }`}
                  aria-label="Kirim Pesan"
                >
                  <svg
                    className="h-4.5 w-4.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F7] py-16 text-center text-sm text-[#6E6E73]">
          Memuat layanan Live Chat iRent Aceh...
        </div>
      }
    >
      <LiveChatContent />
    </Suspense>
  );
}
