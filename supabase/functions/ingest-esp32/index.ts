import { createClient } from "npm:@supabase/supabase-js@2";

type ReadingPayload = {
  presion_sistolica?: unknown;
  presion_diastolica?: unknown;
  ritmo_cardiaco?: unknown;
  temperatura_expuesta?: unknown;
  humedad_ambiente?: unknown;
  temperatura_paciente?: unknown;
  spo2?: unknown;
};

function jsonResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

function hasValidNumber(
  value: unknown,
  integer = false,
  min?: number,
  max?: number,
) {
  if (value === undefined || value === null) {
    return true;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (integer && !Number.isInteger(value))
  ) {
    return false;
  }

  return (min === undefined || value >= min) && (max === undefined || value <= max);
}

function matchesSecret(provided: string, expected: string) {
  let difference = provided.length ^ expected.length;
  const length = Math.max(provided.length, expected.length);

  for (let index = 0; index < length; index += 1) {
    difference |=
      (provided.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }

  return difference === 0;
}

function getSupabaseSecretKey() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed: unknown = JSON.parse(secretKeys);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "default" in parsed &&
        typeof parsed.default === "string"
      ) {
        return parsed.default;
      }
    } catch {
      return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? null;
    }
  }

  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? null;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse("Método no permitido.", 405);
  }

  const expectedToken = Deno.env.get("ESP32_DEVICE_TOKEN");
  const providedToken = request.headers.get("x-device-token") ?? "";
  if (!expectedToken || !matchesSecret(providedToken, expectedToken)) {
    return jsonResponse("No autorizado.", 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseSecretKey = getSupabaseSecretKey();
  if (!supabaseUrl || !supabaseSecretKey) {
    console.error("[ingest-esp32] Faltan secretos de configuración.");
    return jsonResponse("La función no está configurada.", 500);
  }

  let payload: ReadingPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse("El cuerpo debe ser JSON válido.", 400);
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return jsonResponse("El cuerpo debe ser un objeto JSON.", 400);
  }

  const validPayload =
    hasValidNumber(payload.presion_sistolica, true) &&
    hasValidNumber(payload.presion_diastolica, true) &&
    hasValidNumber(payload.ritmo_cardiaco, true) &&
    hasValidNumber(payload.temperatura_expuesta) &&
    hasValidNumber(payload.humedad_ambiente, false, 0, 100) &&
    hasValidNumber(payload.temperatura_paciente) &&
    hasValidNumber(payload.spo2, true, 0, 100);

  const reading = {
    presion_sistolica: payload.presion_sistolica ?? null,
    presion_diastolica: payload.presion_diastolica ?? null,
    ritmo_cardiaco: payload.ritmo_cardiaco ?? null,
    temperatura_expuesta: payload.temperatura_expuesta ?? null,
    humedad_ambiente: payload.humedad_ambiente ?? null,
    temperatura_paciente: payload.temperatura_paciente ?? null,
    spo2: payload.spo2 ?? null,
  };

  if (
    !validPayload ||
    Object.values(reading).every((value) => value === null)
  ) {
    return jsonResponse("Los valores de la lectura no son válidos.", 400);
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase.rpc("insert_esp32_reading", {
    p_presion_sistolica: reading.presion_sistolica,
    p_presion_diastolica: reading.presion_diastolica,
    p_ritmo_cardiaco: reading.ritmo_cardiaco,
    p_temperatura_expuesta: reading.temperatura_expuesta,
    p_humedad_ambiente: reading.humedad_ambiente,
    p_temperatura_paciente: reading.temperatura_paciente,
    p_spo2: reading.spo2,
  });
  if (error) {
    console.error("[ingest-esp32] No se pudo guardar la lectura.", error.code);
    if (error.code === "55000") {
      return jsonResponse("No hay una sesión activa de paciente.", 409);
    }

    return jsonResponse("No se pudo guardar la lectura.", 500);
  }

  return Response.json({ message: "Lectura guardada." }, { status: 201 });
});
