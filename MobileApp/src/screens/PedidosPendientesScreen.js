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
  placeholder: colors.placeholder ?? "#94A3B8",
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

export default function PedidosPendientesScreen({
  navigation,
}) {
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState("Usuario");
  const [userEmail, setUserEmail] = useState("Sesión activa");

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

  const renderItem = ({ item }) => {
    const cantidadProductos =
      Array.isArray(item.items)
        ? item.items.reduce(
            (suma, producto) =>
              suma +
              Number(
                producto.quantity || 0
              ),
            0
          )
        : 0;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() =>
            abrirDetalleOrden(item)
          }
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.title}>
                Mesa{" "}
                {item.table_number ||
                  item.table}
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

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Icon
                name="shopping-bag"
                size={16}
                color={palette.accent}
              />

              <Text style={styles.summaryText}>
                {cantidadProductos} producto(s)
              </Text>
            </View>

            <Text style={styles.total}>
              Bs.{" "}
              {Number(
                item.total || 0
              ).toFixed(2)}
            </Text>
          </View>

          <Text style={styles.date}>
            Iniciado:{" "}
            {item.created_at
              ? new Date(
                  item.created_at
                ).toLocaleString()
              : "Sin fecha"}
          </Text>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() =>
              abrirDetalleOrden(item)
            }
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
              size={16}
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
        onRequestClose={() =>
          setMenuVisible(false)
        }
      >
        <View style={styles.modalBackground}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() =>
              setMenuVisible(false)
            }
          />

          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() =>
                  setMenuVisible(false)
                }
              >
                <Icon
                  name="x"
                  size={24}
                  color={palette.white}
                />
              </TouchableOpacity>

              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userName
                    ? userName
                        .charAt(0)
                        .toUpperCase()
                    : "U"}
                </Text>
              </View>

              <Text style={styles.drawerName}>
                {userName}
              </Text>

              <Text style={styles.drawerEmail}>
                {userEmail}
              </Text>
            </View>

            <View style={styles.drawerMenu}>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={irMesas}
              >
                <Icon
                  name="grid"
                  size={21}
                  color={palette.primary}
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
                onPress={() =>
                  setMenuVisible(false)
                }
              >
                <Icon
                  name="clipboard"
                  size={21}
                  color={palette.primary}
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
                  color={palette.primary}
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
                  color={palette.danger}
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
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>
                  Orden #
                  {ordenSeleccionada?.id}
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
                  size={22}
                  color={palette.primary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={
                styles.detailContent
              }
            >
              <View style={styles.detailInfoBox}>
                <View style={styles.detailInfoRow}>
                  <Text style={styles.detailLabel}>
                    Estado
                  </Text>

                  <Text style={styles.detailPendingValue}>
                    Pendiente
                  </Text>
                </View>

                <View style={styles.detailInfoRow}>
                  <Text style={styles.detailLabel}>
                    Fecha
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

              <Text style={styles.detailSectionTitle}>
                Productos
              </Text>

              {detallesOrdenSeleccionada.length >
              0 ? (
                detallesOrdenSeleccionada.map(
                  (item) => (
                    <View
                      key={item.id}
                      style={styles.detailItem}
                    >
                      <View
                        style={
                          styles.detailItemInfo
                        }
                      >
                        <Text
                          style={
                            styles.detailItemName
                          }
                        >
                          {item.nombre}
                        </Text>

                        <Text
                          style={
                            styles.detailItemMeta
                          }
                        >
                          {item.cantidad} x Bs.{" "}
                          {item.precio.toFixed(2)}
                        </Text>

                        {item.nota ? (
                          <Text
                            style={
                              styles.detailItemNote
                            }
                          >
                            Nota: {item.nota}
                          </Text>
                        ) : null}
                      </View>

                      <Text
                        style={
                          styles.detailItemSubtotal
                        }
                      >
                        Bs.{" "}
                        {item.subtotal.toFixed(2)}
                      </Text>
                    </View>
                  )
                )
              ) : (
                <Text style={styles.detailEmpty}>
                  Esta orden no tiene productos cargados.
                </Text>
              )}

              <View style={styles.detailTotalBox}>
                <Text
                  style={
                    styles.detailTotalLabel
                  }
                >
                  Total de la orden
                </Text>

                <Text
                  style={
                    styles.detailTotalValue
                  }
                >
                  Bs.{" "}
                  {totalDetalleCalculado.toFixed(
                    2
                  )}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.detailOpenButton}
                onPress={() =>
                  abrirMesa(
                    ordenSeleccionada
                  )
                }
              >
                <Icon
                  name="arrow-right-circle"
                  size={19}
                  color={palette.white}
                />

                <Text
                  style={
                    styles.detailOpenButtonText
                  }
                >
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
            onPress={() =>
              setMenuVisible(true)
            }
          >
            <Icon
              name="menu"
              size={26}
              color={palette.white}
            />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              Pedidos pendientes
            </Text>

            <Text style={styles.headerSubtitle}>
              Solo tus órdenes activas
            </Text>
          </View>

          <View style={styles.headerCount}>
            <Text style={styles.headerCountText}>
              {ordenes.length}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={
              cargarPedidosPendientes
            }
            disabled={loading}
          >
            <Icon
              name="refresh-cw"
              size={19}
              color={palette.primary}
            />
          </TouchableOpacity>
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
            keyExtractor={(item) =>
              String(item.id)
            }
            renderItem={renderItem}
            contentContainerStyle={
              ordenes.length > 0
                ? styles.list
                : styles.emptyList
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Icon
                    name="check-circle"
                    size={42}
                    color={palette.success}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No tienes pedidos pendientes
                </Text>

                <Text style={styles.emptyText}>
                  Las órdenes pendientes que registres aparecerán aquí.
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

                  <Text
                    style={
                      styles.goTablesButtonText
                    }
                  >
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
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingTop: 15,
    paddingBottom: 15,
    elevation: 3,
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

  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: palette.white,
    fontSize: 19,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: palette.light,
    fontSize: 11,
    marginTop: 2,
  },

  headerCount: {
    minWidth: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: palette.light,
  },

  headerCountText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "900",
  },

  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: palette.light,
    alignItems: "center",
    justifyContent: "center",
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: palette.gray,
    fontSize: 14,
  },

  list: {
    padding: 16,
    paddingBottom: 28,
  },

  emptyList: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: palette.card,
    borderRadius: 17,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 5,
    borderLeftColor: palette.warning,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  title: {
    color: palette.text,
    fontSize: 19,
    fontWeight: "800",
  },

  orderNumber: {
    color: palette.gray,
    fontSize: 12,
    marginTop: 3,
  },

  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.warningBackground,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  pendingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.warning,
    marginRight: 6,
  },

  pendingBadgeText: {
    color: palette.warning,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },

  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryText: {
    color: palette.textSecondary,
    fontSize: 13,
    marginLeft: 7,
  },

  total: {
    color: palette.accent,
    fontSize: 18,
    fontWeight: "900",
  },

  date: {
    color: palette.gray,
    fontSize: 12,
    marginTop: 8,
  },

  cardActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },

  detailButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    backgroundColor: palette.muted,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: palette.border,
  },

  detailButtonText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: "800",
  },

  openTableButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    backgroundColor: palette.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  openTableButtonText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: "800",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.successBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  emptyTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    color: palette.gray,
    fontSize: 13,
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
    gap: 8,
  },

  goTablesButtonText: {
    color: palette.white,
    fontWeight: "800",
    fontSize: 13,
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
    color: palette.white,
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
    borderWidth: 1,
    borderColor: palette.border,
  },

  drawerItemActive: {
    backgroundColor: palette.muted,
    borderLeftWidth: 4,
    borderLeftColor: palette.accent,
  },

  drawerItemText: {
    flex: 1,
    marginLeft: 14,
    color: palette.text,
    fontSize: 15,
    fontWeight: "bold",
  },

  drawerCountBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.warning,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },

  drawerCountText: {
    color: palette.white,
    fontSize: 11,
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
    borderWidth: 1,
    borderColor: palette.border,
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

  detailPendingValue: {
    color: palette.warning,
    fontSize: 13,
    fontWeight: "900",
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
    borderWidth: 1,
    borderColor: palette.border,
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

  detailItemNote: {
    color: palette.warning,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
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
    marginBottom: 13,
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

  detailOpenButton: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: palette.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },

  detailOpenButtonText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "800",
  },
});
