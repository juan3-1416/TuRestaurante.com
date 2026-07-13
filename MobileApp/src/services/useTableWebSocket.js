import { useEffect, useRef } from "react";
import { WS_BASE_URL } from "./config";

export function useTableWebSocket(onUpdate) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelay = 3000; // 3 seconds

  useEffect(() => {
    const connect = () => {
      console.log("[WebSocket] Conectando a", `${WS_BASE_URL}/ws/tables/`);
      const ws = new WebSocket(`${WS_BASE_URL}/ws/tables/`);

      ws.onopen = () => {
        console.log("[WebSocket] Conectado exitosamente.");
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WebSocket] Mensaje recibido:", data);
          if (data.action === "table_updated") {
            if (onUpdate && typeof onUpdate === "function") {
              onUpdate();
            }
          }
        } catch (error) {
          console.error("[WebSocket] Error parseando mensaje:", error);
        }
      };

      ws.onclose = (e) => {
        console.log("[WebSocket] Desconectado. Razón:", e.reason);
        // Intentar reconectar si no fue un cierre limpio
        if (!e.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[WebSocket] Intentando reconectar...");
            connect();
          }, reconnectDelay);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error.message);
        ws.close();
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Componente desmontado"); // Cierre limpio
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [onUpdate]);

  return wsRef.current;
}
