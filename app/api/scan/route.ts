import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Logs one scan event into legacy_scans — the modern equivalent of the old
 * ScanAuditInfo audit log. IP is read from request headers server-side;
 * lat/lng/device come from the client (ScanAudit component).
 */
export async function POST(req: NextRequest) {
  try {
    const { code, lat, lng, device } = await req.json();
    if (!code || !/^[a-zA-Z0-9]{6}$/.test(code)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const db = getAdminClient();
    await db.from("legacy_scans").insert({
      code,
      device_info: device ? JSON.stringify(device) : null,
      ip_address: ip,
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
      scanned_on: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
