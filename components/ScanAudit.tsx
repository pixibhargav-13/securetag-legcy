"use client";

import { useEffect } from "react";

/** Lightweight UA parse (replaces ua-parser-js from the old app). */
function deviceInfo() {
  const ua = navigator.userAgent;
  const os =
    /Windows NT 10/.test(ua) ? "Windows 10" :
    /Windows/.test(ua) ? "Windows" :
    /iPhone|iPad|iPod/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" :
    /Mac OS X/.test(ua) ? "Mac OS" :
    /Linux/.test(ua) ? "Linux" : "Unknown";
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\//.test(ua) ? "Opera" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "Unknown";
  const deviceType = /Mobile|Android|iPhone|iPad/.test(ua) ? "Mobile" : "Desktop";
  return { deviceType, os, browser };
}

/**
 * Reproduces the old scan-audit behaviour: captures the scanner's geolocation
 * (with permission), device and IP, and logs one scan event. Fires once per
 * code per browser session so a re-render or refresh doesn't double-count.
 */
export default function ScanAudit({ code }: { code: string }) {
  useEffect(() => {
    const key = `st_scan_${code}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const send = (lat: number | null, lng: number | null) => {
      const body = JSON.stringify({ code, lat, lng, device: deviceInfo() });
      // Prefer sendBeacon so it survives navigation; fall back to fetch.
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/scan", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/scan", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => send(pos.coords.latitude, pos.coords.longitude),
        () => send(null, null),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      send(null, null);
    }
  }, [code]);

  return null;
}
