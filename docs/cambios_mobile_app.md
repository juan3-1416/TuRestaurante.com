# Documentación de Cambios: Mobile App (Fase Sincronización WebSockets)

Este documento resume los ajustes y directrices aplicados en la aplicación móvil para garantizar su funcionamiento en red local y su integración con los WebSockets del backend, preparándola para una presentación en vivo mediante WiFi.

## 1. Conexión de Red (IP Local)
Para que la aplicación móvil pueda comunicarse con el servidor (Backend) albergado en la computadora principal a través de una red WiFi, es indispensable apuntar las conexiones a la IP de la red de la máquina anfitriona (en este caso, `192.168.100.122`), en lugar de utilizar rutas locales por defecto como `localhost` (que en un celular apunta al propio celular) o `10.0.2.2` (que solo funciona en emuladores de Android).

* **Nuevo Archivo de Configuración:** Se creó un nuevo archivo de configuración dedicado exclusivamente a manejar las constantes de red (como la IP del servidor). Este archivo centraliza la dirección, por lo que el día de la presentación, **solo se debe cambiar la IP local (`192.168.100.122`) en este único archivo** para que toda la app móvil funcione.
* **URL de la API REST:** La base de la URL (`baseUrl`) en las peticiones HTTP consume la IP definida en este nuevo archivo, apuntando correctamente a `http://192.168.100.122:8000/api`.

## 2. Implementación de WebSockets (Tiempo Real)
Para reflejar instantáneamente en la aplicación móvil los cambios realizados por otros usuarios en la web (y viceversa):

* **Dirección del WebSocket:** Se ajustó el protocolo y la ruta de conexión a `ws://192.168.100.122:8000/ws/tables/` (o la ruta específica de actualizaciones).
* **Actualización Reactiva de la UI:** Al recibir un mensaje del WebSocket (por ejemplo, `{"action": "table_updated"}`), la aplicación móvil está diseñada para invalidar el caché o forzar un re-fetch a la API REST para repintar la vista de mesas o el estado de una orden.
* **Manejo de Re-conexión:** Se consideraron prácticas para que la aplicación móvil intente reconectarse automáticamente si la señal WiFi fluctúa o el servidor se reinicia, garantizando que los meseros no pierdan sincronización con el sistema.

## 3. Resumen de Funcionamiento para la Presentación
* Todo el ecosistema (Django, Next.js Web, Mobile App) funciona en un entorno local LAN.
* No se requiere de internet externo para que la sincronización funcione, siempre y cuando todos los dispositivos estén en el mismo enrutador WiFi.
* Las acciones tomadas en la aplicación móvil actualizarán el estado en el backend, el cual disparará eventos WebSocket que refrescarán automáticamente las pantallas de la aplicación web (Caja o Dashboard) sin necesidad de recargar la página.
