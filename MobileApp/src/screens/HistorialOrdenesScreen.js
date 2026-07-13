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
import { colors } from "../theme/colors";

const API_BASE_URL = "http://192.168.0.10:8000";
const ORDERS_URL = `${API_BASE_URL}/api/orders/orders/`;
const PRODUCTS_URL = `${API_BASE_URL}/api/inventory/products/`;
const USERS_URL = `${API_BASE_URL}/api/users/`;
const ORDER_OWNERS_STORAGE_KEY = "orderOwnersById";

const palette = {
  light: colors.restaurantLight ?? "#78B9B5",
  accent:
    colors.restaurantAccent ??
    colors.accent ??
    "#0F828C",
  primary:
    colors.restaurantPrimary ??
    colors.primary ??
    "#065084",
  dark:
    colors.restaurantDark ??
    colors.dark ??
    "#320A6B",

  background: colors.background ?? "#F8FAFC",
  surface: colors.surface ?? colors.white ?? "#FFFFFF",
  card: colors.card ?? colors.white ?? "#FFFFFF",
  muted: colors.muted ?? "#E8F3F2",

  text: colors.text ?? "#0F172A",
  textSecondary: colors.textSecondary ?? "#475569",
  gray: colors.gray ?? "#64748B",
  border: colors.border ?? "#DCE7E7",

  success: colors.success ?? "#15803D",
  successBackground:
    colors.successBackground ?? "#DCFCE7",
  warning: colors.warning ?? "#B45309",
  warningBackground:
    colors.warningBackground ?? "#FEF3C7",
  danger: colors.danger ?? "#DC2626",
  dangerBackground:
    colors.dangerBackground ?? "#FEE2E2",

  white: colors.white ?? "#FFFFFF",
  overlay:
    colors.overlay ?? "rgba(15, 23, 42, 0.45)",
};

export default function HistorialOrdenesScreen({ navigation }) {
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

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

const renderItem = ({ item }) => {
const cantidadProductos = Array.isArray(item.items)
? item.items.reduce(
(suma, producto) => suma + Number(producto.quantity || 0),
0
)
: 0;


return (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.8}
    onPress={() => abrirDetalleOrden(item)}
  >
    <View style={styles.cardHeader}>
      <Text style={styles.title}>Orden #{item.id}</Text>

      <Text
        style={[
          styles.status,
          item.status === "Pendiente"
            ? styles.statusPendiente
            : styles.statusFinalizada,
        ]}
      >
        {item.status}
      </Text>
    </View>

    <Text style={styles.text}>
      Mesa {item.table_number || item.table}
    </Text>

    <Text style={styles.total}>
      Bs. {Number(item.total || 0).toFixed(2)}
    </Text>

    <Text style={styles.date}>
      {item.created_at
        ? new Date(item.created_at).toLocaleString()
        : "Sin fecha"}
    </Text>

    <Text style={styles.itemsText}>
      {cantidadProductos > 0
        ? `${cantidadProductos} producto(s)`
        : "Sin productos cargados"}
    </Text>

    <Text style={styles.detalleHint}>Ver detalle →</Text>
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
            <Icon name="x" size={24} color={palette.white} />
          </TouchableOpacity>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>

          <Text style={styles.drawerName}>{userName}</Text>
          <Text style={styles.drawerEmail}>{userEmail}</Text>
        </View>

        <View style={styles.drawerMenu}>
          <TouchableOpacity style={styles.drawerItem} onPress={irMesas}>
            <Icon name="grid" size={21} color={palette.primary} />
            <Text style={styles.drawerItemText}>Mapa de mesas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.drawerItem, styles.drawerItemActive]}
            onPress={() => setMenuVisible(false)}
          >
            <Icon name="clock" size={21} color={palette.primary} />
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
            <Icon name="log-out" size={20} color={palette.danger} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
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
        <View style={styles.detailHeader}>
          <View>
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
            <Icon name="x" size={22} color={palette.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.detailContent}>
          <View style={styles.detailInfoBox}>
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailLabel}>Estado</Text>
              <Text style={styles.detailValue}>
                {ordenSeleccionada?.status || "Sin estado"}
              </Text>
            </View>

            <View style={styles.detailInfoRow}>
              <Text style={styles.detailLabel}>Fecha</Text>
              <Text style={styles.detailValue}>
                {ordenSeleccionada?.created_at
                  ? new Date(
                      ordenSeleccionada.created_at
                    ).toLocaleString()
                  : "Sin fecha"}
              </Text>
            </View>
          </View>

          <Text style={styles.detailSectionTitle}>Productos</Text>

          {detallesOrdenSeleccionada.length > 0 ? (
            detallesOrdenSeleccionada.map((item) => (
              <View key={item.id} style={styles.detailItem}>
                <View style={styles.detailItemInfo}>
                  <Text style={styles.detailItemName}>{item.nombre}</Text>
                  <Text style={styles.detailItemMeta}>
                    {item.cantidad} x Bs. {item.precio.toFixed(2)}
                  </Text>
                </View>

                <Text style={styles.detailItemSubtotal}>
                  Bs. {item.subtotal.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.detailEmpty}>
              Esta orden no tiene productos cargados.
            </Text>
          )}

          <View style={styles.detailTotalBox}>
            <Text style={styles.detailTotalLabel}>Total de la orden</Text>
            <Text style={styles.detailTotalValue}>
              Bs. {totalDetalleCalculado.toFixed(2)}
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
        <Icon name="menu" size={26} color={palette.white} />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Historial de órdenes</Text>

      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={cargarDatos}
        disabled={loading}
      >
        <Icon name="refresh-cw" size={21} color={palette.primary} />
      </TouchableOpacity>
    </View>

    {loading ? (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>Cargando órdenes...</Text>
      </View>
    ) : (
      <FlatList
        data={ordenes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No hay órdenes registradas para este usuario.
          </Text>
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
},

topBar: {
flexDirection: "row",
alignItems: "center",
backgroundColor: palette.primary,
paddingHorizontal: 15,
paddingTop: 15,
paddingBottom: 15,
elevation: 2,
},

menuBtn: {
width: 44,
height: 44,
borderRadius: 12,
backgroundColor: palette.dark,
alignItems: "center",
justifyContent: "center",
borderWidth: 1,
borderColor: palette.light,
},

headerTitle: {
flex: 1,
marginLeft: 12,
fontSize: 20,
fontWeight: "bold",
color: palette.white,
},

refreshBtn: {
width: 44,
height: 44,
borderRadius: 12,
backgroundColor: palette.light,
alignItems: "center",
justifyContent: "center",
},

centered: {
flex: 1,
justifyContent: "center",
alignItems: "center",
},

loadingText: {
marginTop: 10,
color: palette.gray,
fontSize: 14,
},

list: {
padding: 16,
},

card: {
backgroundColor: palette.card,
borderRadius: 14,
padding: 16,
marginBottom: 12,
borderWidth: 1,
borderColor: palette.border,
borderLeftWidth: 5,
borderLeftColor: palette.accent,
elevation: 1,
},

cardHeader: {
flexDirection: "row",
justifyContent: "space-between",
alignItems: "center",
},

title: {
fontSize: 17,
fontWeight: "bold",
color: palette.text,
},

text: {
fontSize: 14,
color: palette.textSecondary,
marginTop: 6,
},

total: {
fontSize: 18,
fontWeight: "bold",
color: palette.accent,
marginTop: 8,
},

date: {
fontSize: 12,
color: palette.gray,
marginTop: 4,
},

itemsText: {
fontSize: 13,
color: palette.gray,
marginTop: 6,
},

detalleHint: {
marginTop: 10,
color: palette.primary,
fontSize: 13,
fontWeight: "bold",
},

status: {
paddingHorizontal: 10,
paddingVertical: 4,
borderRadius: 10,
fontSize: 12,
fontWeight: "bold",
},

statusPendiente: {
backgroundColor: palette.warningBackground,
color: palette.warning,
},

statusFinalizada: {
backgroundColor: palette.successBackground,
color: palette.success,
},

emptyText: {
textAlign: "center",
marginTop: 40,
color: palette.gray,
},

modalBackground: {
flex: 1,
backgroundColor: palette.overlay,
},

backdrop: {
...StyleSheet.absoluteFillObject,
},

drawer: {
width: "78%",
maxWidth: 330,
height: "100%",
backgroundColor: palette.background,
elevation: 12,
},

drawerHeader: {
backgroundColor: palette.dark,
alignItems: "center",
paddingTop: 48,
paddingBottom: 28,
paddingHorizontal: 18,
borderBottomWidth: 4,
borderBottomColor: palette.accent,
},

closeBtn: {
position: "absolute",
top: 18,
right: 16,
padding: 6,
},

avatar: {
width: 76,
height: 76,
borderRadius: 38,
backgroundColor: palette.light,
alignItems: "center",
justifyContent: "center",
marginBottom: 12,
borderWidth: 3,
borderColor: palette.white,
},

avatarText: {
color: palette.dark,
fontSize: 31,
fontWeight: "bold",
},

drawerName: {
color: palette.surface,
fontSize: 19,
fontWeight: "bold",
},

drawerEmail: {
color: palette.light,
fontSize: 13,
marginTop: 5,
},

drawerMenu: {
paddingHorizontal: 14,
paddingTop: 20,
},

drawerItem: {
flexDirection: "row",
alignItems: "center",
backgroundColor: palette.surface,
paddingHorizontal: 16,
paddingVertical: 16,
borderRadius: 14,
marginBottom: 10,
},

drawerItemActive: {
backgroundColor: palette.muted,
borderLeftWidth: 4,
borderLeftColor: palette.accent,
},

drawerItemText: {
marginLeft: 14,
color: palette.text,
fontSize: 15,
fontWeight: "bold",
},

drawerFooter: {
flex: 1,
justifyContent: "flex-end",
padding: 16,
},

logoutBtn: {
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
backgroundColor: palette.dangerBackground,
paddingVertical: 14,
borderRadius: 14,
},

logoutText: {
marginLeft: 10,
color: palette.danger,
fontWeight: "bold",
fontSize: 15,
},

detailOverlay: {
flex: 1,
justifyContent: "flex-end",
backgroundColor: palette.overlay,
},

detailModal: {
maxHeight: "88%",
backgroundColor: palette.background,
borderTopLeftRadius: 24,
borderTopRightRadius: 24,
},

detailHeader: {
flexDirection: "row",
justifyContent: "space-between",
alignItems: "center",
paddingHorizontal: 20,
paddingTop: 20,
paddingBottom: 16,
backgroundColor: palette.surface,
borderTopLeftRadius: 24,
borderTopRightRadius: 24,
},

detailTitle: {
fontSize: 21,
fontWeight: "bold",
color: palette.primary,
},

detailSubtitle: {
marginTop: 3,
fontSize: 14,
color: palette.gray,
},

detailCloseBtn: {
width: 40,
height: 40,
borderRadius: 20,
alignItems: "center",
justifyContent: "center",
backgroundColor: palette.muted,
},

detailContent: {
padding: 16,
},

detailInfoBox: {
backgroundColor: palette.surface,
borderRadius: 14,
padding: 14,
marginBottom: 18,
},

detailInfoRow: {
flexDirection: "row",
justifyContent: "space-between",
marginBottom: 8,
},

detailLabel: {
color: palette.gray,
fontSize: 13,
},

detailValue: {
color: palette.text,
fontSize: 13,
fontWeight: "bold",
maxWidth: "62%",
textAlign: "right",
},

detailSectionTitle: {
color: palette.text,
fontSize: 17,
fontWeight: "bold",
marginBottom: 10,
},

detailItem: {
flexDirection: "row",
alignItems: "center",
backgroundColor: palette.surface,
borderRadius: 12,
padding: 14,
marginBottom: 10,
},

detailItemInfo: {
flex: 1,
marginRight: 10,
},

detailItemName: {
color: palette.text,
fontSize: 15,
fontWeight: "bold",
},

detailItemMeta: {
color: palette.gray,
fontSize: 13,
marginTop: 4,
},

detailItemSubtotal: {
color: palette.accent,
fontSize: 14,
fontWeight: "bold",
},

detailEmpty: {
textAlign: "center",
color: palette.gray,
marginTop: 12,
},

detailTotalBox: {
flexDirection: "row",
justifyContent: "space-between",
backgroundColor: palette.muted,
padding: 16,
borderRadius: 14,
marginTop: 8,
marginBottom: 10,
borderWidth: 1,
borderColor: palette.light,
},

detailTotalLabel: {
color: palette.primary,
fontSize: 16,
fontWeight: "bold",
},

detailTotalValue: {
color: palette.accent,
fontSize: 18,
fontWeight: "bold",
},
});
