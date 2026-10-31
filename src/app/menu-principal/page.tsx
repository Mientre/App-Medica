"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import styles from "./menu-principal.module.css";

type MenuSection = "antecedentes" | "bitacora";

const sectionTitles: Record<MenuSection, string> = {
  antecedentes: "Antecedentes",
  bitacora: "Bitácora",
};

export default function MenuPrincipalPage() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeSection, setActiveSection] = useState<MenuSection | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      router.replace("/login");
      return;
    }

    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event === "SIGNED_OUT") {
        router.replace("/");
      } else if (active && session) {
        setIsCheckingSession(false);
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) {
        return;
      }

      if (sessionError || !data.session) {
        router.replace("/login");
        return;
      }

      setIsCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("No se pudo conectar con Supabase para cerrar la sesión.");
      return;
    }

    setError("");
    setIsSigningOut(true);

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(`No se pudo cerrar la sesión: ${signOutError.message}`);
        return;
      }

      router.replace("/");
    } catch {
      setError("No se pudo conectar con Supabase para cerrar la sesión.");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Menú principal</h1>
        </header>
        <main className={styles.main}>
          <p role="status">Comprobando sesión...</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Menú principal</h1>
      </header>
      <main className={styles.main}>
        <nav className={styles.actions} aria-label="Menú del paciente">
          <Link
            className={styles.actionButton}
            href="/resultados"
          >
            Resultados
          </Link>
          <button
            className={styles.actionButton}
            type="button"
            onClick={() => setActiveSection("bitacora")}
          >
            Bitácora
          </button>
          <button
            className={styles.actionButton}
            type="button"
            onClick={() => setActiveSection("antecedentes")}
          >
            Antecedentes
          </button>
          <button
            className={styles.actionButton}
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </nav>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </main>
      {activeSection && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setActiveSection(null)}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="section-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="section-title">{sectionTitles[activeSection]}</h2>
            <p>Esta sección estará disponible en una próxima actualización.</p>
            <button
              className={styles.actionButton}
              type="button"
              onClick={() => setActiveSection(null)}
            >
              Volver al menú
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
