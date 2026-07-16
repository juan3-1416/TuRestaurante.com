import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { API_BASE_URL } from "../services/config";

// Asegura que los íconos Feather estén disponibles en Android.
if (typeof Icon.loadFont === "function") {
  Icon.loadFont().catch(() => {});
}

const PRODUCTS_URL = `${API_BASE_URL}/api/inventory/products/`;
const ORDERS_URL = `${API_BASE_URL}/api/orders/orders/`;
const ORDER_OWNERS_STORAGE_KEY = "orderOwnersById";
const ORDER_ITEMS_URL = `${API_BASE_URL}/api/orders/order-items/`;
const TABLES_URL = `${API_BASE_URL}/api/tables/`;
const SHIFTS_URL = `${API_BASE_URL}/api/users/shifts/`;

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

export default function PedidoScreen({ route, navigation }) {
  const { mesa } = route.params;

  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] =
    useState(null);

  const [carrito, setCarrito] = useState([]);
  const [pedidoActual, setPedidoActual] = useState([]);
  const [ordenPendiente, setOrdenPendiente] = useState(null);
  const [pedidoBloqueado, setPedidoBloqueado] = useState(false);
  const [mensajeBloqueo, setMensajeBloqueo] = useState("");
  const [propietarioPedido, setPropietarioPedido] = useState("");

  const [loading, setLoading] = useState(true);
  const [cargandoPedidoActual, setCargandoPedidoActual] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [vista, setVista] = useState("productos");
  const [actualizandoMenu, setActualizandoMenu] = useState(false);

  const [turnoActivo, setTurnoActivo] = useState(false);
  const [cargandoTurno, setCargandoTurno] = useState(true);

  const getMesaNumber = () => {
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

  const parseJsonResponse = async (response, contexto) => {
    const text = await response.text();

    console.log(`STATUS ${contexto}:`, response.status);
    console.log(`RESPUESTA ${contexto}:`, text);

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(
        `El servidor no devolvió JSON en ${contexto}. Estado: ${response.status}. Respuesta: ${text}`
      );
    }
  };

  const normalizarLista = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  };

  const obtenerUserIdDesdeToken = (token) => {
    try {
      if (!token) {
        return null;
      }

      const payloadBase64 = token.split(".")[1];

      if (!payloadBase64) {
        return null;
      }

      let base64 = payloadBase64
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      while (base64.length % 4) {
        base64 += "=";
      }

      if (!global.atob) {
        console.log("global.atob no está disponible");
        return null;
      }

      const payload = JSON.parse(global.atob(base64));

      return payload?.user_id
        ? String(payload.user_id)
        : null;
    } catch (error) {
      console.log("Error leyendo user_id del token:", error);
      return null;
    }
  };

  const obtenerSesionActual = async () => {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No existe token de autenticación");
    }

    const userIdGuardado = await AsyncStorage.getItem("userId");
    const userIdToken = obtenerUserIdDesdeToken(token);
    const userIdActual = userIdGuardado || userIdToken;
    const loginUsername = await AsyncStorage.getItem("loginUsername");

    if (!userIdActual) {
      throw new Error(
        "No se pudo identificar al usuario activo desde la sesión."
      );
    }

    if (!userIdGuardado && userIdToken) {
      await AsyncStorage.setItem("userId", String(userIdToken));
    }

    return {
      token,
      userId: String(userIdActual),
      loginUsername: loginUsername || "",
    };
  };

  const leerPropietariosLocales = async () => {
    try {
      const valor = await AsyncStorage.getItem(
        ORDER_OWNERS_STORAGE_KEY
      );

      if (!valor) {
        return {};
      }

      const mapa = JSON.parse(valor);

      return mapa && typeof mapa === "object" ? mapa : {};
    } catch (error) {
      console.log("Error leyendo propietarios locales:", error);
      return {};
    }
  };

  const guardarPropietarioLocal = async (orderId, userId) => {
    if (!orderId || !userId) {
      return;
    }

    try {
      const propietarios = await leerPropietariosLocales();

      propietarios[String(orderId)] = String(userId);

      await AsyncStorage.setItem(
        ORDER_OWNERS_STORAGE_KEY,
        JSON.stringify(propietarios)
      );

      console.log("PROPIETARIO LOCAL GUARDADO:", {
        orderId: String(orderId),
        userId: String(userId),
      });
    } catch (error) {
      console.log("Error guardando propietario local:", error);
    }
  };

  const obtenerIdUsuarioOrden = (order) => {
    const usuarioOrden =
      order?.created_by ??
      order?.created_by_id ??
      order?.user ??
      order?.user_id ??
      order?.waiter ??
      order?.waiter_id ??
      order?.cashier ??
      order?.cashier_id ??
      order?.employee ??
      order?.employee_id ??
      order?.owner ??
      order?.owner_id ??
      order?.staff ??
      order?.staff_id ??
      order?.assigned_to ??
      order?.assigned_to_id;

    if (
      typeof usuarioOrden === "object" &&
      usuarioOrden !== null
    ) {
      return (
        usuarioOrden.id ??
        usuarioOrden.user_id ??
        usuarioOrden.pk ??
        usuarioOrden.username ??
        usuarioOrden.email ??
        null
      );
    }

    return usuarioOrden ?? null;
  };

  const obtenerNombreUsuarioOrden = (order) => {
    const usuarioOrden =
      order?.created_by ??
      order?.user ??
      order?.waiter ??
      order?.cashier ??
      order?.employee;

    if (
      typeof usuarioOrden === "object" &&
      usuarioOrden !== null
    ) {
      const nombreCompleto =
        `${usuarioOrden.first_name || ""} ${
          usuarioOrden.last_name || ""
        }`.trim();

      return (
        nombreCompleto ||
        usuarioOrden.username ||
        usuarioOrden.email ||
        usuarioOrden.name ||
        "otro usuario"
      );
    }

    return (
      order?.created_by_name ??
      order?.user_name ??
      order?.username ??
      order?.waiter_name ??
      order?.cashier_name ??
      order?.employee_name ??
      "otro usuario"
    );
  };

  const esOrdenPendiente = (order) => {
    const estado = String(
      order?.status || ""
    ).toLowerCase();

    return (
      estado === "pendiente" ||
      estado === "pending"
    );
  };

  const obtenerMesaIdOrden = (order) => {
    return (
      order?.table?.id ??
      order?.table ??
      order?.mesa?.id ??
      order?.mesa ??
      order?.table_id ??
      null
    );
  };

  const evaluarAccesoOrden = (
    order,
    sesion,
    propietariosLocales
  ) => {
    if (!order) {
      return {
        puedeEditar: true,
        propietarioId: null,
        propietarioNombre: "",
        mensaje: "",
      };
    }

    const propietarioBackend =
      obtenerIdUsuarioOrden(order);

    const propietarioLocal =
      propietariosLocales[String(order.id)] ??
      null;

    const propietarioId =
      propietarioBackend ?? propietarioLocal;

    const propietarioNombre =
      propietarioBackend !== null &&
      propietarioBackend !== undefined
        ? obtenerNombreUsuarioOrden(order)
        : propietarioLocal
        ? "otro usuario de la aplicación"
        : "caja u otro usuario";

    /*
     * Si el backend no informa quién creó la orden y tampoco
     * existe un propietario local, se bloquea por seguridad.
     * Esto evita que un mesero se apropie de un pedido creado
     * previamente desde la caja web.
     */
    if (
      propietarioId === null ||
      propietarioId === undefined ||
      String(propietarioId).trim() === ""
    ) {
      return {
        puedeEditar: false,
        propietarioId: null,
        propietarioNombre,
        mensaje:
          "Esta mesa ya tiene un pedido pendiente creado desde caja o por otro usuario. Solo el responsable original puede modificarlo.",
      };
    }

    const propietarioNormalizado =
      String(propietarioId).toLowerCase();

    const puedeEditar =
      propietarioNormalizado ===
        String(sesion.userId).toLowerCase() ||
      Boolean(
        sesion.loginUsername &&
          propietarioNormalizado ===
            String(
              sesion.loginUsername
            ).toLowerCase()
      );

    return {
      puedeEditar,
      propietarioId: String(propietarioId),
      propietarioNombre,
      mensaje: puedeEditar
        ? ""
        : `Esta mesa ya tiene un pedido pendiente registrado por ${propietarioNombre}. No puedes agregar ni modificar productos.`,
    };
  };

  const aplicarBloqueoPedido = (evaluacion) => {
    const bloqueado = !evaluacion.puedeEditar;

    setPedidoBloqueado(bloqueado);
    setMensajeBloqueo(
      bloqueado ? evaluacion.mensaje : ""
    );
    setPropietarioPedido(
      bloqueado
        ? evaluacion.propietarioNombre
        : ""
    );

    if (bloqueado) {
      setCarrito([]);
    }

    return bloqueado;
  };

  const mostrarPedidoBloqueado = () => {
    Alert.alert(
      "Pedido bloqueado",
      mensajeBloqueo ||
        "Esta mesa tiene un pedido pendiente registrado por otro usuario."
    );
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

  const verificarTurnoActivo = async (
    actualizarInterfaz = true
  ) => {
    const tokenConsulta = await AsyncStorage.getItem(
      "accessToken"
    );

    try {
      if (actualizarInterfaz) {
        setCargandoTurno(true);
      }

      if (!tokenConsulta) {
        throw new Error(
          "No existe token de autenticación."
        );
      }

      const userIdGuardado =
        await AsyncStorage.getItem("userId");
      const userIdToken =
        obtenerUserIdDesdeToken(tokenConsulta);
      const userIdActual =
        userIdGuardado || userIdToken;
      const loginUsername =
        await AsyncStorage.getItem("loginUsername");

      if (!userIdActual && !loginUsername) {
        throw new Error(
          "No se pudo identificar al usuario activo."
        );
      }

      const response = await fetch(SHIFTS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenConsulta}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const data = await parseJsonResponse(
        response,
        "VERIFICAR TURNO"
      );

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      const tokenActual =
        await AsyncStorage.getItem("accessToken");

      if (tokenActual !== tokenConsulta) {
        if (actualizarInterfaz) {
          setTurnoActivo(false);
        }
        return false;
      }

      const todosLosTurnos = normalizarLista(data);

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

      const existeTurnoActivo =
        turnosDelUsuario.some(
          (turno) => turno?.is_active === true
        );

      if (actualizarInterfaz) {
        setTurnoActivo(existeTurnoActivo);
      }

      return existeTurnoActivo;
    } catch (error) {
      console.log(
        "Error verificando turno para pedido:",
        error
      );

      if (actualizarInterfaz) {
        setTurnoActivo(false);
      }

      return false;
    } finally {
      if (actualizarInterfaz) {
        setCargandoTurno(false);
      }
    }
  };

  const mostrarTurnoCerrado = () => {
    Alert.alert(
      "Turno cerrado",
      "No puedes registrar pedidos mientras tu turno esté cerrado. Regresa al mapa de mesas e inicia tu turno."
    );
  };

  const actualizarPantalla = async () => {
    await Promise.all([
      cargarProductos(false),
      verificarTurnoActivo(true),
    ]);
  };

  const obtenerDetalleOrden = async (orderId) => {
    const headers = await getAuthHeaders();

    const url = `${ORDERS_URL}${orderId}/`;

    console.log("DETALLE ORDEN URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await parseJsonResponse(response, "DETALLE ORDEN");

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    return data;
  };

  const buscarOrdenPendienteDeMesa = async () => {
    const headers = await getAuthHeaders();
    const sesion = await obtenerSesionActual();
    const propietariosLocales =
      await leerPropietariosLocales();

    console.log(
      "========== BUSCAR ORDEN PENDIENTE =========="
    );
    console.log("ORDERS_URL:", ORDERS_URL);
    console.log("MESA ACTUAL:", mesa);
    console.log("USUARIO ACTUAL:", sesion.userId);

    const response = await fetch(ORDERS_URL, {
      method: "GET",
      headers: {
        ...headers,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    const data = await parseJsonResponse(
      response,
      "ORDENES BACKEND"
    );

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    const ordenes = normalizarLista(data);

    console.log(
      "ORDENES NORMALIZADAS:",
      ordenes
    );

    const ordenesPendientesMesa =
      ordenes.filter((order) => {
        const mesaOrden =
          obtenerMesaIdOrden(order);

        return (
          Number(mesaOrden) ===
            Number(mesa.id) &&
          esOrdenPendiente(order)
        );
      });

    const activeOrderId =
      mesa?.activeOrderId ??
      mesa?.active_order_id ??
      null;

    let ordenPendienteEncontrada =
      activeOrderId
        ? ordenesPendientesMesa.find(
            (order) =>
              Number(order.id) ===
              Number(activeOrderId)
          )
        : null;

    if (!ordenPendienteEncontrada) {
      ordenPendienteEncontrada =
        ordenesPendientesMesa[0] || null;
    }

    if (!ordenPendienteEncontrada) {
      aplicarBloqueoPedido({
        puedeEditar: true,
        propietarioId: null,
        propietarioNombre: "",
        mensaje: "",
      });

      console.log(
        "NO EXISTE ORDEN PENDIENTE EN LA MESA"
      );
      console.log(
        "==========================================="
      );

      return null;
    }

    /*
     * El listado puede no incluir created_by/user/waiter.
     * Se consulta el detalle antes de decidir el bloqueo.
     */
    let ordenEvaluada =
      ordenPendienteEncontrada;

    try {
      ordenEvaluada = await obtenerDetalleOrden(
        ordenPendienteEncontrada.id
      );
    } catch (error) {
      console.log(
        "No se pudo cargar el detalle para verificar propietario:",
        error
      );
    }

    const ordenCompleta = {
      ...ordenPendienteEncontrada,
      ...ordenEvaluada,
    };

    const evaluacion = evaluarAccesoOrden(
      ordenCompleta,
      sesion,
      propietariosLocales
    );

    aplicarBloqueoPedido(evaluacion);

    const ordenConPermiso = {
      ...ordenCompleta,
      __puedeEditar: evaluacion.puedeEditar,
      __propietarioId:
        evaluacion.propietarioId,
      __propietarioNombre:
        evaluacion.propietarioNombre,
      __mensajeBloqueo:
        evaluacion.mensaje,
    };

    console.log(
      "ORDEN PENDIENTE ENCONTRADA:",
      ordenConPermiso
    );
    console.log(
      "ACCESO A LA ORDEN:",
      evaluacion
    );
    console.log(
      "==========================================="
    );

    return ordenConPermiso;
  };

  const cargarPedidoPendiente = async (productosDisponibles) => {
    try {
      setCargandoPedidoActual(true);

      const orden = await buscarOrdenPendienteDeMesa();

      if (!orden) {
        setOrdenPendiente(null);
        setPedidoActual([]);
        setPedidoBloqueado(false);
        setMensajeBloqueo("");
        setPropietarioPedido("");
        return;
      }

      let ordenConDetalle = orden;

      if (!Array.isArray(orden.items)) {
        try {
          const detalle = await obtenerDetalleOrden(
            orden.id
          );

          ordenConDetalle = {
            ...orden,
            ...detalle,
            __puedeEditar: orden.__puedeEditar,
            __propietarioId:
              orden.__propietarioId,
            __propietarioNombre:
              orden.__propietarioNombre,
            __mensajeBloqueo:
              orden.__mensajeBloqueo,
          };
        } catch (error) {
          console.log("No se pudo obtener detalle de orden:", error);
          ordenConDetalle = orden;
        }
      }

      setOrdenPendiente(ordenConDetalle);

      const itemsOrden = Array.isArray(ordenConDetalle.items)
        ? ordenConDetalle.items
        : [];

      const itemsAdaptados = itemsOrden.map((item) => {
        const productoId =
          typeof item.product === "object"
            ? item.product.id
            : item.product;

        const productoCatalogo = productosDisponibles.find(
          (producto) => Number(producto.id) === Number(productoId)
        );

        return {
          id: item.id,
          cantidad: Number(item.quantity || item.cantidad || 0),
          precio: Number(
            item.price ??
              item.precio ??
              productoCatalogo?.precio ??
              0
          ),
          producto: productoCatalogo || {
            id: productoId,
            nombre:
              typeof item.product === "object"
                ? item.product.name || item.product.nombre
                : `Producto #${productoId}`,
            precio: Number(item.price || item.precio || 0),
          },
        };
      });

      setPedidoActual(itemsAdaptados);
    } catch (error) {
      console.log(
        "Error cargando pedido pendiente:",
        error
      );
      setOrdenPendiente(null);
      setPedidoActual([]);
      setPedidoBloqueado(true);
      setMensajeBloqueo(
        "No se pudo verificar quién administra el pedido pendiente. Por seguridad, la edición está bloqueada."
      );
      setPropietarioPedido("");
      setCarrito([]);
    } finally {
      setCargandoPedidoActual(false);
    }
  };

const cargarProductos = async (mostrarLoading = true) => {
  try {
    if (mostrarLoading) {
      setLoading(true);
    }

    setActualizandoMenu(true);

    const headers = await getAuthHeaders();

    console.log("========== CARGAR PRODUCTOS ==========");
    console.log("PRODUCTS_URL:", PRODUCTS_URL);

    const response = await fetch(PRODUCTS_URL, {
      method: "GET",
      headers: {
        ...headers,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    const data = await parseJsonResponse(response, "PRODUCTOS BACKEND");

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    const listaProductos = normalizarLista(data);

    const productosAdaptados = listaProductos.map((producto) => ({
      id: producto.id,
      nombre: producto.name ?? producto.nombre ?? `Producto #${producto.id}`,
      precio: Number(producto.price ?? producto.precio ?? 0),
      categoria:
        producto.category_name ??
        producto.categoria ??
        "Sin categoría",
      subcategoria:
        producto.subcategory_name ??
        producto.subcategoria ??
        (producto.subcategory
          ? `Subcategoría ${producto.subcategory}`
          : "Sin subcategoría"),
      status: producto.status,
      original: producto,
    }));

    setProductos(productosAdaptados);

    setCarrito((prevCarrito) =>
      prevCarrito.map((item) => {
        const productoActualizado = productosAdaptados.find(
          (producto) => Number(producto.id) === Number(item.producto.id)
        );

        if (!productoActualizado) {
          return item;
        }

        return {
          ...item,
          producto: productoActualizado,
        };
      })
    );

    await cargarPedidoPendiente(productosAdaptados);
  } catch (error) {
    console.log("Error cargando productos:", error);
    Alert.alert("Error", "No se pudo cargar el menú actualizado.");
  } finally {
    setLoading(false);
    setActualizandoMenu(false);
  }
};

useFocusEffect(
  useCallback(() => {
    cargarProductos(true);
    verificarTurnoActivo(true);
  }, [])
);

  const agregarAlCarrito = (producto) => {
    if (pedidoBloqueado) {
      mostrarPedidoBloqueado();
      return;
    }

    setCarrito((prev) => {
      const existe = prev.find(
        (item) =>
          item.producto.id === producto.id
      );

      if (existe) {
        return prev.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          producto,
          cantidad: 1,
          notas: "",
        },
      ];
    });
  };

  const cambiarCantidad = (
    productoId,
    delta
  ) => {
    if (pedidoBloqueado) {
      mostrarPedidoBloqueado();
      return;
    }

    setCarrito((prev) =>
      prev
        .map((item) =>
          item.producto.id === productoId
            ? {
                ...item,
                cantidad:
                  item.cantidad + delta,
              }
            : item
        )
        .filter(
          (item) => item.cantidad > 0
        )
    );
  };

  const actualizarNota = (
    productoId,
    nota
  ) => {
    if (pedidoBloqueado) {
      mostrarPedidoBloqueado();
      return;
    }

    setCarrito((prev) =>
      prev.map((item) =>
        item.producto.id === productoId
          ? { ...item, notas: nota }
          : item
      )
    );
  };

  const marcarMesaOcupada = async () => {
    const headers = await getAuthHeaders();

    const response = await fetch(`${TABLES_URL}${mesa.id}/`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        status: "Ocupada",
      }),
    });

    const data = await parseJsonResponse(response, "MARCAR MESA OCUPADA");

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    return data;
  };

  const totalPedidoActual = pedidoActual.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  );

  const totalCarrito = carrito.reduce(
    (sum, item) =>
      sum + item.producto.precio * item.cantidad,
    0
  );

  const totalGeneral = totalPedidoActual + totalCarrito;

  const cantidadPedidoActual = pedidoActual.reduce(
    (sum, item) => sum + item.cantidad,
    0
  );

  const cantidadCarrito = carrito.reduce(
    (sum, item) => sum + item.cantidad,
    0
  );

  const cantidadTotal = cantidadPedidoActual + cantidadCarrito;

  const enviarPedido = async () => {
    if (pedidoBloqueado) {
      mostrarPedidoBloqueado();
      return;
    }

    if (carrito.length === 0) {
      Alert.alert(
        "Sin productos nuevos",
        "Agrega al menos un producto antes de enviar."
      );
      return;
    }

    setCargandoTurno(true);

    const turnoConfirmado =
      await verificarTurnoActivo(false);

    setCargandoTurno(false);
    setTurnoActivo(turnoConfirmado);

    if (!turnoConfirmado) {
      mostrarTurnoCerrado();
      return;
    }

    Alert.alert(
      ordenPendiente ? "Agregar al pedido" : "Crear pedido",
      `Mesa ${getMesaNumber()}\nProductos nuevos: ${cantidadCarrito}\nTotal por agregar: Bs. ${totalCarrito.toFixed(
        2
      )}`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: ordenPendiente ? "Agregar" : "Enviar",
          onPress: async () => {
            setEnviando(true);

            try {
              const turnoSigueActivo =
                await verificarTurnoActivo(false);

              setTurnoActivo(turnoSigueActivo);

              if (!turnoSigueActivo) {
                throw new Error("TURNO_CERRADO");
              }

              const headers = await getAuthHeaders();
              const updateUrl = `${TABLES_URL}${mesa.id}/update_status/`;

              let orden =
                await buscarOrdenPendienteDeMesa();

              if (
                orden &&
                orden.__puedeEditar === false
              ) {
                throw new Error(
                  "PEDIDO_BLOQUEADO"
                );
              }

              // Construir el array de orders expandiendo cantidades
              const payloadOrders = [];

              // Agregar items de pedidoActual (expandir por cantidad)
              pedidoActual.forEach(item => {
                for (let i = 0; i < item.cantidad; i++) {
                  payloadOrders.push({
                    id: item.producto.id,
                    price: item.precio,
                    isTakeaway: false
                  });
                }
              });

              // Agregar items de carrito (expandir por cantidad)
              carrito.forEach(item => {
                for (let i = 0; i < item.cantidad; i++) {
                  payloadOrders.push({
                    id: item.producto.id,
                    price: item.producto.precio,
                    isTakeaway: false
                  });
                }
              });

              const payload = {
                status: "Ocupada",
                customerName: mesa.customerName || "Cliente App",
                orders: payloadOrders,
                activeTime: mesa.activeTime || "0 min",
              };

              if (orden) {
                payload.order_id = orden.id;
              } else {
                payload.new_order = true;
              }

              console.log("========== UPDATE STATUS ==========");
              console.log("URL:", updateUrl);
              console.log("PAYLOAD:", payload);

              const response = await fetch(updateUrl, {
                method: "PATCH",
                headers,
                body: JSON.stringify(payload)
              });

              const responseData = await parseJsonResponse(response, "UPDATE STATUS");

              if (!response.ok) {
                throw new Error(JSON.stringify(responseData));
              }

              if (!orden) {
                const nuevaOrdenId =
                  responseData?.table
                    ?.activeOrderId ??
                  responseData?.table
                    ?.active_order_id ??
                  responseData?.activeOrderId ??
                  responseData?.active_order_id ??
                  responseData?.order_id ??
                  responseData?.order?.id ??
                  null;

                if (nuevaOrdenId) {
                  const sesion =
                    await obtenerSesionActual();

                  await guardarPropietarioLocal(
                    nuevaOrdenId,
                    sesion.userId
                  );
                }
              }

              setCarrito([]);

              await cargarPedidoPendiente(productos);

              setVista("carrito");

              Alert.alert(
                "Pedido registrado",
                "Los productos fueron agregados correctamente a la mesa."
              );
            } catch (error) {
              console.log("Error enviando pedido:", error);

              if (
                error?.message ===
                "TURNO_CERRADO"
              ) {
                mostrarTurnoCerrado();
              } else if (
                error?.message ===
                "PEDIDO_BLOQUEADO"
              ) {
                mostrarPedidoBloqueado();
              } else {
                Alert.alert(
                  "Error",
                  "No se pudo registrar el pedido. Revisa la consola para ver el detalle del backend."
                );
              }
            } finally {
              setEnviando(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>N</Text>
        </View>

        <ActivityIndicator
          size="large"
          color={palette.primary}
        />

        <Text style={styles.loadingTitle}>
          Preparando el menú
        </Text>

        <Text style={styles.loadingSubtitle}>
          Cargando productos y pedido actual...
        </Text>
      </View>
    );
  }

  const categorias = [
    ...new Set(
      productos.map((producto) => producto.categoria)
    ),
  ];

  const subcategorias = categoriaSeleccionada
    ? [
        ...new Set(
          productos
            .filter(
              (producto) =>
                producto.categoria === categoriaSeleccionada
            )
            .map(
              (producto) =>
                producto.subcategoria ||
                "Sin subcategoría"
            )
        ),
      ]
    : [];

  const productosFiltrados =
    categoriaSeleccionada && subcategoriaSeleccionada
      ? productos.filter(
          (producto) =>
            producto.categoria ===
              categoriaSeleccionada &&
            (producto.subcategoria ||
              "Sin subcategoría") ===
              subcategoriaSeleccionada
        )
      : [];

  const renderCategoria = ({ item }) => {
    const cantidad = productos.filter(
      (producto) => producto.categoria === item
    ).length;

    return (
      <TouchableOpacity
        style={styles.categoriaCard}
        activeOpacity={0.82}
        onPress={() => {
          setCategoriaSeleccionada(item);
          setSubcategoriaSeleccionada(null);
        }}
      >
        <View style={styles.categoryIconBox}>
          <Icon
            name="book-open"
            size={21}
            color={palette.primary}
          />
        </View>

        <View style={styles.categoryTextBox}>
          <Text style={styles.categoriaNombre}>
            {item}
          </Text>

          <Text style={styles.categoriaHint}>
            {cantidad} producto
            {cantidad === 1 ? "" : "s"} disponible
            {cantidad === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.categoryArrow}>
          <Icon
            name="chevron-right"
            size={19}
            color={palette.white}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSubcategoria = ({ item }) => {
    const cantidad = productos.filter(
      (producto) =>
        producto.categoria === categoriaSeleccionada &&
        (producto.subcategoria || "Sin subcategoría") ===
          item
    ).length;

    return (
      <TouchableOpacity
        style={styles.categoriaCard}
        activeOpacity={0.82}
        onPress={() => setSubcategoriaSeleccionada(item)}
      >
        <View style={styles.categoryIconBox}>
          <Icon
            name="layers"
            size={21}
            color={palette.accent}
          />
        </View>

        <View style={styles.categoryTextBox}>
          <Text style={styles.categoriaNombre}>
            {item}
          </Text>

          <Text style={styles.categoriaHint}>
            {cantidad} opción
            {cantidad === 1 ? "" : "es"}
          </Text>
        </View>

        <View style={styles.categoryArrow}>
          <Icon
            name="chevron-right"
            size={19}
            color={palette.white}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderProducto = ({ item }) => {
    const enCarrito = carrito.find(
      (carritoItem) =>
        carritoItem.producto.id === item.id
    );

    return (
      <View style={styles.productoCard}>
        <View style={styles.productIconBox}>
          <Icon
            name="package"
            size={20}
            color={palette.accent}
          />
        </View>

        <View style={styles.productoInfo}>
          <Text style={styles.productoNombre}>
            {item.nombre}
          </Text>

          <Text style={styles.productoSubcategoria}>
            {item.subcategoria}
          </Text>

          <Text style={styles.productoPrecio}>
            Bs. {item.precio.toFixed(2)}
          </Text>
        </View>

        {enCarrito ? (
          <View style={styles.cantidadControl}>
            <TouchableOpacity
              onPress={() =>
                cambiarCantidad(item.id, -1)
              }
              style={[
                styles.ctrlBtn,
                pedidoBloqueado &&
                  styles.controlDisabled,
              ]}
              disabled={pedidoBloqueado}
            >
              <Icon
                name="minus"
                size={17}
                color={palette.dark}
              />
            </TouchableOpacity>

            <Text style={styles.cantidadNum}>
              {enCarrito.cantidad}
            </Text>

            <TouchableOpacity
              onPress={() =>
                cambiarCantidad(item.id, 1)
              }
              style={[
                styles.ctrlBtn,
                styles.ctrlBtnAdd,
                pedidoBloqueado &&
                  styles.controlDisabled,
              ]}
              disabled={pedidoBloqueado}
            >
              <Icon
                name="plus"
                size={17}
                color={palette.white}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.addBtn,
              pedidoBloqueado &&
                styles.addBtnDisabled,
            ]}
            onPress={() =>
              agregarAlCarrito(item)
            }
            disabled={pedidoBloqueado}
          >
            <Icon
              name="plus"
              size={16}
              color={palette.white}
            />
            <Text style={styles.addBtnText}>
              {pedidoBloqueado
                ? "Bloqueado"
                : "Agregar"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon
            name="arrow-left"
            size={21}
            color={palette.white}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Mesa {getMesaNumber()}
          </Text>

          <Text style={styles.headerSubtitle}>
            {ordenPendiente
              ? `Orden #${ordenPendiente.id}`
              : "Nuevo pedido"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.refreshBtn,
            (actualizandoMenu || cargandoTurno) &&
              styles.buttonDisabled,
          ]}
          onPress={actualizarPantalla}
          disabled={
            actualizandoMenu || cargandoTurno
          }
        >
          {actualizandoMenu || cargandoTurno ? (
            <ActivityIndicator
              size="small"
              color={palette.primary}
            />
          ) : (
            <Icon
              name="refresh-cw"
              size={18}
              color={palette.primary}
            />
          )}
        </TouchableOpacity>
      </View>


      {pedidoBloqueado && (
        <View style={styles.orderLockBanner}>
          <View style={styles.orderLockIcon}>
            <Icon
              name="lock"
              size={21}
              color={palette.danger}
            />
          </View>

          <View style={styles.orderLockTextBox}>
            <Text style={styles.orderLockTitle}>
              Pedido administrado por otro usuario
            </Text>

            <Text style={styles.orderLockMessage}>
              {mensajeBloqueo}
            </Text>

            {propietarioPedido ? (
              <Text
                style={styles.orderLockOwner}
              >
                Responsable: {propietarioPedido}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            vista === "productos" &&
              styles.tabActive,
          ]}
          onPress={() => setVista("productos")}
        >
          <Icon
            name="book-open"
            size={17}
            color={
              vista === "productos"
                ? palette.white
                : palette.primary
            }
          />
          <Text
            style={[
              styles.tabText,
              vista === "productos" &&
                styles.tabTextActive,
            ]}
          >
            Menú
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            vista === "carrito" &&
              styles.tabActive,
          ]}
          onPress={() => setVista("carrito")}
        >
          <Icon
            name="shopping-cart"
            size={17}
            color={
              vista === "carrito"
                ? palette.white
                : palette.primary
            }
          />
          <Text
            style={[
              styles.tabText,
              vista === "carrito" &&
                styles.tabTextActive,
            ]}
          >
            Pedido
          </Text>

          <View
            style={[
              styles.tabCount,
              vista === "carrito" &&
                styles.tabCountActive,
            ]}
          >
            <Text
              style={[
                styles.tabCountText,
                vista === "carrito" &&
                  styles.tabCountTextActive,
              ]}
            >
              {cantidadTotal}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {vista === "productos" && (
        <View style={styles.content}>
          {!categoriaSeleccionada ? (
            <>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Categorías
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Selecciona el tipo de producto
                  </Text>
                </View>

                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {categorias.length}
                  </Text>
                </View>
              </View>

              <FlatList
                data={categorias}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.list}
                renderItem={renderCategoria}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Icon
                      name="inbox"
                      size={31}
                      color={palette.placeholder}
                    />
                    <Text style={styles.emptyTitle}>
                      Sin categorías disponibles
                    </Text>
                  </View>
                }
              />
            </>
          ) : !subcategoriaSeleccionada ? (
            <>
              <View style={styles.breadcrumbRow}>
                <TouchableOpacity
                  style={styles.breadcrumbButton}
                  onPress={() => {
                    setCategoriaSeleccionada(null);
                    setSubcategoriaSeleccionada(null);
                  }}
                >
                  <Icon
                    name="arrow-left"
                    size={16}
                    color={palette.primary}
                  />
                  <Text style={styles.breadcrumbText}>
                    Categorías
                  </Text>
                </TouchableOpacity>

                <Text
                  style={styles.breadcrumbCurrent}
                  numberOfLines={1}
                >
                  {categoriaSeleccionada}
                </Text>
              </View>

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Subcategorías
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Elige una sección del menú
                  </Text>
                </View>

                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {subcategorias.length}
                  </Text>
                </View>
              </View>

              <FlatList
                data={subcategorias}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.list}
                renderItem={renderSubcategoria}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <>
              <View style={styles.breadcrumbRow}>
                <TouchableOpacity
                  style={styles.breadcrumbButton}
                  onPress={() =>
                    setSubcategoriaSeleccionada(null)
                  }
                >
                  <Icon
                    name="arrow-left"
                    size={16}
                    color={palette.primary}
                  />
                  <Text style={styles.breadcrumbText}>
                    {categoriaSeleccionada}
                  </Text>
                </TouchableOpacity>

                <Text
                  style={styles.breadcrumbCurrent}
                  numberOfLines={1}
                >
                  {subcategoriaSeleccionada}
                </Text>
              </View>

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Productos
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Agrega productos al pedido
                  </Text>
                </View>

                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {productosFiltrados.length}
                  </Text>
                </View>
              </View>

              <FlatList
                data={productosFiltrados}
                keyExtractor={(item) =>
                  item.id.toString()
                }
                contentContainerStyle={styles.list}
                renderItem={renderProducto}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </View>
      )}

      {vista === "carrito" && (
        <ScrollView
          contentContainerStyle={styles.orderContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.orderSummaryCard}>
            <View style={styles.orderSummaryIcon}>
              <Icon
                name="shopping-bag"
                size={20}
                color={palette.primary}
              />
            </View>

            <View style={styles.orderSummaryText}>
              <Text style={styles.orderSummaryTitle}>
                Resumen de la mesa
              </Text>
              <Text style={styles.orderSummarySubtitle}>
                {cantidadTotal} producto
                {cantidadTotal === 1 ? "" : "s"} en total
              </Text>
            </View>

            <Text style={styles.orderSummaryTotal}>
              Bs. {totalGeneral.toFixed(2)}
            </Text>
          </View>

          {cargandoPedidoActual ? (
            <View style={styles.loadingPedidoBox}>
              <ActivityIndicator
                size="small"
                color={palette.primary}
              />
              <Text style={styles.loadingPedidoText}>
                Cargando pedido actual...
              </Text>
            </View>
          ) : pedidoActual.length > 0 ? (
            <View style={styles.orderSection}>
              <View style={styles.orderSectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Pedido registrado
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Orden pendiente #{ordenPendiente?.id}
                  </Text>
                </View>

                <View style={styles.registeredBadge}>
                  <Text style={styles.registeredBadgeText}>
                    {cantidadPedidoActual}
                  </Text>
                </View>
              </View>

              {pedidoActual.map((item) => (
                <View
                  key={`actual-${item.id}`}
                  style={styles.registeredItem}
                >
                  <View style={styles.smallProductIcon}>
                    <Icon
                      name="check"
                      size={15}
                      color={palette.success}
                    />
                  </View>

                  <View style={styles.registeredItemInfo}>
                    <Text style={styles.itemName}>
                      {item.producto.nombre}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {item.cantidad} unidad
                      {item.cantidad === 1 ? "" : "es"}
                    </Text>
                  </View>

                  <Text style={styles.itemPrice}>
                    Bs.{" "}
                    {(item.precio * item.cantidad).toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>
                  Total registrado
                </Text>
                <Text style={styles.subtotalValue}>
                  Bs. {totalPedidoActual.toFixed(2)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noOrderBox}>
              <Icon
                name="file-plus"
                size={25}
                color={palette.primary}
              />
              <Text style={styles.noOrderTitle}>
                Pedido nuevo
              </Text>
              <Text style={styles.noOrderText}>
                Esta mesa todavía no tiene productos
                registrados.
              </Text>
            </View>
          )}

          {carrito.length > 0 ? (
            <View style={styles.orderSection}>
              <View style={styles.orderSectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Productos por agregar
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Revisa cantidades y observaciones
                  </Text>
                </View>

                <View style={styles.newItemsBadge}>
                  <Text style={styles.newItemsBadgeText}>
                    {cantidadCarrito}
                  </Text>
                </View>
              </View>

              {carrito.map((item) => (
                <View
                  key={`nuevo-${item.producto.id}`}
                  style={styles.cartItem}
                >
                  <View style={styles.cartItemTop}>
                    <View style={styles.cartItemHeading}>
                      <View style={styles.smallProductIcon}>
                        <Icon
                          name="plus"
                          size={15}
                          color={palette.accent}
                        />
                      </View>

                      <View style={styles.cartItemText}>
                        <Text style={styles.itemName}>
                          {item.producto.nombre}
                        </Text>
                        <Text style={styles.itemPrice}>
                          Bs.{" "}
                          {(
                            item.producto.precio *
                            item.cantidad
                          ).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cantidadControl}>
                      <TouchableOpacity
                        onPress={() =>
                          cambiarCantidad(
                            item.producto.id,
                            -1
                          )
                        }
                        style={[
                          styles.ctrlBtn,
                          pedidoBloqueado &&
                            styles.controlDisabled,
                        ]}
                        disabled={pedidoBloqueado}
                      >
                        <Icon
                          name="minus"
                          size={16}
                          color={palette.dark}
                        />
                      </TouchableOpacity>

                      <Text style={styles.cantidadNum}>
                        {item.cantidad}
                      </Text>

                      <TouchableOpacity
                        onPress={() =>
                          cambiarCantidad(
                            item.producto.id,
                            1
                          )
                        }
                        style={[
                          styles.ctrlBtn,
                          styles.ctrlBtnAdd,
                          pedidoBloqueado &&
                            styles.controlDisabled,
                        ]}
                        disabled={pedidoBloqueado}
                      >
                        <Icon
                          name="plus"
                          size={16}
                          color={palette.white}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.noteInputWrapper}>
                    <Icon
                      name="message-square"
                      size={15}
                      color={palette.accent}
                    />
                    <TextInput
                      style={[
                        styles.notaInput,
                        pedidoBloqueado &&
                          styles.inputDisabled,
                      ]}
                      placeholder="Observación: sin cebolla, sin picante..."
                      placeholderTextColor={
                        palette.placeholder
                      }
                      value={item.notas}
                      onChangeText={(texto) =>
                        actualizarNota(
                          item.producto.id,
                          texto
                        )
                      }
                      editable={!pedidoBloqueado}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.addProductsPrompt,
                pedidoBloqueado &&
                  styles.addProductsPromptDisabled,
              ]}
              onPress={
                pedidoBloqueado
                  ? mostrarPedidoBloqueado
                  : () => setVista("productos")
              }
            >
              <Icon
                name="plus-circle"
                size={21}
                color={palette.primary}
              />
              <View style={styles.addProductsPromptText}>
                <Text style={styles.addProductsPromptTitle}>
                  Agregar productos
                </Text>
                <Text style={styles.addProductsPromptSubtitle}>
                  Regresa al menú para continuar
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={19}
                color={palette.primary}
              />
            </TouchableOpacity>
          )}

          {(pedidoActual.length > 0 ||
            carrito.length > 0) && (
            <View style={styles.totalBox}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>
                  Pedido registrado
                </Text>
                <Text style={styles.totalValue}>
                  Bs. {totalPedidoActual.toFixed(2)}
                </Text>
              </View>

              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>
                  Productos nuevos
                </Text>
                <Text style={styles.totalValue}>
                  Bs. {totalCarrito.toFixed(2)}
                </Text>
              </View>

              <View style={styles.totalGeneralLine}>
                <View>
                  <Text style={styles.totalGeneralLabel}>
                    TOTAL DE LA MESA
                  </Text>
                  <Text style={styles.totalCaption}>
                    Consumo acumulado
                  </Text>
                </View>

                <Text style={styles.totalGeneralValue}>
                  Bs. {totalGeneral.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {vista === "carrito" && carrito.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>
              Por agregar
            </Text>
            <Text style={styles.footerTotalValue}>
              Bs. {totalCarrito.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.enviarBtn,
              !turnoActivo &&
                styles.enviarBtnClosed,
              pedidoBloqueado &&
                styles.enviarBtnBlocked,
              (enviando ||
                cargandoTurno ||
                pedidoBloqueado) &&
                styles.buttonDisabled,
            ]}
            onPress={
              pedidoBloqueado
                ? mostrarPedidoBloqueado
                : turnoActivo
                ? enviarPedido
                : mostrarTurnoCerrado
            }
            disabled={
              enviando || cargandoTurno
            }
          >
            {enviando || cargandoTurno ? (
              <ActivityIndicator
                color={palette.white}
              />
            ) : (
              <>
                <Icon
                  name={
                    pedidoBloqueado
                      ? "lock"
                      : turnoActivo
                      ? "send"
                      : "lock"
                  }
                  size={17}
                  color={palette.white}
                />
                <Text style={styles.enviarBtnText}>
                  {pedidoBloqueado
                    ? "Pedido bloqueado"
                    : !turnoActivo
                    ? "Turno cerrado"
                    : ordenPendiente
                    ? "Agregar al pedido"
                    : "Enviar pedido"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.background,
    paddingHorizontal: 30,
  },

  loadingLogo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: palette.dark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  loadingLogoText: {
    color: palette.white,
    fontSize: 27,
    fontWeight: "900",
  },

  loadingTitle: {
    color: palette.dark,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 15,
  },

  loadingSubtitle: {
    color: palette.gray,
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },

  topBar: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
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

  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: palette.dark,
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: palette.dark,
    fontSize: 19,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: palette.textSecondary,
    fontSize: 10.5,
    marginTop: 2,
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

  shiftBanner: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 11,
    borderWidth: 1,
  },

  shiftBannerActive: {
    backgroundColor: palette.successBackground,
    borderColor: "#B7DFC9",
  },

  shiftBannerClosed: {
    backgroundColor: palette.warningBackground,
    borderColor: "#F2D4A4",
  },

  shiftIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  shiftIconActive: {
    backgroundColor: palette.white,
  },

  shiftIconClosed: {
    backgroundColor: palette.white,
  },

  shiftTextBox: {
    flex: 1,
  },

  shiftTitle: {
    color: palette.dark,
    fontSize: 13.5,
    fontWeight: "900",
  },

  shiftDescription: {
    color: palette.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },

  goTablesBtn: {
    marginLeft: 8,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: palette.primary,
  },

  goTablesText: {
    color: palette.white,
    fontSize: 9.5,
    fontWeight: "900",
  },

  orderLockBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: palette.dangerBackground,
    borderWidth: 1,
    borderColor: "#FFC7CA",
    borderRadius: 18,
    padding: 13,
    marginBottom: 11,
  },

  orderLockIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  orderLockTextBox: {
    flex: 1,
  },

  orderLockTitle: {
    color: "#A52A30",
    fontSize: 13.5,
    fontWeight: "900",
  },

  orderLockMessage: {
    color: "#7A3035",
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 3,
  },

  orderLockOwner: {
    color: palette.danger,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 5,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: 17,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },

  tab: {
    flex: 1,
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },

  tabActive: {
    backgroundColor: palette.primary,
  },

  tabText: {
    color: palette.primary,
    fontSize: 12.5,
    fontWeight: "900",
    marginLeft: 7,
  },

  tabTextActive: {
    color: palette.white,
  },

  tabCount: {
    minWidth: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: palette.muted,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
    paddingHorizontal: 6,
  },

  tabCountActive: {
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  tabCountText: {
    color: palette.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  tabCountTextActive: {
    color: palette.white,
  },

  content: {
    flex: 1,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 9,
  },

  sectionTitle: {
    color: palette.dark,
    fontSize: 16,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: palette.textSecondary,
    fontSize: 10.5,
    marginTop: 2,
  },

  sectionBadge: {
    minWidth: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },

  sectionBadgeText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: "900",
  },

  list: {
    paddingBottom: 28,
  },

  categoriaCard: {
    minHeight: 82,
    backgroundColor: palette.card,
    borderRadius: 21,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#C7DDE5",
    elevation: 1,
  },

  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  categoryTextBox: {
    flex: 1,
  },

  categoriaNombre: {
    fontSize: 15.5,
    fontWeight: "900",
    color: palette.dark,
  },

  categoriaHint: {
    fontSize: 10.5,
    color: palette.textSecondary,
    marginTop: 4,
  },

  categoryArrow: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  breadcrumbRow: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  breadcrumbButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    minHeight: 39,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },

  breadcrumbText: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 6,
  },

  breadcrumbCurrent: {
    flex: 1,
    color: palette.dark,
    fontSize: 11.5,
    fontWeight: "800",
    marginLeft: 9,
  },

  productoCard: {
    minHeight: 90,
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    elevation: 1,
  },

  productIconBox: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#E8F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  productoInfo: {
    flex: 1,
    marginRight: 8,
  },

  productoNombre: {
    fontSize: 14,
    fontWeight: "900",
    color: palette.dark,
  },

  productoSubcategoria: {
    fontSize: 10.5,
    color: palette.gray,
    marginTop: 3,
  },

  productoPrecio: {
    fontSize: 14,
    color: palette.primary,
    marginTop: 5,
    fontWeight: "900",
  },

  addBtn: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: palette.primary,
  },

  addBtnDisabled: {
    backgroundColor: palette.gray,
    opacity: 0.65,
  },

  controlDisabled: {
    opacity: 0.45,
  },

  addBtnText: {
    color: palette.white,
    fontWeight: "900",
    fontSize: 10.5,
    marginLeft: 4,
  },

  cantidadControl: {
    flexDirection: "row",
    alignItems: "center",
  },

  ctrlBtn: {
    width: 33,
    height: 33,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.muted,
    borderWidth: 1,
    borderColor: palette.border,
  },

  ctrlBtnAdd: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },

  cantidadNum: {
    color: palette.dark,
    fontSize: 14,
    fontWeight: "900",
    minWidth: 27,
    textAlign: "center",
  },

  orderContent: {
    paddingBottom: 120,
  },

  orderSummaryCard: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 13,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#C7DDE5",
  },

  orderSummaryIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  orderSummaryText: {
    flex: 1,
  },

  orderSummaryTitle: {
    color: palette.dark,
    fontSize: 14,
    fontWeight: "900",
  },

  orderSummarySubtitle: {
    color: palette.textSecondary,
    fontSize: 10.5,
    marginTop: 3,
  },

  orderSummaryTotal: {
    color: palette.primary,
    fontSize: 17,
    fontWeight: "900",
  },

  loadingPedidoBox: {
    backgroundColor: palette.surface,
    borderRadius: 17,
    padding: 19,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },

  loadingPedidoText: {
    marginTop: 8,
    color: palette.gray,
    fontSize: 11.5,
  },

  orderSection: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },

  orderSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  registeredBadge: {
    minWidth: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: palette.successBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: "#B7DFC9",
  },

  registeredBadgeText: {
    color: palette.success,
    fontSize: 10,
    fontWeight: "900",
  },

  newItemsBadge: {
    minWidth: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: palette.warningBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: "#F2D4A4",
  },

  newItemsBadgeText: {
    color: palette.warning,
    fontSize: 10,
    fontWeight: "900",
  },

  registeredItem: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingVertical: 9,
  },

  smallProductIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: palette.muted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  registeredItemInfo: {
    flex: 1,
  },

  itemName: {
    color: palette.dark,
    fontSize: 13,
    fontWeight: "900",
  },

  itemMeta: {
    color: palette.gray,
    fontSize: 10.5,
    marginTop: 3,
  },

  itemPrice: {
    color: palette.primary,
    fontSize: 12.5,
    fontWeight: "900",
  },

  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 11,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },

  subtotalLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },

  subtotalValue: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: "900",
  },

  noOrderBox: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },

  noOrderTitle: {
    color: palette.dark,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 8,
  },

  noOrderText: {
    color: palette.gray,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 4,
  },

  cartItem: {
    backgroundColor: palette.card,
    borderRadius: 17,
    padding: 12,
    marginBottom: 9,
    borderWidth: 1.5,
    borderColor: "#C7DDE5",
  },

  cartItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cartItemHeading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },

  cartItemText: {
    flex: 1,
  },

  noteInputWrapper: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.white,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },

  notaInput: {
    flex: 1,
    color: palette.text,
    fontSize: 11.5,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  inputDisabled: {
    backgroundColor: palette.muted,
    color: palette.gray,
  },

  addProductsPrompt: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },

  addProductsPromptDisabled: {
    opacity: 0.55,
  },

  addProductsPromptText: {
    flex: 1,
    marginLeft: 10,
  },

  addProductsPromptTitle: {
    color: palette.dark,
    fontSize: 13,
    fontWeight: "900",
  },

  addProductsPromptSubtitle: {
    color: palette.gray,
    fontSize: 10.5,
    marginTop: 2,
  },

  totalBox: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },

  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  totalLabel: {
    fontSize: 11.5,
    color: palette.textSecondary,
  },

  totalValue: {
    fontSize: 11.5,
    color: palette.dark,
    fontWeight: "900",
  },

  totalGeneralLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.dark,
    borderRadius: 15,
    padding: 13,
    marginTop: 5,
  },

  totalGeneralLabel: {
    color: palette.light,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  totalCaption: {
    color: "#D9D0E8",
    fontSize: 9.5,
    marginTop: 3,
  },

  totalGeneralValue: {
    color: palette.white,
    fontSize: 18,
    fontWeight: "900",
  },

  footer: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 0,
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: palette.border,
    elevation: 10,
  },

  footerTotal: {
    minWidth: 88,
    marginRight: 10,
  },

  footerTotalLabel: {
    color: palette.gray,
    fontSize: 9.5,
    fontWeight: "700",
  },

  footerTotalValue: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },

  enviarBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: palette.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  enviarBtnClosed: {
    backgroundColor: palette.warning,
  },

  enviarBtnBlocked: {
    backgroundColor: palette.danger,
  },

  enviarBtnText: {
    color: palette.white,
    fontSize: 12.5,
    fontWeight: "900",
    marginLeft: 7,
  },

  buttonDisabled: {
    opacity: 0.62,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 45,
  },

  emptyTitle: {
    color: palette.dark,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 8,
  },
});
