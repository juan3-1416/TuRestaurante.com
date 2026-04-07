# 🚀 Guía de Integración Backend + Frontend (Para Fabián)

¡Hola Fabián! Hemos integrado exitosamente la arquitectura del backend en la raíz del proyecto y dockerizado el entorno de Next.js. De esta forma, todo el ecosistema (React, Django y PostgreSQL) corre armonizado bajo la misma red. 

Aquí tienes el resumen de lo que cambió y cómo debes usar este nuevo flujo de trabajo automatizado.

---

## 🛠️ 1. Cambios que hicimos en el Frontend

Hicimos algunas adaptaciones súper limpias para enganchar tu Frontend con la Autenticación Real de Django (Tokens JWT):

* **[NUEVO] `Dockerfile` y `.dockerignore`**: Sirven puramente para infraestructura. Instruyen a Docker sobre cómo empacar y servir tu proyecto de Next.js de manera ágil.
* **[NUEVO] `src/lib/api.ts`**: Es una instancia global de Axios. Configurada para apuntar automáticamente al backend mediante la variable dinámica `NEXT_PUBLIC_API_URL` (que orquesta Docker automáticamente a tu `localhost:8000/api`). **Recomendación:** Trata de usar este cliente `api` importado para todas tus futuras peticiones.
* **[MODIFICADO] `src/features/auth/components/LoginForm.tsx`**: 
  - Cambiamos el campo y esquema de validador de *Email* a *Username*, ya que los administradores crean las cuentas de los meseros y cajeros (se quitó la validación del correo).
  - Sustituimos el token "simulado" por la petición real `await api.post('/auth/token/', values)`. Al inyectar el Access Token devuelto en tu `useAuthStore(login)`, el sistema ya obedece a Zustand maravillosamente. **¡Gran trabajo con el AuthStore, por cierto, quedó intacto!**

---

## 🐳 2. El Nuevo Flujo de Desarrollo (Reglas de Oro)

A partir de ahora, el proyecto utiliza una arquitectura **Dockerizada en Monorepo**. 

### ⚠️ Regla Principal:
**Ya no necesitas correr `npm run dev` en tu computadora.** 
Es más, ya ni siquiera necesitas tener entornos virtuales de Python ni instalar bases de datos de Postgres en tu máquina local. Todo el restaurante vive en contenedores aislados.

### Cómo encender TODO el sistema (Frontend + Backend + Database)

1. Abre la terminal desde la **RAÍZ COMPLETA** del proyecto (`d:\TuRestaurante.com` o donde lo tengas clonado).
2. Ejecuta el comando maestro:
   ```bash
   docker-compose up -d
   ```
   *(Esto prenderá en segundo plano PostgreSQL, hará migración automática de Django y levantará tu servidor de Next.js en el puerto 3000 con **Hot Reload** activado: cada vez que guardes un archivo en tu editor, el navegador se refrescará con los cambios instantáneamente).*

3. Para apagar todo cuando termines de trabajar:
   ```bash
   docker-compose down
   ```

### Al agregar nuevas librerías (NPM)
Dado que a veces tu entorno local de Windows es distinto al de Linux del contenedor, la forma más limpia y a prueba de errores para instalar librerías nuevas es que le mandes el comando al propio contenedor encendido de Next.js:
```bash
docker exec -it rest_frontend npm install nombre-del-paquete
```

---

## 🔑 3. El Paso Esencial: Cómo tener un Usuario de Prueba

Cuando ejecutes `docker-compose up -d` por primera vez, las bases de datos de Postgres en tu PC nacerán relucientes y vacías. Como no hay un sistema de "Registrarse" para el staff, **no tendrás con quién iniciar sesión**.

Para entrar a probar tu portal web web, debes **crearte un superusuario a ti mismo**. Para hacerlo, corre este código en la terminal desde la raíz:

```bash
docker exec -it rest_backend python manage.py createsuperuser
```

Te preguntará de forma interactiva tu usuario y tu contraseña. ¡Sácalas, ve a `http://localhost:3000` y experimenta el inicio de sesión real!
