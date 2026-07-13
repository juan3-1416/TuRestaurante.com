import React, { useCallback, useState } from "react";
import {
View,
Text,
FlatList,
TouchableOpacity,
StyleSheet,
ActivityIndicator,
Alert,
Modal,
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
const ORDERS_URL = `${API_BASE_URL}/api/orders/orders/`;
const PRODUCTS_URL = `${API_BASE_URL}/api/inventory/products/`;
const USERS_URL = `${API_BASE_URL}/api/users/`;
const ORDER_OWNERS_STORAGE_KEY = "orderOwnersById";

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

export default function HistorialOrdenesScreen({ navigation }) {
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState("Hoy");

  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState("Administrador");
  const [userEmail, setUserEmail] = useState("Sesión activa");

  const [detalleVisible, setDetalleVisible] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem("accessToken");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const obtenerUserIdDesdeToken = (token) => {
    try {
      const payloadBase64 = token.split(".")[1];

      let base64 = payloadBase64
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      while (base64.length % 4) {
        base64 += "=";
      }

      if (!global.atob) {
        console.log("global.atob no está disponible en este entorno");
        return null;
      }

      const decoded = global.atob(base64);
      const payload = JSON.parse(decoded);

      return payload?.user_id || null;
    } catch (error) {
      console.log("Error leyendo user_id del token:", error);
      return null;
    }
  };

  const cargarPerfil = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      const nombreGuardado = await AsyncStorage.getItem("userName");
      const correoGuardado = await AsyncStorage.getItem("userEmail");

      if (
        nombreGuardado &&
        nombreGuardado !== "admin" &&
        nombreGuardado !== "Administrador"
      ) {
        setUserName(nombreGuardado);
        setUserEmail(correoGuardado || "Sesión activa");
        return;
      }

      if (!token) {
        setUserName(nombreGuardado || "Administrador");
        setUserEmail(correoGuardado || "Sesión activa");
        return;
      }

      const userId = obtenerUserIdDesdeToken(token);

      const response = await fetch(USERS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("USUARIOS DRAWER:", data);

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      const usuarios = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [];

const usuarioActual = usuarios.find((usuario) => {
  const coincidePorId =
    userId && Number(usuario.id) === Number(userId);

  const coincidePorUsername =
    nombreGuardado &&
    String(usuario.username).toLowerCase() ===
      String(nombreGuardado).toLowerCase();

  return coincidePorId || coincidePorUsername;
});

      if (!usuarioActual) {
        setUserName(nombreGuardado || "Administrador");
        setUserEmail(correoGuardado || "Sesión activa");
        return;
      }

      const nombreCompleto =
        `${usuarioActual.first_name || ""} ${usuarioActual.last_name || ""}`.trim() ||
        usuarioActual.username ||
        "Usuario";

      const emailUsuario = usuarioActual.email || "Sesión activa";

await AsyncStorage.multiSet([
  ["userId", String(usuarioActual.id ?? "")],
  [
    "loginUsername",
    usuarioActual.username || "",
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

      setUserName(nombreGuardado || "Administrador");
      setUserEmail(correoGuardado || "Sesión activa");
    }
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

const ordenPerteneceAlUsuario = (
  orden,
  userIdActual,
  usernameActual,
  propietariosLocales
) => {
  const propietarioLocal =
    propietariosLocales?.[String(orden.id)] ?? null;

  if (
    propietarioLocal !== null &&
    propietarioLocal !== undefined &&
    userIdActual &&
    String(propietarioLocal) === String(userIdActual)
  ) {
    return true;
  }

  const posiblesUsuarios = [
    orden.user,
    orden.user_id,
    orden.created_by,
    orden.created_by_id,
    orden.waiter,
    orden.waiter_id,
    orden.cashier,
    orden.cashier_id,
    orden.employee,
    orden.employee_id,
  ];

  return posiblesUsuarios.some((usuarioOrden) => {
    if (usuarioOrden === null || usuarioOrden === undefined) {
      return false;
    }

    if (
      typeof usuarioOrden === "object" &&
      usuarioOrden !== null
    ) {
      const idUsuarioOrden =
        usuarioOrden.id ??
        usuarioOrden.user_id ??
        usuarioOrden.pk;

      const usernameUsuarioOrden =
        usuarioOrden.username ??
        usuarioOrden.user_name ??
        usuarioOrden.email ??
        "";

      const coincideId =
        userIdActual &&
        idUsuarioOrden !== null &&
        idUsuarioOrden !== undefined &&
        String(idUsuarioOrden) === String(userIdActual);

      const coincideUsername =
        usernameActual &&
        usernameUsuarioOrden &&
        String(usernameUsuarioOrden).toLowerCase() ===
          String(usernameActual).toLowerCase();

      return coincideId || coincideUsername;
    }

    const coincideId =
      userIdActual &&
      String(usuarioOrden) === String(userIdActual);

    const coincideUsername =
      usernameActual &&
      String(usuarioOrden).toLowerCase() ===
        String(usernameActual).toLowerCase();

    return coincideId || coincideUsername;
  });
};

const cargarDatos = async () => {
  try {
    setLoading(true);

    const token = await AsyncStorage.getItem("accessToken");
    const userIdGuardado = await AsyncStorage.getItem("userId");
    const loginUsername = await AsyncStorage.getItem(
      "loginUsername"
    );

    const userIdToken = token
      ? obtenerUserIdDesdeToken(token)
      : null;

    const userIdActual =
      userIdGuardado || String(userIdToken || "");

    console.log("USUARIO ACTIVO PARA HISTORIAL:", {
      userIdGuardado,
      userIdToken,
      userIdActual,
      loginUsername,
    });

    if (!token) {
      throw new Error("No existe un token de sesión.");
    }

    if (!userIdActual && !loginUsername) {
      throw new Error(
        "No se pudo identificar al usuario activo."
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    };

    const [productosResponse, ordenesResponse] =
      await Promise.all([
        fetch(PRODUCTS_URL, {
          method: "GET",
          headers,
        }),
        fetch(ORDERS_URL, {
          method: "GET",
          headers,
        }),
      ]);

    const productosData = await productosResponse.json();
    const ordenesData = await ordenesResponse.json();

    console.log("PRODUCTOS BACKEND:", productosData);
    console.log(
      "ORDENES BACKEND:",
      JSON.stringify(ordenesData, null, 2)
    );

    if (!productosResponse.ok) {
      throw new Error(JSON.stringify(productosData));
    }

    if (!ordenesResponse.ok) {
      throw new Error(JSON.stringify(ordenesData));
    }

    const listaProductos = Array.isArray(productosData)
      ? productosData
      : Array.isArray(productosData?.results)
      ? productosData.results
      : [];

    const productosAdaptados = listaProductos.map(
      (producto) => ({
        id: producto.id,
        nombre:
          producto.name ||
          producto.nombre ||
          `Producto #${producto.id}`,
        precio: Number(
          producto.price || producto.precio || 0
        ),
      })
    );

    const listaOrdenes = Array.isArray(ordenesData)
      ? ordenesData
      : Array.isArray(ordenesData?.results)
      ? ordenesData.results
      : [];

    const propietariosLocales =
      await leerPropietariosLocales();

    console.log(
      "PROPIETARIOS LOCALES:",
      propietariosLocales
    );

    const ordenesDelUsuario = listaOrdenes.filter((orden) =>
      ordenPerteneceAlUsuario(
        orden,
        userIdActual,
        loginUsername,
        propietariosLocales
      )
    );

    const ordenesOrdenadas = [...ordenesDelUsuario].sort(
      (a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    console.log("TOTAL ÓRDENES RECIBIDAS:", listaOrdenes.length);
    console.log(
      "ÓRDENES DEL USUARIO ACTIVO:",
      ordenesOrdenadas
    );

    setProductos(productosAdaptados);
    setOrdenes(ordenesOrdenadas);
  } catch (error) {
    console.log("Error cargando historial:", error);

    setOrdenes([]);

    Alert.alert(
      "Error",
      "No se pudo cargar el historial de órdenes del usuario."
    );
  } finally {
    setLoading(false);
  }
};

useFocusEffect(
  useCallback(() => {
    cargarPerfil();
    cargarDatos();
  }, [])
);

const irMesas = () => {
setMenuVisible(false);
navigation.navigate("Mesas");
};

const irPedidosPendientes = () => {
setMenuVisible(false);
navigation.navigate("PedidosPendientes");
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

const obtenerIdProducto = (item) => {
if (typeof item.product === "object" && item.product !== null) {
return item.product.id;
}


return item.product;


};

const obtenerNombreProducto = (item) => {
if (typeof item.product === "object" && item.product !== null) {
return item.product.name || item.product.nombre || "Producto";
}


if (item.product_name) {
  return item.product_name;
}

const productoEncontrado = productos.find(
  (producto) => producto.id === obtenerIdProducto(item)
);

return productoEncontrado
  ? productoEncontrado.nombre
  : `Producto #${obtenerIdProducto(item)}`;


};

const obtenerPrecioUnitario = (item) => {
if (item.price !== undefined && item.price !== null) {
return Number(item.price);
}


const productoEncontrado = productos.find(
  (producto) => producto.id === obtenerIdProducto(item)
);

return Number(productoEncontrado?.precio || 0);


};

const obtenerDetallesOrden = (orden) => {
const items = Array.isArray(orden?.items) ? orden.items : [];


return items.map((item, index) => {
  const cantidad = Number(item.quantity || 0);
  const precio = obtenerPrecioUnitario(item);

  return {
    id: item.id || `${orden.id}-${index}`,
    nombre: obtenerNombreProducto(item),
    cantidad,
    precio,
    subtotal: cantidad * precio,
  };
});


};

const abrirDetalleOrden = (orden) => {
setOrdenSeleccionada(orden);
setDetalleVisible(true);
};

const detallesOrdenSeleccionada = ordenSeleccionada
? obtenerDetallesOrden(ordenSeleccionada)
: [];

const totalDetalleCalculado = detallesOrdenSeleccionada.reduce(
(suma, item) => suma + item.subtotal,
0
);

const obtenerEstadoVisual = (estadoOriginal) => {
  const estado = String(estadoOriginal || "").toLowerCase();

  if (
    estado.includes("pendiente") ||
    estado.includes("prepar")
  ) {
    return {
      label: estadoOriginal || "Pendiente",
      icon: "clock",
      color: palette.warning,
      background: palette.warningBackground,
      border: "#F2D4A4",
    };
  }

  if (
    estado.includes("cancel") ||
    estado.includes("anulad")
  ) {
    return {
      label: estadoOriginal || "Cancelada",
      icon: "x-circle",
      color: palette.danger,
      background: palette.dangerBackground,
      border: "#F7B9BC",
    };
  }

  if (
    estado.includes("pagad") ||
    estado.includes("final") ||
    estado.includes("complet") ||
    estado.includes("entreg")
  ) {
    return {
      label: estadoOriginal || "Finalizada",
      icon: "check-circle",
      color: palette.success,
      background: palette.successBackground,
      border: "#B7DFC9",
    };
  }

  return {
    label: estadoOriginal || "Registrada",
    icon: "file-text",
    color: palette.accent,
    background: "#E8F5F5",
    border: "#B8DCDD",
  };
};

const filtrosFecha = [
  { key: "Hoy", label: "Hoy" },
  { key: "Ayer", label: "Ayer" },
  { key: "Ultimos7Dias", label: "Últimos 7 días" },
  { key: "EsteMes", label: "Este mes" },
  { key: "Todas", label: "Todas" },
];

const inicioDelDia = (fecha) => {
  const resultado = new Date(fecha);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
};

const finDelDia = (fecha) => {
  const resultado = new Date(fecha);
  resultado.setHours(23, 59, 59, 999);
  return resultado;
};

const ordenesFiltradas = ordenes.filter((orden) => {
  if (filtroFecha === "Todas") {
    return true;
  }

  if (!orden?.created_at) {
    return false;
  }

  const fechaOrden = new Date(orden.created_at);

  if (Number.isNaN(fechaOrden.getTime())) {
    return false;
  }

  const ahora = new Date();
  const hoyInicio = inicioDelDia(ahora);
  const hoyFin = finDelDia(ahora);

  if (filtroFecha === "Hoy") {
    return fechaOrden >= hoyInicio && fechaOrden <= hoyFin;
  }

  if (filtroFecha === "Ayer") {
    const ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);

    return (
      fechaOrden >= inicioDelDia(ayer) &&
      fechaOrden <= finDelDia(ayer)
    );
  }

  if (filtroFecha === "Ultimos7Dias") {
    const inicio = inicioDelDia(ahora);
    inicio.setDate(inicio.getDate() - 6);

    return fechaOrden >= inicio && fechaOrden <= hoyFin;
  }

  if (filtroFecha === "EsteMes") {
    return (
      fechaOrden.getFullYear() === ahora.getFullYear() &&
      fechaOrden.getMonth() === ahora.getMonth()
    );
  }

  return true;
});

const etiquetaFiltroActual =
  filtrosFecha.find((item) => item.key === filtroFecha)
    ?.label || "Todas";

const totalHistorico = ordenesFiltradas.reduce(
  (suma, orden) => suma + Number(orden?.total || 0),
  0
);

const ordenesFinalizadas = ordenesFiltradas.filter((orden) => {
  const estado = String(orden?.status || "").toLowerCase();

  return (
    estado.includes("pagad") ||
    estado.includes("final") ||
    estado.includes("complet") ||
    estado.includes("entreg")
  );
}).length;

const renderItem = ({ item }) => {
  const cantidadProductos = Array.isArray(item.items)
    ? item.items.reduce(
        (suma, producto) =>
          suma + Number(producto.quantity || 0),
        0
      )
    : 0;

  const estadoVisual = obtenerEstadoVisual(item.status);
  const fecha = item.created_at
    ? new Date(item.created_at).toLocaleString()
    : "Sin fecha";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderColor: estadoVisual.border,
        },
      ]}
      activeOpacity={0.82}
      onPress={() => abrirDetalleOrden(item)}
    >
      <View style={styles.cardTop}>
        <View style={styles.orderIconBox}>
          <Icon
            name="shopping-bag"
            size={20}
            color={palette.primary}
          />
        </View>

        <View style={styles.cardHeading}>
          <Text style={styles.title}>
            Orden #{item.id}
          </Text>

          <Text
            style={styles.date}
            numberOfLines={1}
          >
            {fecha}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: estadoVisual.background,
              borderColor: estadoVisual.border,
            },
          ]}
        >
          <Icon
            name={estadoVisual.icon}
            size={12}
            color={estadoVisual.color}
          />

          <Text
            style={[
              styles.statusText,
              { color: estadoVisual.color },
            ]}
            numberOfLines={1}
          >
            {estadoVisual.label}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.orderMetaRow}>
        <View style={styles.orderMetaItem}>
          <Icon
            name="grid"
            size={15}
            color={palette.accent}
          />
          <Text style={styles.orderMetaText}>
            Mesa {item.table_number || item.table}
          </Text>
        </View>

        <View style={styles.orderMetaItem}>
          <Icon
            name="package"
            size={15}
            color={palette.accent}
          />
          <Text style={styles.orderMetaText}>
            {cantidadProductos > 0
              ? `${cantidadProductos} producto${
                  cantidadProductos === 1 ? "" : "s"
                }`
              : "Sin productos"}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>
            TOTAL DE LA ORDEN
          </Text>

          <Text style={styles.total}>
            Bs. {Number(item.total || 0).toFixed(2)}
          </Text>
        </View>

        <View style={styles.detailButton}>
          <Text style={styles.detailButtonText}>
            Ver detalle
          </Text>
          <Icon
            name="chevron-right"
            size={17}
            color={palette.white}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

return (
  <>
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
              <Icon
                name="x"
                size={21}
                color={palette.white}
              />
            </TouchableOpacity>

            <View style={styles.drawerBrandRow}>
              <View style={styles.brandLogo}>
                <Text style={styles.brandLogoText}>
                  N
                </Text>
              </View>

              <View style={styles.brandTextBox}>
                <Text style={styles.brandName}>
                  NextOrder
                </Text>
                <Text style={styles.brandRole}>
                  MESERO
                </Text>
              </View>
            </View>

            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userName
                    ? userName.charAt(0).toUpperCase()
                    : "U"}
                </Text>
              </View>

              <View style={styles.profileTextBox}>
                <Text
                  style={styles.drawerName}
                  numberOfLines={1}
                >
                  {userName}
                </Text>

                <Text
                  style={styles.drawerEmail}
                  numberOfLines={1}
                >
                  {userEmail}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.drawerMenu}>
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={irMesas}
            >
              <Icon
                name="grid"
                size={21}
                color={palette.white}
              />
              <Text style={styles.drawerItemText}>
                Mapa de mesas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={irPedidosPendientes}
            >
              <Icon
                name="clipboard"
                size={21}
                color={palette.white}
              />
              <Text style={styles.drawerItemText}>
                Pedidos pendientes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.drawerItem,
                styles.drawerItemActive,
              ]}
              onPress={() => setMenuVisible(false)}
            >
              <Icon
                name="clock"
                size={21}
                color={palette.white}
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
              <Icon
                name="log-out"
                size={20}
                color="#FFB4B8"
              />
              <Text style={styles.logoutText}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <Modal
      visible={detalleVisible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setDetalleVisible(false);
        setOrdenSeleccionada(null);
      }}
    >
      <View style={styles.detailOverlay}>
        <View style={styles.detailModal}>
          <View style={styles.detailHandle} />

          <View style={styles.detailHeader}>
            <View style={styles.detailHeaderIcon}>
              <Icon
                name="shopping-bag"
                size={22}
                color={palette.white}
              />
            </View>

            <View style={styles.detailHeaderText}>
              <Text style={styles.detailTitle}>
                Orden #{ordenSeleccionada?.id}
              </Text>
              <Text style={styles.detailSubtitle}>
                Mesa{" "}
                {ordenSeleccionada?.table_number ||
                  ordenSeleccionada?.table}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.detailCloseBtn}
              onPress={() => {
                setDetalleVisible(false);
                setOrdenSeleccionada(null);
              }}
            >
              <Icon
                name="x"
                size={21}
                color={palette.dark}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.detailContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailInfoBox}>
              <View style={styles.detailInfoRow}>
                <View style={styles.detailInfoIcon}>
                  <Icon
                    name="activity"
                    size={16}
                    color={palette.primary}
                  />
                </View>

                <View style={styles.detailInfoTextBox}>
                  <Text style={styles.detailLabel}>
                    Estado
                  </Text>
                  <Text style={styles.detailValue}>
                    {ordenSeleccionada?.status ||
                      "Sin estado"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailInfoSeparator} />

              <View style={styles.detailInfoRow}>
                <View style={styles.detailInfoIcon}>
                  <Icon
                    name="calendar"
                    size={16}
                    color={palette.primary}
                  />
                </View>

                <View style={styles.detailInfoTextBox}>
                  <Text style={styles.detailLabel}>
                    Fecha y hora
                  </Text>
                  <Text style={styles.detailValue}>
                    {ordenSeleccionada?.created_at
                      ? new Date(
                          ordenSeleccionada.created_at
                        ).toLocaleString()
                      : "Sin fecha"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSectionHeader}>
              <Text style={styles.detailSectionTitle}>
                Productos
              </Text>

              <View style={styles.productCountBadge}>
                <Text style={styles.productCountText}>
                  {detallesOrdenSeleccionada.length}
                </Text>
              </View>
            </View>

            {detallesOrdenSeleccionada.length > 0 ? (
              detallesOrdenSeleccionada.map((item) => (
                <View
                  key={item.id}
                  style={styles.detailItem}
                >
                  <View style={styles.productIconBox}>
                    <Icon
                      name="package"
                      size={18}
                      color={palette.accent}
                    />
                  </View>

                  <View style={styles.detailItemInfo}>
                    <Text style={styles.detailItemName}>
                      {item.nombre}
                    </Text>
                    <Text style={styles.detailItemMeta}>
                      {item.cantidad} × Bs.{" "}
                      {item.precio.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={styles.detailItemSubtotal}>
                    Bs. {item.subtotal.toFixed(2)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.detailEmptyBox}>
                <Icon
                  name="inbox"
                  size={28}
                  color={palette.placeholder}
                />
                <Text style={styles.detailEmpty}>
                  Esta orden no tiene productos cargados.
                </Text>
              </View>
            )}

            <View style={styles.detailTotalBox}>
              <View>
                <Text style={styles.detailTotalLabel}>
                  TOTAL DE LA ORDEN
                </Text>
                <Text style={styles.detailTotalCaption}>
                  Importe registrado
                </Text>
              </View>

              <Text style={styles.detailTotalValue}>
                Bs.{" "}
                {Number(
                  ordenSeleccionada?.total ||
                    totalDetalleCalculado
                ).toFixed(2)}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>

    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuVisible(true)}
        >
          <Icon
            name="menu"
            size={23}
            color={palette.white}
          />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>
            Historial de ventas
          </Text>
          <Text style={styles.headerSubtitle}>
            Consulta tus órdenes registradas
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.refreshBtn,
            loading && styles.refreshBtnDisabled,
          ]}
          onPress={cargarDatos}
          disabled={loading}
        >
          {loading ? (
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

      <View style={styles.dateFilterCard}>
        <View style={styles.dateFilterHeader}>
          <View style={styles.dateFilterIconBox}>
            <Icon
              name="calendar"
              size={18}
              color={palette.primary}
            />
          </View>

          <View style={styles.dateFilterHeading}>
            <Text style={styles.dateFilterTitle}>
              Filtrar por fecha
            </Text>

            <Text style={styles.dateFilterSubtitle}>
              Mostrando: {etiquetaFiltroActual}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateFilterScroll}
        >
          {filtrosFecha.map((item) => {
            const activo = filtroFecha === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.dateFilterChip,
                  activo && styles.dateFilterChipActive,
                ]}
                onPress={() => setFiltroFecha(item.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dateFilterChipText,
                    activo &&
                      styles.dateFilterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Órdenes registradas
        </Text>

        <View style={styles.sectionCountBadge}>
          <Text style={styles.sectionCountText}>
            {ordenesFiltradas.length}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={palette.primary}
          />
          <Text style={styles.loadingText}>
            Cargando órdenes...
          </Text>
        </View>
      ) : (
        <FlatList
          data={ordenesFiltradas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <Icon
                  name="file-text"
                  size={28}
                  color={palette.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                Sin órdenes en este período
              </Text>

              <Text style={styles.emptyText}>
                No se encontraron órdenes para el filtro
                “{etiquetaFiltroActual}”.
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

  headerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: palette.dark,
  },

  headerSubtitle: {
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

  refreshBtnDisabled: {
    opacity: 0.7,
  },

  dateFilterCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    paddingTop: 13,
    paddingBottom: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
    elevation: 1,
    shadowColor: "#16072F",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  dateFilterHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 11,
  },

  dateFilterIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: palette.infoBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#D2E4EA",
  },

  dateFilterHeading: {
    flex: 1,
  },

  dateFilterTitle: {
    color: palette.dark,
    fontSize: 14.5,
    fontWeight: "900",
  },

  dateFilterSubtitle: {
    color: palette.textSecondary,
    fontSize: 10.5,
    marginTop: 2,
  },

  dateFilterScroll: {
    paddingHorizontal: 13,
    paddingRight: 18,
  },

  dateFilterChip: {
    minHeight: 37,
    justifyContent: "center",
    paddingHorizontal: 14,
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: palette.muted,
    borderWidth: 1,
    borderColor: palette.border,
  },

  dateFilterChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },

  dateFilterChipText: {
    color: palette.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },

  dateFilterChipTextActive: {
    color: palette.white,
  },

  summaryCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 5,
    borderLeftColor: palette.accent,
    elevation: 1,
    shadowColor: "#16072F",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: palette.infoBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#D2E4EA",
  },

  summaryHeading: {
    flex: 1,
  },

  summaryTitle: {
    color: palette.dark,
    fontSize: 15,
    fontWeight: "900",
  },

  summarySubtitle: {
    color: palette.textSecondary,
    fontSize: 10.5,
    marginTop: 2,
  },

  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.muted,
    borderRadius: 15,
    paddingVertical: 11,
    paddingHorizontal: 4,
  },

  summaryStat: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 3,
  },

  summaryStatValue: {
    color: palette.dark,
    fontSize: 18,
    fontWeight: "900",
  },

  summaryMoneyValue: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: "900",
    maxWidth: "100%",
  },

  summaryStatLabel: {
    color: palette.gray,
    fontSize: 9.5,
    fontWeight: "700",
    marginTop: 2,
  },

  summarySeparator: {
    width: 1,
    height: 30,
    backgroundColor: palette.border,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  sectionTitle: {
    color: palette.dark,
    fontSize: 16,
    fontWeight: "900",
  },

  sectionCountBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },

  sectionCountText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: "900",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },

  list: {
    paddingBottom: 26,
  },

  card: {
    backgroundColor: palette.card,
    borderRadius: 22,
    padding: 14,
    marginBottom: 13,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: "#16072F",
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  orderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
  },

  cardHeading: {
    flex: 1,
    marginRight: 8,
  },

  title: {
    fontSize: 16,
    fontWeight: "900",
    color: palette.dark,
  },

  date: {
    fontSize: 10.5,
    color: palette.gray,
    marginTop: 3,
  },

  statusBadge: {
    maxWidth: 105,
    minHeight: 29,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusText: {
    marginLeft: 5,
    fontSize: 9.5,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  cardDivider: {
    height: 1,
    backgroundColor: "rgba(50,10,107,0.08)",
    marginVertical: 12,
  },

  orderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  orderMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
    marginBottom: 5,
  },

  orderMetaText: {
    color: palette.textSecondary,
    fontSize: 11.5,
    fontWeight: "700",
    marginLeft: 6,
  },

  cardFooter: {
    marginTop: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  totalLabel: {
    color: palette.gray,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  total: {
    color: palette.primary,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },

  detailButton: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  detailButtonText: {
    color: palette.white,
    fontSize: 10.5,
    fontWeight: "900",
    marginRight: 3,
  },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 28,
  },

  emptyIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: palette.infoBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    color: palette.dark,
    fontSize: 16,
    fontWeight: "900",
  },

  emptyText: {
    color: palette.gray,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
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

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(120,185,181,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: palette.light,
  },

  avatarText: {
    color: palette.white,
    fontSize: 18,
    fontWeight: "900",
  },

  profileTextBox: {
    flex: 1,
  },

  drawerName: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "900",
  },

  drawerEmail: {
    color: "#CFC4E5",
    fontSize: 11,
    marginTop: 3,
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

  detailOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: palette.overlay,
  },

  detailModal: {
    maxHeight: "90%",
    backgroundColor: palette.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  detailHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD6DC",
    alignSelf: "center",
    marginTop: 9,
    marginBottom: 2,
  },

  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },

  detailHeaderIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: palette.dark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  detailHeaderText: {
    flex: 1,
  },

  detailTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: palette.dark,
  },

  detailSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: palette.gray,
  },

  detailCloseBtn: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.muted,
  },

  detailContent: {
    padding: 16,
    paddingBottom: 28,
  },

  detailInfoBox: {
    backgroundColor: palette.surface,
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: palette.border,
  },

  detailInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
  },

  detailInfoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: palette.infoBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  detailInfoTextBox: {
    flex: 1,
  },

  detailInfoSeparator: {
    height: 1,
    backgroundColor: palette.border,
    marginLeft: 45,
  },

  detailLabel: {
    color: palette.gray,
    fontSize: 10.5,
  },

  detailValue: {
    color: palette.dark,
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 2,
  },

  detailSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  detailSectionTitle: {
    color: palette.dark,
    fontSize: 16,
    fontWeight: "900",
  },

  productCountBadge: {
    minWidth: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
    paddingHorizontal: 6,
  },

  productCountText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: "900",
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: palette.border,
  },

  productIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E8F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  detailItemInfo: {
    flex: 1,
    marginRight: 8,
  },

  detailItemName: {
    color: palette.dark,
    fontSize: 13.5,
    fontWeight: "900",
  },

  detailItemMeta: {
    color: palette.gray,
    fontSize: 11.5,
    marginTop: 3,
  },

  detailItemSubtotal: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: "900",
  },

  detailEmptyBox: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: palette.border,
  },

  detailEmpty: {
    textAlign: "center",
    color: palette.gray,
    fontSize: 12,
    marginTop: 8,
  },

  detailTotalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.dark,
    padding: 16,
    borderRadius: 18,
    marginTop: 10,
  },

  detailTotalLabel: {
    color: palette.light,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  detailTotalCaption: {
    color: "#D9D0E8",
    fontSize: 10,
    marginTop: 3,
  },

  detailTotalValue: {
    color: palette.white,
    fontSize: 19,
    fontWeight: "900",
  },
});
