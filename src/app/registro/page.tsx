"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import styles from "./registro.module.css";

export default function RegistroPage() {
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [registered, setRegistered] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const passwordConfirmation = formData.get("passwordConfirmation");
    const doctorName = formData.get("doctorName");

    if (
      typeof doctorName !== "string" ||
      !/^[\p{L}]+(?:[ '-][\p{L}]+)+$/u.test(doctorName.trim())
    ) {
      setError("Escribe el nombre y apellido del doctor usando solo letras.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden. Inténtalo de nuevo.");
      return;
    }

    setError("");
    setRegistered(true);
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
                Esta es una demostración: no se creó una cuenta ni se guardaron
                tus datos.
              </p>
              <Link className={styles.backLink} href="/">
                Volver al inicio
              </Link>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.srOnly} htmlFor="username">
                Nombre de usuario
              </label>
              <input
                className={styles.input}
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(event) => {
                  const lettersOnly = event.target.value.replace(/[^\p{L}]/gu, "");
                  setUsername(
                    lettersOnly.replace(/^(\p{L})/u, (firstLetter) =>
                      firstLetter.toLocaleUpperCase("es"),
                    ),
                  );
                }}
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
                min="18"
                max="65"
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
                Registrar
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
