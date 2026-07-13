/**
 * ARCHIVO DE CONFIGURACIÓN DE RED
 * 
 * INSTRUCCIONES PARA PRESENTACIÓN O PRUEBAS LOCALES:
 * 1. Conecta tu computadora y el celular a la misma red WiFi.
 * 2. En tu computadora, abre la terminal y busca tu IP Local:
 *    - Windows: Escribe `ipconfig` y busca "Dirección IPv4"
 *    - Mac/Linux: Escribe `ifconfig` o `ip a`
 * 3. Copia esa IP y pégala en la variable SERVER_IP de abajo.
 * 4. ¡Listo! Toda la aplicación usará esta nueva dirección automáticamente.
 */

export const SERVER_IP = "192.168.0.10"; // <-- CAMBIA ESTO POR LA IP DE TU WIFI
export const SERVER_PORT = "8000";

// URLs generadas automáticamente, ¡no necesitas tocarlas!
export const API_BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
export const WS_BASE_URL = `ws://${SERVER_IP}:${SERVER_PORT}`;
