"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import styles from "./registro.module.css";

export default function RegistroPage() {
  const [error, setError] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [registered, setRegistered] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const passwordConfirmation = formData.get("passwordConfirmation");
    const doctorEmail = formData.get("doctorEmail");
    const age = formData.get("age");

    if (
      typeof password !== "string" ||
      typeof passwordConfirmation !== "string" ||
      typeof doctorEmail !== "string" ||
      typeof age !== "string"
    ) {
      setError("Revisa los datos del formulario e inténtalo de nuevo.");
      return;
    }

    if (!/^[\p{L}]+(?:[ '-][\p{L}]+)+$/u.test(doctorName.trim())) {
      setError("Escribe el nombre y apellido del doctor usando solo letras.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden. Inténtalo de nuevo.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Falta configurar la URL y la clave publishable de Supabase.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: patientEmail.trim().toLowerCase(),
        password,
        options: {
          data: {
            patient_name: patientName.trim(),
            age: Number(age),
            doctor_name: doctorName.trim(),
            doctor_email: doctorEmail.trim().toLowerCase(),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setConfirmationRequired(!data.session);
      setRegistered(true);
    } catch {
      setError("No fue posible conectar con Supabase. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pantalla de registro</h1>
      </header>
      <main className={styles.main}>
        <section className={styles.panel} aria-label="Registro">
          {registered ? (
            <div className={styles.success} role="status">
              <h2>¡Registro exitoso!</h2>
              <p>
                {confirmationRequired
                  ? "Si el correo puede registrarse, recibirás un mensaje para confirmar la cuenta. Revisa la bandeja de entrada."
                  : "La cuenta de Supabase Auth y el perfil del paciente se crearon correctamente."}
              </p>
              <Link className={styles.backLink} href="/">
                Volver al inicio
              </Link>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.srOnly} htmlFor="patientName">
                Nombre del paciente
              </label>
              <input
                className={styles.input}
                id="patientName"
                name="patientName"
                type="text"
                autoComplete="name"
                placeholder="Nombre del paciente"
                value={patientName}
                onChange={(event) => {
                  const nameCharacters = event.target.value.replace(
                    /[^\p{L} '-]/gu,
                    "",
                  );
                  setPatientName(
                    nameCharacters.replace(/^(\p{L})/u, (firstLetter) =>
                      firstLetter.toLocaleUpperCase("es"),
                    ),
                  );
                }}
                required
              />
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
                autoComplete="new-password"
                placeholder="Contraseña"
                minLength={6}
                required
              />
              <label
                className={styles.srOnly}
                htmlFor="passwordConfirmation"
              >
                Confirmar contraseña
              </label>
              <input
                className={styles.input}
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                placeholder="Confirmar contraseña"
                minLength={6}
                required
              />
              <label className={styles.srOnly} htmlFor="age">
                Edad
              </label>
              <input
                className={styles.input}
                id="age"
                name="age"
                type="number"
                min="60"
                max="100"
                step="1"
                placeholder="Edad"
                required
              />
              <label className={styles.srOnly} htmlFor="doctorName">
                Nombre de su doctor
              </label>
              <input
                className={styles.input}
                id="doctorName"
                name="doctorName"
                type="text"
                autoComplete="off"
                placeholder="Nombre de su doctor"
                value={doctorName}
                onChange={(event) =>
                  setDoctorName(
                    event.target.value.replace(
                      /^(\p{L})/u,
                      (firstLetter) => firstLetter.toLocaleUpperCase("es"),
                    ),
                  )
                }
                required
              />
              <label className={styles.srOnly} htmlFor="doctorEmail">
                Correo del doctor
              </label>
              <input
                className={styles.input}
                id="doctorEmail"
                name="doctorEmail"
                type="email"
                autoComplete="off"
                placeholder="Correo del doctor"
                pattern="[^@\s]+@gmail\.com"
                title="El correo debe terminar en @gmail.com"
                required
              />
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button className={styles.submitButton} type="submit">
                {isSubmitting ? "Registrando..." : "Registrar"}
              </button>
              <Link className={styles.backLink} href="/">
                Volver al inicio
              </Link>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
