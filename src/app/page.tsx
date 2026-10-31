import Link from "next/link";
import SupabaseConnectionIndicator from "./supabase-connection-indicator";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <SupabaseConnectionIndicator />
        <h1 className={styles.title}>Menú inicial</h1>
      </header>
      <main className={styles.main}>
        <div className={styles.actions} aria-label="Opciones del menú">
          <Link className={styles.actionButton} href="/login">
            Login
          </Link>
          <Link className={styles.actionButton} href="/registro">
            Registrar
          </Link>
        </div>
      </main>
    </div>
  );
}
