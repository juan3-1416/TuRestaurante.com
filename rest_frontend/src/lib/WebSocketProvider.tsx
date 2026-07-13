"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelay = 3000;

  useEffect(() => {
    // Evitar que se conecte en el servidor durante el Server-Side Rendering
    if (typeof window === "undefined") return;

    const connect = () => {
      // Determinamos el protocolo (ws o wss) y el host dinámicamente basados en la URL del navegador
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      // El backend de Django siempre corre en el puerto 8000 en nuestro setup Docker
      const wsUrl = `${protocol}//${host}:8000/ws/tables/`;

      console.log("[WebSocket Web] Conectando a:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WebSocket Web] Conectado exitosamente.");
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WebSocket Web] Mensaje recibido:", data);
          
          if (data.action === "table_updated") {
            // Invalidamos el caché de React Query. Esto causará que cualquier 
            // pantalla que muestre mesas (pos, caja) se recargue silenciosamente.
            queryClient.invalidateQueries({ queryKey: ["tables"] });
          }
        } catch (error) {
          console.error("[WebSocket Web] Error parseando mensaje:", error);
        }
      };

      ws.onclose = (e) => {
        console.log("[WebSocket Web] Desconectado. Razón:", e.reason);
        // Intentar reconectar
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("[WebSocket Web] Intentando reconectar...");
          connect();
        }, reconnectDelay);
      };

      ws.onerror = (error) => {
        console.error("[WebSocket Web] Error de conexión.");
        ws.close();
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Componente desmontado");
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [queryClient]);

  return <>{children}</>;
}
