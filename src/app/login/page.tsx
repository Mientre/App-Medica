"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import styles from "./login.module.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [showError, setShowError] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showError) {
      return;
    }

    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowError(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showError]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const validUsername = /^\p{Lu}\p{L}*$/u.test(username);
    const validPassword = typeof password === "string" && password.length >= 6;

    if (!validUsername || !validPassword) {
      setShowError(true);
      return;
    }

    // Login has no authentication service yet, so valid-looking credentials also fail.
    setShowError(true);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pantalla de login</h1>
      </header>
      <main className={styles.main}>
        <section className={styles.panel} aria-label="Iniciar sesión">
          <form className={styles.form} noValidate onSubmit={handleSubmit}>
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
            />
            <button className={styles.submitButton} type="submit">
              Acceder
            </button>
          </form>
          <Link className={styles.backLink} href="/">
            Volver al menú
          </Link>
        </section>
      </main>
      {showError && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowError(false)}
        >
          <section
            className={styles.modal}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="login-error-title"
            aria-describedby="login-error-description"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="login-error-title">Contraseña o usuario incorrecto</h2>
            <p id="login-error-description">
              El inicio de sesión es una demostración y todavía no hay cuentas
              registradas.
            </p>
            <button
              className={styles.submitButton}
              ref={closeButtonRef}
              type="button"
              onClick={() => setShowError(false)}
            >
              Cerrar
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
