# Simulador bancario educativo

Aplicación web de aprendizaje para simular operaciones bancarias. No procesa dinero real ni se conecta a servicios bancarios.

## Estado actual

La pantalla inicial reproduce el menú de referencia. El registro y el login usan Supabase Auth con el correo personal del paciente y su contraseña. Un trigger de base de datos crea el perfil en `pacientes` y crea o reutiliza el doctor relacionado en `doctores`. Las contraseñas las administra Supabase Auth y no se guardan en la tabla de pacientes. Después de iniciar sesión se abre el menú principal, con opciones de Resultados, Bitácora, Antecedentes y Cerrar sesión. Resultados muestra las mediciones del paciente autenticado desde `pacientes`; los indicadores son orientativos: presión arterial Normal entre 90–120 sistólica y 60–80 diastólica, frecuencia cardíaca entre 60–100 lpm, saturación entre 95–100 % y temperatura corporal entre 36,1–37,2 °C. La temperatura ambiental se muestra sin clasificar. Estos indicadores no son un diagnóstico médico. Antecedentes y Bitácora todavía están en desarrollo.

## Conectar Supabase

1. Haz una copia de seguridad y ejecuta el contenido actualizado de `supabase SQL.txt` en el SQL Editor de tu proyecto Supabase. El script elimina la columna antigua `contrasena`.
2. Conserva en `.env.local` las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key). No hace falta una clave `service_role`.
3. Para permitir el acceso de prueba sin confirmar el email, desactiva temporalmente la opción **Confirm email** del proveedor Email en la configuración de Supabase Auth. El login seguirá comprobando el correo y la contraseña contra Supabase Auth; no concede acceso solo porque el correo exista.
4. En Authentication → URL Configuration, configura `http://localhost:3000` como URL del sitio y permite `http://localhost:3000/login` para redirecciones de correo.
5. Reinicia el servidor de desarrollo después de guardar la configuración. Cuando quieras requerir confirmación, vuelve a activar **Confirm email**; mientras esté desactivada, Supabase no exigirá esa confirmación ni enviará el correo de confirmación del registro.

El SQL agrega correo e identificador Auth al perfil, activa RLS y elimina la columna antigua `contrasena`. Las cuentas registradas con el flujo anterior no se migran automáticamente: cada paciente debe registrarse de nuevo con un correo personal y confirmar su cuenta si Supabase tiene habilitada la confirmación por correo.

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
