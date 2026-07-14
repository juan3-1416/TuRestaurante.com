import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useTableWebSocket } from "../services/useTableWebSocket";

import { API_BASE_URL } from "../services/config";

// Asegura que la fuente Feather esté disponible en Android.
if (typeof Icon.loadFont === "function") {
  Icon.loadFont().catch(() => {});
}

const API_URL = `${API_BASE_URL}/api/tables/`;
const USERS_URL = `${API_BASE_URL}/api/users/`;
const SHIFTS_URL = `${API_BASE_URL}/api/users/shifts/`;
const SHIFT_START_URL = `${API_BASE_URL}/api/users/shifts/start/`;
const SHIFT_END_URL = `${API_BASE_URL}/api/users/shifts/end/`;

const palette = {
  light: "#78B9B5",
  accent: "#0F828C",
  primary: "#065084",
  dark: "#320A6B",
  purpleMedium: "#4B1D7A",

  background: "#F6F9FB",
  surface: "#FFFFFF",
  card: "#DDEAF0",
  muted: "#EDF3F5",

  text: "#26055F",
  textSecondary: "#56667A",
  gray: "#728196",
  placeholder: "#97A5B5",
  border: "#D8E3E8",

  success: "#0B8A56",
  successBackground: "#ECF8F2",
  warning: "#C67A1D",
  warningBackground: "#FFF6E7",
  danger: "#FF6268",
  dangerBackground: "#FFF0F1",
  info: "#065084",
  infoBackground: "#E7F1F6",

  white: "#FFFFFF",
  overlay: "rgba(20, 7, 48, 0.48)",
};

export default function MesasScreen({ navigation }) {
  const [filter, setFilter] = useState("Todas");
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState("Administrador");
  const [userEmail, setUserEmail] = useState("Sesión activa");

  const [turnoActivo, setTurnoActivo] = useState(false);
  const [turnoActual, setTurnoActual] = useState(null);
  const [cargandoTurno, setCargandoTurno] = useState(true);
  const [procesandoTurno, setProcesandoTurno] = useState(false);
  const [modalCerrarTurnoVisible, setModalCerrarTurnoVisible] = useState(false);
  const [observacionesTurno, setObservacionesTurno] = useState("");

  // WebSocket Integration
  const onWebSocketUpdate = useCallback(() => {
    console.log("[MesasScreen] Ping recibido. Recargando mesas...");
    refrescarPantalla();
  }, []);
  
  useTableWebSocket(onWebSocketUpdate);

  const getTableNumber = (mesa) => {
    return mesa?.table_number ?? mesa?.number ?? "";
  };

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No existe token de autenticación");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const normalizarMesas = (data) => {
    const lista = Array.isArray(data) ? data : data?.results || [];

    return lista.sort((a, b) => {
      const numA = Number(getTableNumber(a));
      const numB = Number(getTableNumber(b));

      if (Number.isNaN(numA)) return 1;
      if (Number.isNaN(numB)) return -1;

      return numA - numB;
    });
  };

const obtenerUserIdDesdeToken = (token) => {
  try {
    if (!token) {
      return "";
    }

    const partes = token.split(".");

    if (partes.length < 2) {
      return "";
    }

    let base64 = partes[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    while (base64.length % 4) {
      base64 += "=";
    }

    if (!global.atob) {
      return "";
    }

    const payload = JSON.parse(global.atob(base64));

    return payload?.user_id
      ? String(payload.user_id)
      : "";
  } catch (error) {
    console.log("Error leyendo user_id del token:", error);
    return "";
  }
};

const normalizarListaUsuarios = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const cargarPerfil = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    const nombreGuardado = await AsyncStorage.getItem("userName");
    const correoGuardado = await AsyncStorage.getItem("userEmail");
    const loginUsername = await AsyncStorage.getItem("loginUsername");
    const userIdGuardado = await AsyncStorage.getItem("userId");

    setUserName(nombreGuardado || loginUsername || "Administrador");
    setUserEmail(correoGuardado || "Sesión activa");

    if (!token) {
      return;
    }

    if (
      nombreGuardado &&
      nombreGuardado !== "admin" &&
      nombreGuardado !== "Administrador" &&
      correoGuardado &&
      correoGuardado !== "Sesión activa"
    ) {
      return;
    }

    const userIdToken = obtenerUserIdDesdeToken(token);
    const userIdActual = userIdGuardado || userIdToken;

    if (userIdActual && !userIdGuardado) {
      await AsyncStorage.setItem("userId", String(userIdActual));
    }

    const response = await fetch(USERS_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await response.text();

    console.log("STATUS USUARIOS DRAWER MESAS:", response.status);
    console.log("RESPUESTA USUARIOS DRAWER MESAS:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(
        `El servidor no devolvió JSON. Estado: ${response.status}. Respuesta: ${text}`
      );
    }

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    const usuarios = normalizarListaUsuarios(data);

    const usuarioActual = usuarios.find((usuario) => {
      const coincidePorId =
        userIdActual &&
        String(usuario.id ?? "") === String(userIdActual);

      const coincidePorUsername =
        loginUsername &&
        String(usuario.username || "").toLowerCase() ===
          String(loginUsername).toLowerCase();

      const coincidePorEmail =
        loginUsername &&
        String(usuario.email || "").toLowerCase() ===
          String(loginUsername).toLowerCase();

      return (
        coincidePorId ||
        coincidePorUsername ||
        coincidePorEmail
      );
    });

    if (!usuarioActual) {
      return;
    }

    const nombreCompleto =
      `${usuarioActual.first_name || ""} ${usuarioActual.last_name || ""}`.trim() ||
      usuarioActual.username ||
      nombreGuardado ||
      loginUsername ||
      "Usuario";

    const emailUsuario =
      usuarioActual.email ||
      correoGuardado ||
      "Sesión activa";

    await AsyncStorage.multiSet([
      ["userId", String(usuarioActual.id ?? userIdActual ?? "")],
      [
        "loginUsername",
        usuarioActual.username || loginUsername || "",
      ],
      ["userName", nombreCompleto],
      ["userEmail", emailUsuario],
      ["userRole", usuarioActual.role || ""],
    ]);

    setUserName(nombreCompleto);
    setUserEmail(emailUsuario);
  } catch (error) {
    console.log("Error cargando perfil:", error);

    const nombreGuardado = await AsyncStorage.getItem("userName");
    const correoGuardado = await AsyncStorage.getItem("userEmail");
    const loginUsername = await AsyncStorage.getItem("loginUsername");

    setUserName(
      nombreGuardado ||
        loginUsername ||
        "Administrador"
    );
    setUserEmail(correoGuardado || "Sesión activa");
  }
};

  const normalizarTurnos = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  };


  const obtenerPropietarioTurno = (turno) => {
    const candidato =
      turno?.user ??
      turno?.user_id ??
      turno?.employee ??
      turno?.employee_id ??
      turno?.waiter ??
      turno?.waiter_id ??
      turno?.created_by ??
      turno?.created_by_id ??
      turno?.staff ??
      turno?.staff_id;

    if (
      typeof candidato === "object" &&
      candidato !== null
    ) {
      return {
        id:
          candidato.id ??
          candidato.user_id ??
          candidato.pk ??
          null,
        username:
          candidato.username ??
          candidato.email ??
          candidato.user_name ??
          "",
      };
    }

    return {
      id:
        candidato !== null &&
        candidato !== undefined
          ? candidato
          : null,
      username:
        turno?.username ??
        turno?.user_name ??
        turno?.user_email ??
        turno?.employee_email ??
        "",
    };
  };

  const turnoPerteneceAlUsuario = (
    turno,
    userIdActual,
    usernameActual
  ) => {
    const propietario = obtenerPropietarioTurno(turno);

    const coincideId =
      propietario.id !== null &&
      propietario.id !== undefined &&
      userIdActual &&
      String(propietario.id) === String(userIdActual);

    const coincideUsername =
      propietario.username &&
      usernameActual &&
      String(propietario.username).toLowerCase() ===
        String(usernameActual).toLowerCase();

    return coincideId || coincideUsername;
  };

  const parseJsonSeguro = async (response, contexto) => {
    const text = await response.text();

    console.log(`STATUS ${contexto}:`, response.status);
    console.log(`RESPUESTA ${contexto}:`, text);

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(
        `El servidor no devolvió JSON en ${contexto}. ` +
          `Estado: ${response.status}. Respuesta: ${text}`
      );
    }
  };

  const obtenerMensajeBackend = (data, mensajeDefault) => {
    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data?.detail) {
      return String(data.detail);
    }

    if (data?.error) {
      return String(data.error);
    }

    if (data?.message) {
      return String(data.message);
    }

    if (data && typeof data === "object") {
      const primerValor = Object.values(data)[0];

      if (Array.isArray(primerValor) && primerValor.length > 0) {
        return String(primerValor[0]);
      }

      if (typeof primerValor === "string") {
        return primerValor;
      }
    }

    return mensajeDefault;
  };

  const formatearFechaHora = (valor) => {
    if (!valor) {
      return "Hora no disponible";
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return String(valor);
    }

    return fecha.toLocaleString();
  };

  const cargarEstadoTurno = async (mostrarCarga = true) => {
    const tokenConsulta = await AsyncStorage.getItem(
      "accessToken"
    );

    try {
      if (mostrarCarga) {
        setCargandoTurno(true);
      }

      // Evita mostrar temporalmente el turno del usuario anterior.
      setTurnoActivo(false);
      setTurnoActual(null);

      if (!tokenConsulta) {
        throw new Error("No existe token de autenticación");
      }

      const userIdGuardado = await AsyncStorage.getItem(
        "userId"
      );

      const userIdToken =
        obtenerUserIdDesdeToken(tokenConsulta);

      const userIdActual =
        userIdGuardado || userIdToken;

      const loginUsername = await AsyncStorage.getItem(
        "loginUsername"
      );

      if (!userIdActual && !loginUsername) {
        throw new Error(
          "No se pudo identificar al usuario activo."
        );
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenConsulta}`,
      };

      const response = await fetch(SHIFTS_URL, {
        method: "GET",
        headers: {
          ...headers,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const data = await parseJsonSeguro(
        response,
        "ESTADO TURNO"
      );

      if (!response.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudo consultar el estado del turno."
          )
        );
      }

      // Si el usuario cambió durante la petición, se ignora
      // completamente la respuesta del token anterior.
      const tokenActual = await AsyncStorage.getItem(
        "accessToken"
      );

      if (tokenActual !== tokenConsulta) {
        console.log(
          "RESPUESTA DE TURNOS IGNORADA: LA SESIÓN CAMBIÓ"
        );
        return;
      }

      const todosLosTurnos = normalizarTurnos(data);

      const respuestaExponePropietario =
        todosLosTurnos.some((turno) => {
          const propietario =
            obtenerPropietarioTurno(turno);

          return (
            propietario.id !== null &&
            propietario.id !== undefined
          ) || Boolean(propietario.username);
        });

      const turnosDelUsuario =
        respuestaExponePropietario
          ? todosLosTurnos.filter((turno) =>
              turnoPerteneceAlUsuario(
                turno,
                userIdActual,
                loginUsername
              )
            )
          : todosLosTurnos;

      if (
        !respuestaExponePropietario &&
        todosLosTurnos.length > 0
      ) {
        console.log(
          "ADVERTENCIA TURNOS: el backend no devuelve " +
            "el propietario del turno. Se confía en que " +
            "GET /api/users/shifts/ esté filtrado por request.user."
        );
      }

      const turnosOrdenados = [...turnosDelUsuario].sort(
        (a, b) => {
          const fechaA = new Date(
            a?.start_time || a?.created_at || 0
          ).getTime();

          const fechaB = new Date(
            b?.start_time || b?.created_at || 0
          ).getTime();

          return fechaB - fechaA;
        }
      );

      const turnoAbierto =
        turnosOrdenados.find(
          (turno) => turno?.is_active === true
        ) || null;

      const ultimoTurno =
        turnoAbierto || turnosOrdenados[0] || null;

      console.log("USUARIO CONSULTANDO TURNOS:", {
        userIdActual,
        loginUsername,
      });
      console.log(
        "TOTAL TURNOS RECIBIDOS:",
        todosLosTurnos.length
      );
      console.log(
        "TURNOS DEL USUARIO ACTUAL:",
        turnosDelUsuario
      );
      console.log(
        "TURNO ACTIVO DEL USUARIO:",
        turnoAbierto
      );

      setTurnoActivo(Boolean(turnoAbierto));
      setTurnoActual(ultimoTurno);
    } catch (error) {
      console.log("Error consultando turno:", error);

      setTurnoActivo(false);
      setTurnoActual(null);
    } finally {
      const tokenActual = await AsyncStorage.getItem(
        "accessToken"
      );

      if (tokenActual === tokenConsulta) {
        setCargandoTurno(false);
      }
    }
  };

  const iniciarTurno = async () => {
    if (turnoActivo || procesandoTurno) {
      return;
    }

    Alert.alert(
      "Iniciar turno",
      "¿Confirmas que estás listo para comenzar tu jornada?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Iniciar",
          onPress: async () => {
            try {
              setProcesandoTurno(true);

              const headers = await getAuthHeaders();

              const response = await fetch(SHIFT_START_URL, {
                method: "POST",
                headers,
              });

              const data = await parseJsonSeguro(
                response,
                "INICIAR TURNO"
              );

              if (!response.ok) {
                throw new Error(
                  obtenerMensajeBackend(
                    data,
                    "No se pudo iniciar el turno."
                  )
                );
              }

              setTurnoActivo(true);
              setTurnoActual(data);

              Alert.alert(
                "Turno iniciado",
                data?.start_time
                  ? `Inicio registrado: ${formatearFechaHora(
                      data.start_time
                    )}`
                  : "Tu turno fue iniciado correctamente."
              );

              await cargarEstadoTurno(false);
            } catch (error) {
              console.log("Error iniciando turno:", error);

              Alert.alert(
                "No se pudo iniciar",
                error?.message ||
                  "Ocurrió un error al iniciar el turno."
              );

              await cargarEstadoTurno(false);
            } finally {
              setProcesandoTurno(false);
            }
          },
        },
      ]
    );
  };

  const abrirModalCerrarTurno = () => {
    if (!turnoActivo || procesandoTurno) {
      return;
    }

    setObservacionesTurno("");
    setModalCerrarTurnoVisible(true);
  };

  const cerrarModalTurno = () => {
    if (procesandoTurno) {
      return;
    }

    setModalCerrarTurnoVisible(false);
    setObservacionesTurno("");
  };

  const cerrarTurno = async () => {
    if (!turnoActivo || procesandoTurno) {
      return;
    }

    try {
      setProcesandoTurno(true);

      const headers = await getAuthHeaders();
      const observaciones = observacionesTurno.trim();

      const opciones = {
        method: "POST",
        headers,
      };

      if (observaciones) {
        opciones.body = JSON.stringify({
          observations: observaciones,
        });
      }

      const response = await fetch(
        SHIFT_END_URL,
        opciones
      );

      const data = await parseJsonSeguro(
        response,
        "CERRAR TURNO"
      );

      if (!response.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudo cerrar el turno."
          )
        );
      }

      setModalCerrarTurnoVisible(false);
      setObservacionesTurno("");
      setTurnoActivo(false);
      setTurnoActual(data);

      Alert.alert(
        "Turno cerrado",
        "Tu jornada fue registrada correctamente."
      );

      await cargarEstadoTurno(false);
    } catch (error) {
      console.log("Error cerrando turno:", error);

      Alert.alert(
        "No se pudo cerrar",
        error?.message ||
          "Ocurrió un error al cerrar el turno."
      );

      await cargarEstadoTurno(false);
    } finally {
      setProcesandoTurno(false);
    }
  };

  const refrescarPantalla = async () => {
    await Promise.all([
      cargarMesas(),
      cargarEstadoTurno(false),
    ]);
  };

  const cargarMesas = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      console.log("========== CARGAR MESAS ==========");
      console.log("URL MESAS:", API_URL);
      console.log("HEADERS MESAS:", {
        ...headers,
        Authorization: headers.Authorization ? "Bearer TOKEN_EXISTE" : "SIN TOKEN",
      });

      const response = await fetch(API_URL, {
        method: "GET",
        headers,
      });

      const text = await response.text();

      console.log("STATUS MESAS:", response.status);
      console.log("RESPUESTA MESAS:", text);
      console.log("==================================");

      let data;

      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error(
          `El servidor no devolvió JSON. Estado: ${response.status}. Respuesta: ${text}`
        );
      }

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      const mesasOrdenadas = normalizarMesas(data);

      setTables(mesasOrdenadas);
    } catch (error) {
      console.log("Error al cargar mesas:", error);

      Alert.alert(
        "Error",
        "No se pudieron cargar las mesas. Revisa la consola para ver la respuesta del backend."
      );
    } finally {
      setLoading(false);
    }
  };
useFocusEffect(
  useCallback(() => {
    cargarPerfil();
    cargarMesas();
    cargarEstadoTurno();
  }, [])
);

  const irPedidosPendientes = () => {
    setMenuVisible(false);
    navigation.navigate("PedidosPendientes");
  };

  const irHistorial = () => {
    setMenuVisible(false);
    navigation.navigate("HistorialOrdenes");
  };

  const cerrarSesion = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que deseas salir de TuRestaurante.com?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            try {
await AsyncStorage.multiRemove([
  "accessToken",
  "refreshToken",
  "userId",
  "userName",
  "userEmail",
  "userRole",
  "loginUsername",
]);

              setTurnoActivo(false);
              setTurnoActual(null);
              setCargandoTurno(true);
              setProcesandoTurno(false);
              setModalCerrarTurnoVisible(false);
              setObservacionesTurno("");
              setMenuVisible(false);

              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              console.log("Error cerrando sesión:", error);
            }
          },
        },
      ]
    );
  };

  const updateTableCapacity = async (tableId, newCapacity) => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}${tableId}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          capacity: Number(newCapacity),
        }),
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error(
          `El servidor no devolvió JSON. Estado: ${response.status}. Respuesta: ${text}`
        );
      }

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      setTables((prevTables) =>
        prevTables.map((mesa) =>
          mesa.id === tableId
            ? { ...mesa, capacity: Number(newCapacity) }
            : mesa
        )
      );
    } catch (error) {
      console.log("Error editando capacidad:", error);
      Alert.alert("Error", "No se pudo modificar la capacidad de la mesa.");
    }
  };

  const crearMesa = async () => {
    try {
      const headers = await getAuthHeaders();

      const numerosExistentes = tables
        .map((mesa) => Number(getTableNumber(mesa)))
        .filter((numero) => !Number.isNaN(numero));

      const siguienteNumero =
        numerosExistentes.length > 0
          ? Math.max(...numerosExistentes) + 1
          : 1;

      const nuevaMesa = {
        table_number: String(siguienteNumero),
        capacity: 4,
        status: "Libre",
        pos_x: 0,
        pos_y: 0,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(nuevaMesa),
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error(
          `El servidor no devolvió JSON. Estado: ${response.status}. Respuesta: ${text}`
        );
      }

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      await cargarMesas();
    } catch (error) {
      console.log("Error creando mesa:", error);
      Alert.alert("Error", "No se pudo crear la mesa.");
    }
  };

  const puedeEliminarMesa = (mesa) => {
    return mesa.status === "Libre";
  };

  const confirmarEliminarMesa = (mesa) => {
    const numeroMesa = getTableNumber(mesa);

    if (!puedeEliminarMesa(mesa)) {
      Alert.alert(
        "No se puede eliminar",
        "Solo se pueden eliminar mesas libres. Las mesas ocupadas, reservadas o con pedido no deben eliminarse desde la aplicación móvil."
      );
      return;
    }

    Alert.alert(
      "Eliminar mesa",
      `¿Seguro que deseas eliminar la Mesa ${numeroMesa}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => eliminarMesa(mesa.id),
        },
      ]
    );
  };

  const eliminarMesa = async (id) => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Error al eliminar mesa");
      }

      setTables((prevTables) =>
        prevTables.filter((mesa) => mesa.id !== id)
      );
    } catch (error) {
      console.log("Error eliminando mesa:", error);
      Alert.alert("Error", "No se pudo eliminar la mesa.");
    }
  };

  const statusMatches = (status, expected) =>
    String(status || "").toLowerCase() ===
    String(expected || "").toLowerCase();

  const filterCounts = {
    Todas: tables.length,
    Libre: tables.filter((table) =>
      statusMatches(table.status, "Libre")
    ).length,
    Ocupada: tables.filter((table) =>
      statusMatches(table.status, "Ocupada")
    ).length,
    Reservada: tables.filter((table) =>
      statusMatches(table.status, "Reservada")
    ).length,
  };

  const filtered =
    filter === "Todas"
      ? tables
      : tables.filter((table) =>
          statusMatches(table.status, filter)
        );

  const getStyles = (status) => {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    switch (normalizedStatus) {
      case "libre":
        return {
          color: palette.accent,
          borderColor: palette.border,
          icon: "check",
          label: "Disponible",
          metricLabel: "ESTADO",
        };
      case "ocupada":
        return {
          color: palette.danger,
          borderColor: "#FF9EA2",
          icon: "shopping-bag",
          label: "Ocupada",
          metricLabel: "CONSUMO",
        };
      case "reservada":
        return {
          color: palette.warning,
          borderColor: "#E8C38F",
          icon: "calendar",
          label: "Reservada",
          metricLabel: "RESERVA",
        };
      case "pedido":
        return {
          color: palette.accent,
          borderColor: palette.light,
          icon: "shopping-cart",
          label: "Pedido activo",
          metricLabel: "PEDIDO",
        };
      default:
        return {
          color: palette.gray,
          borderColor: palette.border,
          icon: "circle",
          label: status || "Sin estado",
          metricLabel: "ESTADO",
        };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStyles(item.status);
    const numeroMesa = getTableNumber(item);
    const customerName =
      item.customerName ??
      item.customer_name ??
      "";

    const activeTime =
      item.activeTime ??
      item.active_time ??
      "";

    const currentTotal =
      item.currentTotal ??
      item.current_total ??
      item.total ??
      0;

    const isOccupied = statusMatches(
      item.status,
      "Ocupada"
    );

    const isReserved = statusMatches(
      item.status,
      "Reservada"
    );

    const isFree = statusMatches(
      item.status,
      "Libre"
    );

    let metricValue = statusStyle.label;

    if (isOccupied) {
      metricValue = `Bs. ${Number(currentTotal || 0).toFixed(2)}`;
    } else if (isReserved) {
      metricValue = activeTime || "Reservada";
    } else if (isFree) {
      metricValue = "Disponible";
    }

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        style={[
          styles.card,
          {
            borderColor: statusStyle.borderColor,
          },
        ]}
        onPress={() =>
          navigation.navigate("Pedido", {
            mesa: item,
          })
        }
      >
        <View
          style={[
            styles.dot,
            {
              backgroundColor: statusStyle.color,
            },
          ]}
        />

        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Icon
              name={statusStyle.icon}
              size={20}
              color={statusStyle.color}
            />
          </View>

          <View style={styles.cardTitleBox}>
            <Text
              numberOfLines={1}
              style={styles.title}
            >
              Mesa {numeroMesa}
            </Text>

            <View style={styles.capacityRow}>
              <Icon
                name="users"
                size={12}
                color={palette.gray}
              />
              <Text style={styles.sub}>
                {item.capacity || 0} personas
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.activityArea}>
          {customerName ? (
            <>
              <Text style={styles.activityLabel}>
                CLIENTE
              </Text>
              <Text
                numberOfLines={2}
                style={styles.client}
              >
                {customerName}
              </Text>
            </>
          ) : (
            <Text style={styles.empty}>
              Sin actividad reciente
            </Text>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>
              {statusStyle.metricLabel}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.metricValue,
                {
                  color:
                    isOccupied
                      ? palette.primary
                      : statusStyle.color,
                },
              ]}
            >
              {metricValue}
            </Text>
          </View>

          <View style={styles.cardArrow}>
            <Icon
              name="chevron-right"
              size={17}
              color={palette.primary}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal
        visible={modalCerrarTurnoVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModalTurno}
      >
        <View style={styles.shiftModalOverlay}>
          <View style={styles.shiftModalCard}>
            <View style={styles.shiftModalHeader}>
              <View style={styles.shiftModalTitleRow}>
                <View style={styles.shiftModalIcon}>
                  <Icon
                    name="log-out"
                    size={21}
                    color={palette.white}
                  />
                </View>

                <View style={styles.shiftModalTitleBox}>
                  <Text style={styles.shiftModalTitle}>
                    Cerrar turno
                  </Text>

                  <Text style={styles.shiftModalSubtitle}>
                    Finaliza tu jornada como mesero
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.shiftModalClose}
                onPress={cerrarModalTurno}
                disabled={procesandoTurno}
              >
                <Icon
                  name="x"
                  size={21}
                  color={palette.light}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.shiftObservationLabel}>
              Observación opcional
            </Text>

            <TextInput
              style={styles.shiftObservationInput}
              placeholder="Ej.: Entregué las mesas pendientes al siguiente turno"
              placeholderTextColor={palette.placeholder}
              value={observacionesTurno}
              onChangeText={setObservacionesTurno}
              editable={!procesandoTurno}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />

            <Text style={styles.shiftObservationCounter}>
              {observacionesTurno.length}/500
            </Text>

            <View style={styles.shiftModalActions}>
              <TouchableOpacity
                style={styles.shiftCancelButton}
                onPress={cerrarModalTurno}
                disabled={procesandoTurno}
              >
                <Text style={styles.shiftCancelText}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.shiftEndConfirmButton,
                  procesandoTurno &&
                    styles.shiftButtonDisabled,
                ]}
                onPress={cerrarTurno}
                disabled={procesandoTurno}
              >
                {procesandoTurno ? (
                  <ActivityIndicator
                    size="small"
                    color={palette.white}
                  />
                ) : (
                  <>

                    <Text style={styles.shiftEndConfirmText}>
                      Cerrar turno
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalBackground}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />

          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setMenuVisible(false)}
              >
                <Icon name="x" size={24} color={palette.white} />
              </TouchableOpacity>

              <View style={styles.drawerBrandRow}>
                <View style={styles.brandLogo}>
                  <Text style={styles.brandLogoText}>N</Text>
                </View>

                <View style={styles.brandTextBox}>
                  <Text style={styles.brandName}>NextOrder</Text>
                  <Text style={styles.brandRole}>MESERO</Text>
                </View>
              </View>

              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>

              <Text style={styles.drawerName}>{userName}</Text>
              <Text style={styles.drawerEmail}>{userEmail}</Text>

              <View
                style={[
                  styles.drawerShiftBadge,
                  turnoActivo
                    ? styles.drawerShiftBadgeActive
                    : styles.drawerShiftBadgeInactive,
                ]}
              >
                <View
                  style={[
                    styles.drawerShiftDot,
                    turnoActivo
                      ? styles.drawerShiftDotActive
                      : styles.drawerShiftDotInactive,
                  ]}
                />

                <Text style={styles.drawerShiftText}>
                  {turnoActivo
                    ? "Turno activo"
                    : "Sin turno activo"}
                </Text>
              </View>
            </View>

            <View style={styles.drawerMenu}>
              <TouchableOpacity
                style={[styles.drawerItem, styles.drawerItemActive]}
                onPress={() => setMenuVisible(false)}
              >
                <Icon name="grid" size={21} color={palette.white} />
                <Text style={styles.drawerItemText}>Mapa de mesas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={irPedidosPendientes}
              >
                <Icon
                  name="clipboard"
                  size={21}
                  color={palette.light}
                />
                <Text style={styles.drawerItemText}>
                  Pedidos pendientes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={irHistorial}
              >
                <Icon
                  name="clock"
                  size={21}
                  color={palette.light}
                />
                <Text style={styles.drawerItemText}>
                  Historial de ventas
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={cerrarSesion}
              >
                <Icon name="log-out" size={20} color="#FFB4B8" />
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuVisible(true)}
          >
            <Icon name="menu" size={23} color={palette.white} />
          </TouchableOpacity>

          <View style={styles.headerTextBox}>
            <Text style={styles.pageTitle}>Mapa de Mesas</Text>
            <Text style={styles.pageSubtitle}>
              Estado del restaurante en tiempo real
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={refrescarPantalla}
            disabled={loading || procesandoTurno}
          >
            {loading ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <Icon name="refresh-cw" size={18} color={palette.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.shiftCard,
            turnoActivo
              ? styles.shiftCardActive
              : styles.shiftCardInactive,
          ]}
        >
          <View style={styles.shiftCardTop}>
            <View
              style={[
                styles.shiftStatusIcon,
                turnoActivo
                  ? styles.shiftStatusIconActive
                  : styles.shiftStatusIconInactive,
              ]}
            >
              <Icon
                name={turnoActivo ? "clock" : "coffee"}
                size={23}
                color={
                  turnoActivo
                    ? palette.success
                    : palette.primary
                }
              />
            </View>

            <View style={styles.shiftInfo}>
              <View style={styles.shiftTitleRow}>
                <Text style={styles.shiftTitle}>
                  {turnoActivo
                    ? "Turno activo"
                    : "Sin turno activo"}
                </Text>

                <View
                  style={[
                    styles.shiftBadge,
                    turnoActivo
                      ? styles.shiftBadgeActive
                      : styles.shiftBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.shiftBadgeText,
                      turnoActivo
                        ? styles.shiftBadgeTextActive
                        : styles.shiftBadgeTextInactive,
                    ]}
                  >
                    {turnoActivo
                      ? "TRABAJANDO"
                      : "DISPONIBLE"}
                  </Text>
                </View>
              </View>

              {cargandoTurno ? (
                <Text style={styles.shiftDescription}>
                  Verificando estado del turno...
                </Text>
              ) : turnoActivo ? (
                <Text style={styles.shiftDescription}>
                  Inicio:{" "}
                  {formatearFechaHora(
                    turnoActual?.start_time
                  )}
                </Text>
              ) : (
                <Text style={styles.shiftDescription}>
                  Puedes revisar la app. Inicia el turno
                  cuando estés listo para atender mesas.
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.shiftActionButton,
              turnoActivo
                ? styles.shiftEndButton
                : styles.shiftStartButton,
              (cargandoTurno || procesandoTurno) &&
                styles.shiftButtonDisabled,
            ]}
            onPress={
              turnoActivo
                ? abrirModalCerrarTurno
                : iniciarTurno
            }
            disabled={
              cargandoTurno || procesandoTurno
            }
          >
            {procesandoTurno ? (
              <ActivityIndicator
                size="small"
                color={palette.white}
              />
            ) : (
              <>


                <Text style={styles.shiftActionText}>
                  {turnoActivo
                    ? "Cerrar turno"
                    : "Iniciar turno"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.filterPanel}>
          <View style={styles.filterHeadingRow}>
            <View style={styles.filterHeadingIcon}>
              <Icon name="filter" size={17} color={palette.primary} />
            </View>

            <Text style={styles.filterHeading}>Filtrar mesas</Text>
          </View>

          <View style={styles.filters}>
            {["Todas", "Libre", "Ocupada", "Reservada"].map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[
                    styles.filter,
                    filter === item && styles.activeFilter,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.filterText,
                      filter === item &&
                        styles.activeFilterText,
                    ]}
                  >
                    {item} ({filterCounts[item] || 0})
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={styles.loadingText}>Cargando mesas...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            ListEmptyComponent={
              <View style={styles.emptyListBox}>
                <Text style={styles.emptyListText}>
                  No hay mesas para mostrar.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  topBar: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: palette.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: palette.border,
    elevation: 2,
    shadowColor: "#16072F",
    shadowOpacity: 0.08,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },

  menuBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: palette.dark,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextBox: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: palette.dark,
  },

  pageSubtitle: {
    marginTop: 2,
    fontSize: 10.5,
    color: palette.textSecondary,
  },

  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E3EFF3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D2E4EA",
  },

  addMesaBtn: {
    display: "none",
  },

  addMesaText: {
    color: palette.white,
    fontWeight: "800",
  },

  shiftCard: {
    borderRadius: 18,
    padding: 13,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: palette.surface,
    elevation: 1,
    shadowColor: "#16072F",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  shiftCardActive: {
    borderColor: "#A9DBC3",
    borderLeftWidth: 5,
    borderLeftColor: palette.success,
  },

  shiftCardInactive: {
    borderColor: palette.border,
    borderLeftWidth: 5,
    borderLeftColor: palette.primary,
  },

  shiftCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  shiftStatusIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  shiftStatusIconActive: {
    backgroundColor: palette.successBackground,
    borderWidth: 1,
    borderColor: "#B9E3CE",
  },

  shiftStatusIconInactive: {
    backgroundColor: palette.infoBackground,
    borderWidth: 1,
    borderColor: "#C7DDE7",
  },

  shiftInfo: {
    flex: 1,
  },

  shiftTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  shiftTitle: {
    color: palette.dark,
    fontSize: 15,
    fontWeight: "900",
    marginRight: 7,
  },

  shiftBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },

  shiftBadgeActive: {
    backgroundColor: palette.success,
  },

  shiftBadgeInactive: {
    backgroundColor: palette.infoBackground,
  },

  shiftBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.45,
  },

  shiftBadgeTextActive: {
    color: palette.white,
  },

  shiftBadgeTextInactive: {
    color: palette.primary,
  },

  shiftDescription: {
    color: palette.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 4,
  },

  shiftActionButton: {
    minHeight: 40,
    borderRadius: 12,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  shiftStartButton: {
    backgroundColor: palette.primary,
  },

  shiftEndButton: {
    backgroundColor: palette.dark,
  },

  shiftButtonDisabled: {
    opacity: 0.6,
  },

  shiftActionText: {
    color: palette.white,
    fontSize: 12.5,
    fontWeight: "900",
    marginLeft: 7,
  },

  filterPanel: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
    elevation: 1,
  },

  filterHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  filterHeadingIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#E3EFF3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  filterHeading: {
    color: palette.dark,
    fontSize: 13,
    fontWeight: "900",
  },

  filters: {
    flexDirection: "row",
  },

  filter: {
    flex: 1,
    minHeight: 36,
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: palette.muted,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },

  activeFilter: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    elevation: 2,
  },

  filterText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: palette.dark,
  },

  activeFilterText: {
    color: palette.white,
  },

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: palette.textSecondary,
    fontWeight: "800",
  },

  emptyListBox: {
    paddingVertical: 48,
    alignItems: "center",
  },

  emptyListText: {
    color: palette.gray,
    fontWeight: "800",
  },

  listContent: {
    paddingBottom: 24,
  },

  columnWrapper: {
    justifyContent: "space-between",
  },

  card: {
    width: "48.5%",
    minHeight: 205,
    padding: 14,
    borderRadius: 24,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#16072F",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  dot: {
    position: "absolute",
    top: 13,
    right: 13,
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    elevation: 1,
  },

  cardTitleBox: {
    flex: 1,
  },

  title: {
    fontSize: 17,
    fontWeight: "900",
    color: palette.dark,
  },

  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  sub: {
    fontSize: 10.5,
    color: palette.gray,
    marginLeft: 4,
  },

  activityArea: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 14,
  },

  activityLabel: {
    fontSize: 8.5,
    color: palette.gray,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  client: {
    marginTop: 3,
    fontWeight: "800",
    fontSize: 12,
    color: palette.text,
  },

  empty: {
    fontSize: 11.5,
    fontStyle: "italic",
    color: palette.placeholder,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  metricBox: {
    flex: 1,
    paddingRight: 6,
  },

  metricLabel: {
    fontSize: 8.5,
    color: palette.primary,
    fontWeight: "800",
    letterSpacing: 0.45,
  },

  metricValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "900",
  },

  cardArrow: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.68)",
    alignItems: "center",
    justifyContent: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  clientBox: {
    backgroundColor: palette.muted,
    padding: 10,
    borderRadius: 15,
    marginTop: 10,
  },

  clientLabel: {
    fontSize: 10,
    color: palette.gray,
  },

  footer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  total: {
    fontWeight: "900",
    color: palette.primary,
  },

  time: {
    color: palette.warning,
    fontWeight: "700",
  },

  available: {
    color: palette.success,
    fontWeight: "800",
  },

  orderText: {
    color: palette.accent,
    fontWeight: "800",
  },

  editBtn: {
    display: "none",
  },

  editText: {
    color: palette.primary,
    fontWeight: "800",
  },

  deleteBtn: {
    display: "none",
  },

  deleteBtnDisabled: {
    display: "none",
  },

  deleteText: {
    color: palette.danger,
    fontWeight: "800",
  },

  deleteTextDisabled: {
    color: palette.placeholder,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: palette.overlay,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  drawer: {
    width: "82%",
    maxWidth: 340,
    height: "100%",
    backgroundColor: palette.dark,
    elevation: 14,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  drawerHeader: {
    backgroundColor: palette.dark,
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },

  closeBtn: {
    position: "absolute",
    top: 17,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  drawerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingRight: 42,
  },

  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  brandLogoText: {
    color: palette.white,
    fontSize: 22,
    fontWeight: "900",
  },

  brandTextBox: {
    flex: 1,
  },

  brandName: {
    color: palette.white,
    fontSize: 20,
    fontWeight: "900",
  },

  brandRole: {
    color: palette.light,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(120,185,181,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
    borderWidth: 1,
    borderColor: palette.light,
  },

  avatarText: {
    color: palette.white,
    fontSize: 18,
    fontWeight: "900",
  },

  drawerName: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "900",
  },

  drawerEmail: {
    color: "#CFC4E5",
    fontSize: 11.5,
    marginTop: 4,
  },

  drawerShiftBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  drawerShiftBadgeActive: {
    backgroundColor: "rgba(11,138,86,0.28)",
  },

  drawerShiftBadgeInactive: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  drawerShiftDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },

  drawerShiftDotActive: {
    backgroundColor: "#68E4A8",
  },

  drawerShiftDotInactive: {
    backgroundColor: palette.light,
  },

  drawerShiftText: {
    color: palette.white,
    fontSize: 10.5,
    fontWeight: "800",
  },

  drawerMenu: {
    paddingHorizontal: 14,
    paddingTop: 18,
  },

  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 15,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: "transparent",
  },

  drawerItemActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderLeftWidth: 4,
    borderLeftColor: palette.light,
  },

  drawerItemText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 13,
  },

  drawerFooter: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: "rgba(255,98,104,0.14)",
  },

  logoutText: {
    color: "#FFB4B8",
    fontWeight: "900",
    fontSize: 14,
    marginLeft: 11,
  },

  shiftModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: palette.overlay,
  },

  shiftModalCard: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },

  shiftModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  shiftModalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  shiftModalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.dark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  shiftModalTitleBox: {
    flex: 1,
  },

  shiftModalTitle: {
    color: palette.dark,
    fontSize: 20,
    fontWeight: "900",
  },

  shiftModalSubtitle: {
    color: palette.gray,
    fontSize: 12,
    marginTop: 3,
  },

  shiftModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.muted,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  shiftObservationLabel: {
    color: palette.dark,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },

  shiftObservationInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: palette.text,
    backgroundColor: palette.background,
    fontSize: 14,
  },

  shiftObservationCounter: {
    alignSelf: "flex-end",
    color: palette.gray,
    fontSize: 11,
    marginTop: 5,
  },

  shiftModalActions: {
    flexDirection: "row",
    marginTop: 18,
  },

  shiftCancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: palette.muted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.border,
    marginRight: 5,
  },

  shiftCancelText: {
    color: palette.textSecondary,
    fontWeight: "900",
  },

  shiftEndConfirmButton: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: palette.dark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },

  shiftEndConfirmText: {
    color: palette.white,
    fontWeight: "900",
    marginLeft: 7,
  },
});
