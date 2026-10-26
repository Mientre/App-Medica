# Simulador bancario educativo

Aplicación web de aprendizaje para simular operaciones bancarias. No procesa dinero real ni se conecta a servicios bancarios.

## Estado actual

La pantalla inicial reproduce el menú de referencia. Login y Registrar abren formularios de demostración. Estos formularios no están conectados a un servicio y no envían ni guardan datos. El registro exige un usuario solo con letras y mayúscula inicial, una contraseña de al menos seis caracteres, edad entre 18 y 65 años, nombre y apellido del doctor, correo terminado en `@gmail.com` y contraseñas coincidentes; al completarse muestra una confirmación simulada con un único enlace para volver al inicio. El login aplica las reglas de usuario y contraseña y muestra un diálogo cerrable cuando el acceso falla; como no hay autenticación configurada, todos los intentos fallan.

## Tecnologías

- **Node.js** ejecuta las herramientas del proyecto y el servidor de desarrollo.
- **Next.js App Router** organiza las páginas y la lógica de servidor de la aplicación.
- **React** construye la interfaz mediante componentes.
- **TypeScript** añade tipos para detectar errores antes de ejecutar la aplicación.
- **Supabase/PostgreSQL** se incorporará después para guardar los datos de demostración; aún no está configurado.

## Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La pantalla principal se encuentra en `src/app/page.tsx`.
