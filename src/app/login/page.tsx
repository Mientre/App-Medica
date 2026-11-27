"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [patientEmail, setPatientEmail] = useState("");
  const [feedback, setFeedback] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFeedback(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedback]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const email = formData.get("patientEmail");

    if (typeof password !== "string" || typeof email !== "string") {
      setFeedback({
        title: "Datos incompletos",
        message: "Escribe el correo del paciente y la contraseña.",
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setFeedback({
        title: "Supabase no está configurado",
        message: "Falta la URL y la clave publishable de Supabase.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setFeedback({
          title: "No se pudo iniciar sesión",
          message: /email not confirmed/i.test(signInError.message)
            ? "La cuenta todavía no está confirmada. Para permitir el acceso de prueba, desactiva temporalmente la confirmación de correo en la configuración de Supabase Auth."
            : signInError.message,
        });
        return;
      }

      const { data: deviceSession, error: deviceSessionError } =
        await supabase.functions.invoke("device-session", {
          body: { action: "start" },
        });

      if (deviceSessionError) {
        const { error: signOutError } = await supabase.auth.signOut({
          scope: "local",
        });
        setFeedback({
          title: "No se pudo activar la sesión del dispositivo",
          message: signOutError
            ? `${deviceSessionError.message} No se pudo cerrar la sesión local: ${signOutError.message}`
            : deviceSessionError.message,
        });
        return;
      }

      if (deviceSession?.active !== true) {
        const { error: signOutError } = await supabase.auth.signOut({
          scope: "local",
        });
        setFeedback({
          title: "ESP32 ocupado",
          message: [
            typeof deviceSession?.message === "string"
              ? deviceSession.message
              : "No se pudo asociar el ESP32 a este paciente.",
            signOutError
              ? `No se pudo cerrar la sesión local: ${signOutError.message}`
              : "",
          ]
            .filter(Boolean)
            .join(" "),
        });
        return;
      }

      router.push("/menu-principal");
    } catch {
      setFeedback({
        title: "No se pudo conectar",
        message: "No fue posible conectar con Supabase. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pantalla de login</h1>
      </header>
      <main className={styles.main}>
        <section className={styles.panel} aria-label="Iniciar sesión">
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.srOnly} htmlFor="patientEmail">
              Correo del paciente
            </label>
            <input
              className={styles.input}
              id="patientEmail"
              name="patientEmail"
              type="email"
              autoComplete="email"
              placeholder="Correo del paciente"
              value={patientEmail}
              onChange={(event) => setPatientEmail(event.target.value)}
              required
            />
            <label className={styles.srOnly} htmlFor="password">
              Contraseña
            </label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Contraseña"
              minLength={6}
              required
            />
            <button
              className={styles.submitButton}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Validando..." : "Acceder"}
            </button>
          </form>
          <Link className={styles.backLink} href="/">
            Volver al menú
          </Link>
        </section>
      </main>
      {feedback && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setFeedback(null)}
        >
          <section
            className={styles.modal}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="login-error-title"
            aria-describedby="login-error-description"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="login-error-title">{feedback.title}</h2>
            <p id="login-error-description">{feedback.message}</p>
            <button
              className={styles.submitButton}
              ref={closeButtonRef}
              type="button"
              onClick={() => setFeedback(null)}
            >
              Cerrar
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
