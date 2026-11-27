import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(message: string, status: number, active = false) {
  return Response.json(
    { active, message },
    { status, headers: corsHeaders },
  );
}

function getDefaultKey(variable: string, legacyVariable: string) {
  const keyMap = Deno.env.get(variable);
  if (keyMap) {
    try {
      const parsed: unknown = JSON.parse(keyMap);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "default" in parsed &&
        typeof parsed.default === "string"
      ) {
        return parsed.default;
      }
    } catch {
      return Deno.env.get(legacyVariable) ?? null;
    }
  }

  return Deno.env.get(legacyVariable) ?? null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse("Método no permitido.", 405);
  }

  const authorization = request.headers.get("authorization") ?? "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = getDefaultKey(
    "SUPABASE_PUBLISHABLE_KEYS",
    "SUPABASE_ANON_KEY",
  );
  const secretKey = getDefaultKey(
    "SUPABASE_SECRET_KEYS",
    "SUPABASE_SERVICE_ROLE_KEY",
  );

  if (!accessToken || !supabaseUrl || !publishableKey || !secretKey) {
    return jsonResponse("La función no está configurada.", 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse("El cuerpo debe ser JSON válido.", 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("action" in body) ||
    (body.action !== "start" &&
      body.action !== "heartbeat" &&
      body.action !== "end")
  ) {
    return jsonResponse("La acción de sesión no es válida.", 400);
  }

  const action = body.action;
  const userClient = createClient(supabaseUrl, publishableKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data: userData, error: userError } =
    await userClient.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return jsonResponse("La sesión de usuario no es válida.", 401);
  }

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (action === "start") {
    const { data: patient, error: patientError } = await adminClient
      .from("pacientes")
      .select("id")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (patientError) {
      console.error("[device-session] No se pudo consultar el perfil.", patientError.code);
      return jsonResponse("No se pudo consultar el perfil del paciente.", 500);
    }
    if (!patient) {
      return jsonResponse("La cuenta no tiene un perfil de paciente.", 404);
    }

    const { data: activated, error: activationError } = await adminClient.rpc(
      "start_esp32_session",
      {
        p_auth_user_id: userData.user.id,
        p_paciente_id: patient.id,
      },
    );

    if (activationError) {
      console.error("[device-session] No se pudo activar la sesión.", activationError.code);
      return jsonResponse("No se pudo activar la sesión del dispositivo.", 500);
    }
    if (!activated) {
      return jsonResponse(
        "El ESP32 está activo con otra cuenta. Cierra esa sesión o espera hasta dos minutos a que venza.",
        200,
      );
    }

    return jsonResponse("Sesión del ESP32 activa.", 200, true);
  }

  if (action === "heartbeat") {
    const { data: active, error: heartbeatError } = await adminClient.rpc(
      "heartbeat_esp32_session",
      { p_auth_user_id: userData.user.id },
    );

    if (heartbeatError) {
      console.error("[device-session] No se pudo renovar la sesión.", heartbeatError.code);
      return jsonResponse("No se pudo renovar la sesión del dispositivo.", 500);
    }

    return jsonResponse(
      active
        ? "Sesión del ESP32 activa."
        : "La sesión del ESP32 ya no está asociada a este paciente.",
      200,
      Boolean(active),
    );
  }

  const { error: endError } = await adminClient.rpc("end_esp32_session", {
    p_auth_user_id: userData.user.id,
  });

  if (endError) {
    console.error("[device-session] No se pudo cerrar la sesión.", endError.code);
    return jsonResponse("No se pudo cerrar la sesión del dispositivo.", 500);
  }

  return jsonResponse("Sesión del ESP32 cerrada.", 200);
});
