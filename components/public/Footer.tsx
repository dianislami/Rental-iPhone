"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Branch, IphoneUnit } from "@/lib/public-data";

export function Footer() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [fleetUnits, setFleetUnits] = useState<IphoneUnit[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadFooterData() {
      try {
        const [branchesRes, iphonesRes] = await Promise.all([
          fetch("/api/branches").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/iphones").then((r) => (r.ok ? r.json() : null)),
        ]);

        if (!isMounted) return;

        if (branchesRes?.success && Array.isArray(branchesRes.data)) {
          setBranches(branchesRes.data);
        }

        if (iphonesRes?.success && Array.isArray(iphonesRes.data)) {
          const active = iphonesRes.data.filter(
            (u: IphoneUnit) => u.status !== "nonaktif"
          );
          // Deduplicate by tipe or nama_unit for the fleet links
          const uniqueMap = new Map<string, IphoneUnit>();
          for (const item of active) {
            const key = (item.tipe || item.nama_unit).trim();
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, item);
            }
          }
          setFleetUnits(Array.from(uniqueMap.values()).slice(0, 6));
        }
      } catch {
        // Ignore network errors
      }
    }

    loadFooterData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="bg-[#FFFFFF] border-t border-[#D2D2D7]/60 text-[#1D1D1F]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Branches from Database */}
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight text-[#1D1D1F] mb-4">
              Cabang Resmi
            </h3>
            {branches.length === 0 ? (
              <p className="text-[12px] text-[#86868B]">
                Memuat data cabang...
              </p>
            ) : (
              <ul className="space-y-3.5 text-[12px] leading-relaxed">
                {branches.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/katalog?branch_id=${encodeURIComponent(b.id)}`}
                      className="font-semibold text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
                    >
                      {b.nama_cabang}
                    </Link>
                    {b.alamat && (
                      <p className="text-[#6E6E73] line-clamp-2">{b.alamat}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Column 2: Device Fleet from Database */}
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight text-[#1D1D1F] mb-4">
              Pilihan Unit
            </h3>
            {fleetUnits.length === 0 ? (
              <p className="text-[12px] text-[#86868B]">
                Memuat armada iPhone...
              </p>
            ) : (
              <ul className="space-y-2.5 text-[12px] text-[#6E6E73]">
                {fleetUnits.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/katalog/${u.id}`}
                      className="hover:text-[#0071E3] transition-colors"
                    >
                      {u.nama_unit} ({u.storage})
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/katalog"
                    className="font-semibold text-[#0071E3] hover:underline"
                  >
                    Lihat Seluruh Katalog →
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Column 3: Terms & Protection */}
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight text-[#1D1D1F] mb-4">
              Informasi Kami
            </h3>
            <ul className="space-y-2.5 text-[12px] text-[#6E6E73]">
              <li>
                <Link
                  href="/tentang-kami#proteksi"
                  className="hover:text-[#0071E3] transition-colors"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/tentang-kami#faq"
                  className="hover:text-[#0071E3] transition-colors"
                >
                  Cara Penyewaan
                </Link>
              </li>
              <li>
                <Link
                  href="/tentang-kami#faq"
                  className="hover:text-[#0071E3] transition-colors"
                >
                  Pertanyaan Umum (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Concierge & Support */}
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight text-[#1D1D1F] mb-4">
              Hubungi Kami
            </h3>
            <div className="space-y-3 text-[12px]">
              <div>
                <p className="font-semibold text-[#1D1D1F]">
                  WhatsApp Admin iRent
                </p>
                <a
                  href="https://wa.me/6281168908888"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0071E3] hover:underline font-medium"
                >
                  +62 811-6890-8888
                </a>
              </div>
              <div>
                <p className="font-semibold text-[#1D1D1F]">Jam Operasional</p>
                <p className="text-[#6E6E73]">
                  Setiap Hari: 09:00 - 22:00 WIB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-[#D2D2D7]/50 pt-6 text-[11px] text-[#86868B] sm:flex-row">
          <p>
            © 2026 iRent. Hak Cipta Dilindungi. Layanan rental iPhone resmi &amp; bergaransi.
          </p>
        </div>
      </div>
    </footer>
  );
}
