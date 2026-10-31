"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import styles from "./resultados.module.css";

type PatientResults = {
  nombre: string;
  presion_arterial: string | null;
  frecuencia_cardiaca: number | null;
  saturacion_oxigeno: number | null;
  temperatura_expuesta: number | null;
  temperatura_paciente: number | null;
};

type StatusTone = "normal" | "alert" | "unknown";

type MeasurementStatus = {
  label: string;
  tone: StatusTone;
};

function displayMeasurement(
  value: number | string | null,
  unit = "",
): string {
  return value === null || value === "" ? "----" : `${value}${unit}`;
}

function getNumericMeasurementStatus(
  value: number | null,
  min: number,
  max: number,
): MeasurementStatus {
  if (value === null) {
    return { label: "Sin dato", tone: "unknown" };
  }

  return value >= min && value <= max
    ? { label: "Normal", tone: "normal" }
    : { label: "Alerta", tone: "alert" };
}

function getBloodPressureStatus(value: string | null): MeasurementStatus {
  if (!value?.trim()) {
    return { label: "Sin dato", tone: "unknown" };
  }

  const match = /^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/.exec(value);
  if (!match) {
    return { label: "Alerta", tone: "alert" };
  }

  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);
  const isWithinOrientativeRange =
    systolic >= 90 &&
    systolic <= 120 &&
    diastolic >= 60 &&
    diastolic <= 80;

  return isWithinOrientativeRange
    ? { label: "Normal", tone: "normal" }
    : { label: "Alerta", tone: "alert" };
}

export default function ResultadosPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === "SIGNED_OUT") {
        router.replace("/");
      }
    });

    void supabase.auth.getUser().then(async ({ data, error: authError }) => {
      if (!active) {
        return;
      }

      if (authError || !data.user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("pacientes")
        .select(
          "nombre,presion_arterial,frecuencia_cardiaca,saturacion_oxigeno,temperatura_expuesta,temperatura_paciente",
        )
        .eq("auth_user_id", data.user.id)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (profileError) {
        setError("No se pudieron cargar los resultados del paciente.");
      } else if (!profile) {
        setError(
          "No encontramos el perfil del paciente. Verifica que el registro se haya completado correctamente.",
        );
      } else {
        setPatient(profile);
      }

      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const pressureStatus = getBloodPressureStatus(
    patient?.presion_arterial ?? null,
  );
  const heartRateStatus = getNumericMeasurementStatus(
    patient?.frecuencia_cardiaca ?? null,
    60,
    100,
  );
  const oxygenStatus = getNumericMeasurementStatus(
    patient?.saturacion_oxigeno ?? null,
    95,
    100,
  );
  const ambientTemperatureStatus: MeasurementStatus =
    patient?.temperatura_expuesta === null ||
    patient?.temperatura_expuesta === undefined
      ? { label: "Sin dato", tone: "unknown" }
      : { label: "Sin criterio", tone: "unknown" };
  const bodyTemperatureStatus = getNumericMeasurementStatus(
    patient?.temperatura_paciente ?? null,
    36.1,
    37.2,
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Resultados</h1>
      </header>
      <main className={styles.main}>
        <section className={styles.resultsFrame} aria-label="Resultados clínicos">
          <div className={styles.resultsPanel}>
            {isLoading ? (
              <p className={styles.status} role="status">
                Cargando resultados...
              </p>
            ) : error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : patient ? (
              <dl className={styles.measurements}>
                <div className={styles.row}>
                  <dt className={styles.label}>Nombre del paciente</dt>
                  <dd className={styles.value}>{patient.nombre}</dd>
                </div>
                <div className={styles.row}>
                  <dt className={styles.label}>Presión arterial</dt>
                  <dd className={styles.pressureResult}>
                    <span className={styles.pressureValue}>
                      {displayMeasurement(patient.presion_arterial)}
                    </span>
                    <span
                      className={`${styles.pressureStatus} ${styles[pressureStatus.tone]}`}
                      aria-label={`Estado de presión arterial: ${pressureStatus.label}`}
                      title="Indicador orientativo, no diagnóstico"
                    >
                      {pressureStatus.label}
                    </span>
                  </dd>
                </div>
                <div className={styles.row}>
                  <dt className={styles.label}>Frecuencia cardíaca</dt>
                  <dd className={styles.pressureResult}>
                    <span className={styles.pressureValue}>
                      {displayMeasurement(patient.frecuencia_cardiaca, " lpm")}
                    </span>
                    <span
                      className={`${styles.pressureStatus} ${styles[heartRateStatus.tone]}`}
                      aria-label={`Estado de frecuencia cardíaca: ${heartRateStatus.label}`}
                      title="Indicador orientativo, no diagnóstico"
                    >
                      {heartRateStatus.label}
                    </span>
                  </dd>
                </div>
                <div className={styles.row}>
                  <dt className={styles.label}>Saturación de oxígeno</dt>
                  <dd className={styles.pressureResult}>
                    <span className={styles.pressureValue}>
                      {displayMeasurement(patient.saturacion_oxigeno, "%")}
                    </span>
                    <span
                      className={`${styles.pressureStatus} ${styles[oxygenStatus.tone]}`}
                      aria-label={`Estado de saturación de oxígeno: ${oxygenStatus.label}`}
                      title="Indicador orientativo, no diagnóstico"
                    >
                      {oxygenStatus.label}
                    </span>
                  </dd>
                </div>
                <div className={styles.row}>
                  <dt className={styles.label}>Temperatura ambiental</dt>
                  <dd className={styles.pressureResult}>
                    <span className={styles.pressureValue}>
                    {displayMeasurement(patient.temperatura_expuesta, " °C")}
                    </span>
                    <span
                      className={`${styles.pressureStatus} ${styles[ambientTemperatureStatus.tone]}`}
                      aria-label={`Clasificación de temperatura ambiental: ${ambientTemperatureStatus.label}`}
                      title="No se definió un rango para clasificar la temperatura ambiental"
                    >
                      {ambientTemperatureStatus.label}
                    </span>
                  </dd>
                </div>
                <div className={styles.row}>
                  <dt className={styles.label}>Temperatura del paciente</dt>
                  <dd className={styles.pressureResult}>
                    <span className={styles.pressureValue}>
                      {displayMeasurement(patient.temperatura_paciente, " °C")}
                    </span>
                    <span
                      className={`${styles.pressureStatus} ${styles[bodyTemperatureStatus.tone]}`}
                      aria-label={`Estado de temperatura corporal: ${bodyTemperatureStatus.label}`}
                      title="Indicador orientativo, no diagnóstico"
                    >
                      {bodyTemperatureStatus.label}
                    </span>
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>
        </section>
        <Link className={styles.backLink} href="/menu-principal">
          Volver al menú principal
        </Link>
      </main>
    </div>
  );
}
