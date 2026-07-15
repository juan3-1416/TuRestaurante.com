# Documentación de Cambios: Frontend Web & Backend (Fase Fullstack local y WebSockets)

Este documento resume todos los cambios realizados en el Frontend Web (Next.js) y el Backend (Django) para lograr la sincronización por WebSockets y permitir que la aplicación web funcione correctamente en dispositivos móviles conectados a la misma red WiFi (IP local).

## 1. Backend (Django)
Aunque el enfoque fue el frontend, se hicieron ajustes críticos en el backend para permitir la conexión desde dispositivos externos en la red local.

* **Soporte de WebSockets (Redis):** Se corrigió un error de desconexión (`redis.exceptions.TimeoutError`) en la configuración de `CHANNEL_LAYERS` en `settings.py`, agregando `"socket_timeout": None` para mantener vivas las conexiones WebSocket.
* **CORS Global:** Se configuró `CORS_ALLOW_ALL_ORIGINS = True` en `settings.py` para asegurar que el frontend web (alojado en el celular) y la app móvil no tuvieran bloqueos de seguridad al consultar la API.
* **Hosts Permitidos:** Se restauró `ALLOWED_HOSTS = ["*"]` para que Django acepte peticiones dirigidas a la IP local (ej. `192.168.100.122`) en lugar de solo `localhost`.

## 2. Frontend Web (Next.js)
El principal reto en el Frontend Web fue hacer que dejara de depender de `localhost` y que pudiera ejecutar el código de React correctamente en navegadores de celular.

### 2.1. Conexión Dinámica de Red (APIs y WebSockets)
* **API (Axios/REST):** Se modificaron los archivos `src/lib/api.ts` y `src/lib/axios.ts` para que la URL base de la API se genere dinámicamente usando `window.location.hostname`. De esta forma, si entras desde `http://192.168.100.122:3000`, la API apuntará automáticamente a `http://192.168.100.122:8000/api` y no a localhost.
* **WebSockets:** Se modificó `src/lib/WebSocketProvider.tsx` para usar dinámicamente la IP del dispositivo en lugar de una URL estática, logrando que los eventos en tiempo real (como la actualización de mesas) lleguen a cualquier celular en la red.

### 2.2. Solución de Errores de React (Hidratación)
* **AuthGuard:** Se corrigió un error de desajuste entre el servidor y el cliente (Hydration Mismatch) en `AuthGuard.tsx` agregando un estado `isMounted`. Esto evita que la aplicación se "congele" o crashee al cargar rutas protegidas.

### 2.3. Corrección del Formulario de Inicio de Sesión
El inicio de sesión en celulares sufría de problemas críticos debido a bloqueos de red y envíos de formularios nativos:
* **Remoción de credenciales expuestas:** Se eliminó un `console.log` en `LoginForm.tsx` que imprimía el usuario y la contraseña por seguridad.
* **Prevención del Método GET nativo:** Como React no lograba activarse a tiempo en el celular, el navegador enviaba el formulario por defecto (GET), lo que exponía la contraseña en la barra de direcciones de la URL. Se solucionó añadiendo `method="POST"` y desactivando el comportamiento nativo de la tecla "Enter" (`onKeyDown`).
* **Navegación Forzada y Alertas:** Se cambió el método suave de Next.js (`router.push`) por un ruteo nativo (`window.location.href`) para asegurar que el celular cambie de página hacia el Dashboard o Caja. Además, se añadieron `alerts()` en caso de fallas silenciosas en la obtención del perfil.

### 2.4. Permisos de Seguridad de Next.js (El Culpable Final)
* **next.config.ts:** Next.js (por seguridad en su versión 15+) bloquea automáticamente que IPs externas a la computadora local descarguen los scripts de Javascript necesarios para funcionar. Esto causaba que el celular solo recibiera HTML estático y los botones no hicieran nada. Se solucionó agregando la IP del celular a la lista blanca: `allowedDevOrigins: ["192.168.100.122"]`.
