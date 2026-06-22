# Plan de Revisión y Solución Backend / Frontend

## Diagnóstico del Backend

Después de una revisión exhaustiva, puedo confirmar que **no es necesario que cambies nada en el código del Backend**. El backend está bien estructurado y sus validaciones son las correctas:

1. **Variables y Tipos (Roles):** El uso de `"CASHIER"`, `"WAITER"` y `"ADMIN"` es el estándar interno. Modificar el backend para aceptar variables en español (`"cajero"`) sería una mala práctica porque mezclarías lógicas de internacionalización en la base de datos. Es labor del Frontend enmascarar los datos técnicos ("CASHIER") con datos legibles ("Cajero").
2. **Conexiones:** Los URLs expuestos por Django Rest Framework (ej. `/api/cashier/shift/open_shift/`) coinciden perfectamente con las rutas a las que hace las peticiones la instancia de Axios (`apiClient`) en el frontend.
3. **Refresco de Tokens JWT:** El interceptor de Axios apunta a `/users/token/refresh/` (que sumado a `/api` se convierte en `/api/users/token/refresh/`), lo cual también es la ruta exacta que expone el Backend.

## Inconsistencias a resolver por el Frontend Dev

Las soluciones recaen del lado del frontend:

1. **Bug en el envío de Roles:**
   - El desarrollador frontend debe asegurarse que, en cualquier petición de creación o edición de usuario (`/api/users/`), se asigne estrictamente el string `"CASHIER"`, `"WAITER"`, o `"ADMIN"` a la propiedad `role`. Seguramente estaba intentando pasar `"cajero"`, lo que provocaba un error de validación `400 Bad Request`.
2. **Formularios Incompletos (`email`):**
   - Actualmente, el componente React (`CreateUserModal.tsx`) y su validador Zod (`useCreateUser.ts`) no tienen contemplado el correo electrónico. Deberá agregarse un `<input type="email">` mapeado a la propiedad `email` del esquema.

## Conclusión

El trabajo se encuentra del lado del frontend. Puedes entregarle al Frontend Dev la guía `docs/api_inconsistencies.md` para que visualice claramente cómo enviar cada dato, junto con la corrección de los roles y la recomendación de añadir el campo `email`.
