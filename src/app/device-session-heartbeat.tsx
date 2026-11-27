"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function DeviceSessionHeartbeat() {
  const [hasAuthSession, setHasAuthSession] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setHasAuthSession(Boolean(data.session));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasAuthSession(Boolean(session));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!hasAuthSession || !client) {
      return;
    }
    const activeClient: SupabaseClient = client;

    async function renewDeviceSession() {
      const { data, error } = await activeClient.functions.invoke("device-session", {
        body: { action: "heartbeat" },
      });

      if (error) {
        console.error(
          "[device-session-heartbeat] No se pudo renovar la sesión.",
          error.message,
        );
        return;
      }

      if (data?.active === false) {
        const { error: signOutError } = await activeClient.auth.signOut({
          scope: "local",
        });
        if (signOutError) {
          console.error(
            "[device-session-heartbeat] No se pudo cerrar la sesión local.",
            signOutError.message,
          );
        }
      }
    }

    const interval = window.setInterval(() => {
      void renewDeviceSession();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [hasAuthSession]);

  return null;
}
