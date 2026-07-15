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
import { useTableWebSocket } from "../services/useTableWebSocket";

import { API_BASE_URL } from "../services/config";

// Asegura que los íconos Feather estén disponibles en Android.
if (typeof Icon.loadFont === "function") {
  Icon.loadFont().catch(() => {});
}
const ORDERS_URL = `${API_BASE_URL}/api/orders/orders/`;
const PRODUCTS_URL = `${API_BASE_URL}/api/inventory/products/`;
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

export default function PedidosPendientesScreen({
  navigation,
}) {
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState("Usuario");
  const [userEmail, setUserEmail] = useState("Sesión activa");

  // WebSocket Integration
  const onWebSocketUpdate = useCallback(() => {
    console.log("[PedidosPendientes] Ping recibido. Recargando pedidos...");
    cargarPedidosPendientes();
  }, []);
  
  useTableWebSocket(onWebSocketUpdate);

  const [detalleVisible, setDetalleVisible] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] =
    useState(null);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No existe un token de sesión.");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    };
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
        return null;
      }

      const payload = JSON.parse(global.atob(base64));

      return payload?.user_id
        ? String(payload.user_id)
        : null;
    } catch (error) {
      console.log(
        "Error leyendo user_id del token:",
        error
      );
      return null;
    }
  };

  const cargarPerfilLocal = async () => {
    const nombreGuardado = await AsyncStorage.getItem(
      "userName"
    );

    const correoGuardado = await AsyncStorage.getItem(
      "userEmail"
    );

    const loginUsername = await AsyncStorage.getItem(
      "loginUsername"
    );

    setUserName(
      nombreGuardado ||
        loginUsername ||
        "Usuario"
    );

    setUserEmail(
      correoGuardado || "Sesión activa"
    );
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

      return mapa && typeof mapa === "object"
        ? mapa
        : {};
    } catch (error) {
      console.log(
        "Error leyendo propietarios locales:",
        error
      );

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
      String(propietarioLocal) ===
        String(userIdActual)
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
      if (
        usuarioOrden === null ||
        usuarioOrden === undefined
      ) {
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
          String(idUsuarioOrden) ===
            String(userIdActual);

        const coincideUsername =
          usernameActual &&
          usernameUsuarioOrden &&
          String(
            usernameUsuarioOrden
          ).toLowerCase() ===
            String(usernameActual).toLowerCase();

        return coincideId || coincideUsername;
      }

      const coincideId =
        userIdActual &&
        String(usuarioOrden) ===
          String(userIdActual);

      const coincideUsername =
        usernameActual &&
        String(usuarioOrden).toLowerCase() ===
          String(usernameActual).toLowerCase();

      return coincideId || coincideUsername;
    });
  };

  const cargarPedidosPendientes = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem(
        "accessToken"
      );

      if (!token) {
        throw new Error(
          "No existe un token de sesión."
        );
      }

      const userIdGuardado =
        await AsyncStorage.getItem("userId");

      const userIdToken =
        obtenerUserIdDesdeToken(token);

      const userIdActual =
        userIdGuardado ||
        String(userIdToken || "");

      const loginUsername =
        await AsyncStorage.getItem(
          "loginUsername"
        );

      if (!userIdActual && !loginUsername) {
        throw new Error(
          "No se pudo identificar al usuario activo."
        );
      }

      const headers = await getAuthHeaders();

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

      const productosData =
        await productosResponse.json();

      const ordenesData =
        await ordenesResponse.json();

      if (!productosResponse.ok) {
        throw new Error(
          JSON.stringify(productosData)
        );
      }

      if (!ordenesResponse.ok) {
        throw new Error(
          JSON.stringify(ordenesData)
        );
      }

      const listaProductos =
        normalizarLista(productosData);

      const productosAdaptados =
        listaProductos.map((producto) => ({
          id: producto.id,
          nombre:
            producto.name ||
            producto.nombre ||
            `Producto #${producto.id}`,
          precio: Number(
            producto.price ||
              producto.precio ||
              0
          ),
        }));

      const listaOrdenes =
        normalizarLista(ordenesData);

      const propietariosLocales =
        await leerPropietariosLocales();

      const pendientesDelUsuario =
        listaOrdenes
          .filter((orden) => {
            const esPendiente =
              String(
                orden.status || ""
              ).toLowerCase() === "pendiente";

            const pertenece =
              ordenPerteneceAlUsuario(
                orden,
                userIdActual,
                loginUsername,
                propietariosLocales
              );

            return esPendiente && pertenece;
          })
          .sort(
            (a, b) =>
              new Date(b.created_at) -
              new Date(a.created_at)
          );

      console.log(
        "PEDIDOS PENDIENTES DEL MESERO:",
        pendientesDelUsuario
      );

      setProductos(productosAdaptados);
      setOrdenes(pendientesDelUsuario);
    } catch (error) {
      console.log(
        "Error cargando pedidos pendientes:",
        error
      );

      setOrdenes([]);

      Alert.alert(
        "Error",
        "No se pudieron cargar los pedidos pendientes."
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPerfilLocal();
      cargarPedidosPendientes();
    }, [])
  );

  const irMesas = () => {
    setMenuVisible(false);
    navigation.navigate("Mesas");
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

              setMenuVisible(false);

              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              console.log(
                "Error cerrando sesión:",
                error
              );
            }
          },
        },
      ]
    );
  };

  const obtenerIdProducto = (item) => {
    if (
      typeof item.product === "object" &&
      item.product !== null
    ) {
      return item.product.id;
    }

    return item.product;
  };

  const obtenerNombreProducto = (item) => {
    if (
      typeof item.product === "object" &&
      item.product !== null
    ) {
      return (
        item.product.name ||
        item.product.nombre ||
        "Producto"
      );
    }

    if (item.product_name) {
      return item.product_name;
    }

    const productoEncontrado =
      productos.find(
        (producto) =>
          Number(producto.id) ===
          Number(obtenerIdProducto(item))
      );

    return productoEncontrado
      ? productoEncontrado.nombre
      : `Producto #${obtenerIdProducto(item)}`;
  };

  const obtenerPrecioUnitario = (item) => {
    if (
      item.price !== undefined &&
      item.price !== null
    ) {
      return Number(item.price);
    }

    const productoEncontrado =
      productos.find(
        (producto) =>
          Number(producto.id) ===
          Number(obtenerIdProducto(item))
      );

    return Number(
      productoEncontrado?.precio || 0
    );
  };

  const obtenerDetallesOrden = (orden) => {
    const items = Array.isArray(orden?.items)
      ? orden.items
      : [];

    return items.map((item, index) => {
      const cantidad = Number(
        item.quantity || 0
      );

      const precio =
        obtenerPrecioUnitario(item);

      return {
        id:
          item.id ||
          `${orden.id}-${index}`,
        nombre:
          obtenerNombreProducto(item),
        cantidad,
        precio,
        subtotal: cantidad * precio,
        nota:
          item.notes ||
          item.note ||
          item.observations ||
          "",
      };
    });
  };

  const abrirDetalleOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setDetalleVisible(true);
  };

  const cerrarDetalleOrden = () => {
    setDetalleVisible(false);
    setOrdenSeleccionada(null);
  };

  const abrirMesa = (orden) => {
    const mesaId =
      orden.table?.id ??
      orden.table ??
      orden.table_id;

    if (!mesaId) {
      Alert.alert(
        "Mesa no disponible",
        "No se pudo identificar la mesa de esta orden."
      );
      return;
    }

    const mesa = {
      id: mesaId,
      table_number:
        orden.table_number ??
        orden.table?.table_number ??
        orden.table?.number ??
        String(mesaId),
      status: "Ocupada",
      activeOrderId: orden.id,
    };

    setDetalleVisible(false);
    setOrdenSeleccionada(null);

    navigation.navigate("Pedido", { mesa });
  };

  const detallesOrdenSeleccionada =
    ordenSeleccionada
      ? obtenerDetallesOrden(
          ordenSeleccionada
        )
      : [];

  const totalDetalleCalculado =
    detallesOrdenSeleccionada.reduce(
      (suma, item) =>
        suma + item.subtotal,
      0
    );

  const totalPendiente = ordenes.reduce(
    (suma, orden) => suma + Number(orden?.total || 0),
    0
  );

  const totalProductosPendientes = ordenes.reduce(
    (suma, orden) => {
      const items = Array.isArray(orden?.items)
        ? orden.items
        : [];

      return (
        suma +
        items.reduce(
          (subtotal, item) =>
            subtotal + Number(item?.quantity || 0),
          0
        )
      );
    },
    0
  );

  const renderItem = ({ item }) => {
    const cantidadProductos =
      Array.isArray(item.items)
        ? item.items.reduce(
            (suma, producto) =>
              suma +
              Number(producto.quantity || 0),
            0
          )
        : 0;

    const fecha = item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "Sin fecha";

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => abrirDetalleOrden(item)}
        >
          <View style={styles.cardTop}>
            <View style={styles.tableIconBox}>
              <Icon
                name="grid"
                size={20}
                color={palette.primary}
              />
            </View>

            <View style={styles.cardHeading}>
              <Text style={styles.title}>
                Mesa {item.table_number || item.table}
              </Text>

              <Text style={styles.orderNumber}>
                Orden #{item.id}
              </Text>
            </View>

            <View style={styles.pendingBadge}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingBadgeText}>
                PENDIENTE
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon
                name="shopping-bag"
                size={15}
                color={palette.accent}
              />
              <Text style={styles.metaText}>
                {cantidadProductos > 0
                  ? `${cantidadProductos} producto${
                      cantidadProductos === 1 ? "" : "s"
                    }`
                  : "Sin productos"}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Icon
                name="clock"
                size={15}
                color={palette.accent}
              />
              <Text
                style={styles.metaText}
                numberOfLines={1}
              >
                {fecha}
              </Text>
            </View>
          </View>

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>
                CONSUMO ACTUAL
              </Text>
              <Text style={styles.total}>
                Bs. {Number(item.total || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.viewHint}>
              <Text style={styles.viewHintText}>
                Ver pedido
              </Text>
              <Icon
                name="chevron-right"
                size={17}
                color={palette.primary}
              />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => abrirDetalleOrden(item)}
          >
            <Icon
              name="eye"
              size={16}
              color={palette.primary}
            />
            <Text style={styles.detailButtonText}>
              Ver detalle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.openTableButton}
            onPress={() => abrirMesa(item)}
          >
            <Icon
              name="arrow-right-circle"
              size={17}
              color={palette.white}
            />
            <Text style={styles.openTableButtonText}>
              Abrir mesa
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
                style={[
                  styles.drawerItem,
                  styles.drawerItemActive,
                ]}
                onPress={() => setMenuVisible(false)}
              >
                <Icon
                  name="clipboard"
                  size={21}
                  color={palette.white}
                />
                <Text style={styles.drawerItemText}>
                  Pedidos pendientes
                </Text>

                <View style={styles.drawerCountBadge}>
                  <Text style={styles.drawerCountText}>
                    {ordenes.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={irHistorial}
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
        onRequestClose={cerrarDetalleOrden}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.detailHandle} />

            <View style={styles.detailHeader}>
              <View style={styles.detailHeaderIcon}>
                <Icon
                  name="clipboard"
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
                onPress={cerrarDetalleOrden}
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
                      color={palette.warning}
                    />
                  </View>

                  <View style={styles.detailInfoTextBox}>
                    <Text style={styles.detailLabel}>
                      Estado
                    </Text>
                    <Text style={styles.detailPendingValue}>
                      Pendiente
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

                      {item.nota ? (
                        <View style={styles.noteBox}>
                          <Icon
                            name="message-square"
                            size={12}
                            color={palette.warning}
                          />
                          <Text style={styles.detailItemNote}>
                            {item.nota}
                          </Text>
                        </View>
                      ) : null}
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
                    Consumo pendiente
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

              <TouchableOpacity
                style={styles.detailOpenButton}
                onPress={() =>
                  abrirMesa(ordenSeleccionada)
                }
              >
                <Icon
                  name="arrow-right-circle"
                  size={19}
                  color={palette.white}
                />
                <Text style={styles.detailOpenButtonText}>
                  Abrir pedido de la mesa
                </Text>
              </TouchableOpacity>
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

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              Pedidos pendientes
            </Text>
            <Text style={styles.headerSubtitle}>
              Controla tus órdenes activas
            </Text>
          </View>

          <View style={styles.headerCount}>
            <Text style={styles.headerCountText}>
              {ordenes.length}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.refreshBtn,
              loading && styles.refreshBtnDisabled,
            ]}
            onPress={cargarPedidosPendientes}
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



        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Órdenes activas
          </Text>

          <View style={styles.sectionCountBadge}>
            <Text style={styles.sectionCountText}>
              {ordenes.length}
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
              Cargando pedidos pendientes...
            </Text>
          </View>
        ) : (
          <FlatList
            data={ordenes}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={
              ordenes.length > 0
                ? styles.list
                : styles.emptyList
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Icon
                    name="check-circle"
                    size={38}
                    color={palette.success}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No tienes pedidos pendientes
                </Text>

                <Text style={styles.emptyText}>
                  Las órdenes activas que registres
                  aparecerán aquí automáticamente.
                </Text>

                <TouchableOpacity
                  style={styles.goTablesButton}
                  onPress={irMesas}
                >
                  <Icon
                    name="grid"
                    size={17}
                    color={palette.white}
                  />
                  <Text style={styles.goTablesButtonText}>
                    Ir al mapa de mesas
                  </Text>
                </TouchableOpacity>
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

  headerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },

  headerTitle: {
    color: palette.dark,
    fontSize: 18.5,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: palette.textSecondary,
    fontSize: 10.5,
    marginTop: 2,
  },

  headerCount: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.warning,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
    paddingHorizontal: 8,
  },

  headerCountText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "900",
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

  summaryCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 5,
    borderLeftColor: palette.warning,
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
    backgroundColor: palette.warningBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F2D4A4",
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
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },

  list: {
    paddingBottom: 28,
  },

  emptyList: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: palette.card,
    borderRadius: 22,
    padding: 14,
    marginBottom: 13,
    borderWidth: 1.5,
    borderColor: "#F1B36C",
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

  tableIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  cardHeading: {
    flex: 1,
    marginRight: 8,
  },

  title: {
    color: palette.dark,
    fontSize: 17,
    fontWeight: "900",
  },

  orderNumber: {
    color: palette.gray,
    fontSize: 10.5,
    marginTop: 3,
  },

  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.warningBackground,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F2D4A4",
  },

  pendingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.warning,
    marginRight: 5,
  },

  pendingBadgeText: {
    color: palette.warning,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  cardDivider: {
    height: 1,
    backgroundColor: "rgba(50,10,107,0.08)",
    marginVertical: 12,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 6,
    maxWidth: "100%",
  },

  metaText: {
    color: palette.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 6,
    maxWidth: 220,
  },

  totalRow: {
    marginTop: 7,
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

  viewHint: {
    flexDirection: "row",
    alignItems: "center",
  },

  viewHintText: {
    color: palette.primary,
    fontSize: 10.5,
    fontWeight: "900",
  },

  cardActions: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(50,10,107,0.09)",
  },

  detailButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: palette.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },

  detailButtonText: {
    color: palette.primary,
    fontSize: 11.5,
    fontWeight: "900",
    marginLeft: 6,
  },

  openTableButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: palette.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  openTableButtonText: {
    color: palette.white,
    fontSize: 11.5,
    fontWeight: "900",
    marginLeft: 6,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 27,
    backgroundColor: palette.successBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#B7DFC9",
  },

  emptyTitle: {
    color: palette.dark,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    color: palette.gray,
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 7,
  },

  goTablesButton: {
    marginTop: 21,
    backgroundColor: palette.primary,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  goTablesButtonText: {
    color: palette.white,
    fontWeight: "900",
    fontSize: 12.5,
    marginLeft: 8,
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
    flex: 1,
    color: palette.white,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 13,
  },

  drawerCountBadge: {
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: palette.warning,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },

  drawerCountText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: "900",
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
    backgroundColor: palette.warningBackground,
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

  detailPendingValue: {
    color: palette.warning,
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

  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    backgroundColor: palette.warningBackground,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  detailItemNote: {
    flex: 1,
    color: palette.warning,
    fontSize: 10.5,
    fontWeight: "700",
    marginLeft: 5,
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
    marginBottom: 12,
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

  detailOpenButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: palette.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  detailOpenButtonText: {
    color: palette.white,
    fontSize: 13.5,
    fontWeight: "900",
    marginLeft: 8,
  },
});
