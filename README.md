# Simulador bancario educativo

Aplicación web de aprendizaje para simular operaciones bancarias. No procesa dinero real ni se conecta a servicios bancarios.

## Estado actual

La pantalla inicial reproduce el menú de referencia. El registro y el login usan Supabase Auth con el correo personal del paciente y su contraseña. Un trigger de base de datos crea el perfil en `pacientes` y crea o reutiliza el doctor relacionado en `doctores`. Las contraseñas las administra Supabase Auth y no se guardan en la tabla de pacientes. Después de iniciar sesión se abre el menú principal, con opciones de Resultados, Bitácora, Antecedentes y Cerrar sesión. Resultados muestra la lectura más reciente de `lecturas_paciente` vinculada al perfil del paciente autenticado. Los indicadores son orientativos: presión arterial Normal entre 90–120 sistólica y 60–80 diastólica, frecuencia cardíaca entre 60–100 lpm, saturación entre 95–100 % y temperatura corporal entre 36,1–37,2 °C. La temperatura y humedad ambientales se muestran sin clasificar. Estos indicadores no son un diagnóstico médico. Antecedentes y Bitácora todavía están en desarrollo.

## Conectar Supabase

1. Haz una copia de seguridad y ejecuta el contenido actualizado de `supabase SQL.txt` en el SQL Editor de tu proyecto Supabase. El script elimina la columna antigua `contrasena`, conserva la tabla `lecturas_paciente` y agrega `paciente_id`. Si existe exactamente un perfil de paciente, vincula automáticamente a ese perfil las lecturas anteriores sin vínculo.
2. Conserva en `.env.local` las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key). No hace falta una clave `service_role`.
3. Para permitir el acceso de prueba sin confirmar el email, desactiva temporalmente la opción **Confirm email** del proveedor Email en la configuración de Supabase Auth. El login seguirá comprobando el correo y la contraseña contra Supabase Auth; no concede acceso solo porque el correo exista.
4. En Authentication → URL Configuration, configura `http://localhost:3000` como URL del sitio y permite `http://localhost:3000/login` para redirecciones de correo.
5. Reinicia el servidor de desarrollo después de guardar la configuración. Cuando quieras requerir confirmación, vuelve a activar **Confirm email**; mientras esté desactivada, Supabase no exigirá esa confirmación ni enviará el correo de confirmación del registro.

El SQL agrega correo e identificador Auth al perfil, activa RLS y elimina la columna antigua `contrasena`. Las cuentas registradas con el flujo anterior no se migran automáticamente: cada paciente debe registrarse de nuevo con un correo personal y confirmar su cuenta si Supabase tiene habilitada la confirmación por correo.

El ESP32 envía las mediciones a la Edge Function `ingest-esp32`, no inserta directamente en la tabla. Al iniciar sesión, `device-session` vincula el dispositivo con el perfil del paciente activo. Solo se permite un paciente activo a la vez; el login de otra cuenta se rechaza mientras el primero tenga sesión reciente. La aplicación renueva la sesión cada 30 segundos y el vínculo vence tras dos minutos sin renovación; cerrar sesión lo libera inmediatamente.

Configura `ESP32_DEVICE_TOKEN` en **Edge Functions → Secrets** con un token aleatorio para el dispositivo. Despliega las dos funciones con `supabase functions deploy device-session` y `supabase functions deploy ingest-esp32`.

El ESP32 envía un POST a `https://<project-ref>.supabase.co/functions/v1/ingest-esp32`, con los headers `apikey: <publishable-key>` y `x-device-token: <token-del-dispositivo>`, y un JSON con `presion_sistolica`, `presion_diastolica`, `ritmo_cardiaco`, `temperatura_expuesta`, `humedad_ambiente`, `temperatura_paciente` y `spo2`. No envíes `paciente_id`: la función lo obtiene de la sesión activa. Si no hay sesión de paciente activa, la función responde HTTP 409 y no guarda la lectura. Este prototipo asume que las mediciones se transmiten en tiempo real; lecturas almacenadas sin enviar y transmitidas después de cambiar de paciente no se pueden atribuir con seguridad. No incluyas una clave `service_role`/`sb_secret` en el firmware. La tabla bloquea inserciones directas de `anon` y permite que cada paciente autenticado lea solo sus propias mediciones.

## Tecnologías

- **Node.js** ejecuta las herramientas del proyecto y el servidor de desarrollo.
- **Next.js App Router** organiza las páginas y la lógica de servidor de la aplicación.
- **React** construye la interfaz mediante componentes.
- **TypeScript** añade tipos para detectar errores antes de ejecutar la aplicación.
- **Supabase Auth/PostgreSQL** gestiona la autenticación y los perfiles de pacientes y doctores.

## Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La pantalla principal se encuentra en `src/app/page.tsx`.
