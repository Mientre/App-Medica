"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type ConnectionStatus = "checking" | "connected" | "disconnected";

const statusLabels: Record<ConnectionStatus, string> = {
  checking: "Comprobando conexión con Supabase",
  connected: "Conectado a Supabase",
  disconnected: "Sin conexión con Supabase",
};

export default function SupabaseConnectionIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "checking"
      : "disconnected",
  );

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let active = true;

    if (!supabaseUrl || !supabaseAnonKey) {
      return;
    }

    const connectionUrl = supabaseUrl;
    const anonKey = supabaseAnonKey;

    async function checkConnection() {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(
          `${connectionUrl.replace(/\/+$/, "")}/auth/v1/health`,
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (active) {
          setStatus(response.ok ? "connected" : "disconnected");
        }
      } catch {
        if (active) {
          setStatus("disconnected");
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    function checkWhenOnline() {
      void checkConnection();
    }

    void checkConnection();
    const interval = window.setInterval(checkWhenOnline, 30000);
    window.addEventListener("online", checkWhenOnline);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", checkWhenOnline);
    };
  }, []);

  return (
    <span
      className={`${styles.connectionIndicator} ${styles[status]}`}
      role="status"
      aria-label={statusLabels[status]}
      title={statusLabels[status]}
    />
  );
}
