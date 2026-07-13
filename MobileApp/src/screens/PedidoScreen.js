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
import { colors } from "../theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { API_BASE_URL } from "../services/config";

const PRODUCTS_URL = `${API_BASE_URL}/api/inventory/products/`;
const ORDERS_URL = `${API_BASE_URL}/api/orders/orders/`;
const ORDER_OWNERS_STORAGE_KEY = "orderOwnersById";
const ORDER_ITEMS_URL = `${API_BASE_URL}/api/orders/order-items/`;
const TABLES_URL = `${API_BASE_URL}/api/tables/`;

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
  info: colors.info ?? "#065084",
  infoBackground:
    colors.infoBackground ?? "#E0F2FE",

  white: colors.white ?? "#FFFFFF",
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

  const [loading, setLoading] = useState(true);
  const [cargandoPedidoActual, setCargandoPedidoActual] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [vista, setVista] = useState("productos");
  const [actualizandoMenu, setActualizandoMenu] = useState(false);

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
      order?.employee_id;

    if (
      typeof usuarioOrden === "object" &&
      usuarioOrden !== null
    ) {
      return (
        usuarioOrden.id ??
        usuarioOrden.user_id ??
        usuarioOrden.pk ??
        null
      );
    }

    return usuarioOrden ?? null;
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
    const propietariosLocales = await leerPropietariosLocales();

    console.log("========== BUSCAR ORDEN PENDIENTE ==========");
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

    console.log("ORDENES NORMALIZADAS:", ordenes);

    const ordenPendienteEncontrada = ordenes.find((order) => {
      const mesaOrden =
        order.table?.id ??
        order.table ??
        order.mesa?.id ??
        order.mesa ??
        order.table_id;

      const usuarioBackend = obtenerIdUsuarioOrden(order);
      const usuarioLocal =
        propietariosLocales[String(order.id)] ?? null;

      const usuarioOrden =
        usuarioBackend ?? usuarioLocal;

      const coincideMesa =
        Number(mesaOrden) === Number(mesa.id);

      const estaPendiente =
        String(order.status || "").toLowerCase() ===
        "pendiente";

      const perteneceAlUsuario =
        usuarioOrden !== null &&
        usuarioOrden !== undefined &&
        String(usuarioOrden) === String(sesion.userId);

      const esOrdenActivaSinPropietario =
        !usuarioOrden &&
        mesa?.activeOrderId &&
        Number(order.id) === Number(mesa.activeOrderId);

      return (
        coincideMesa &&
        estaPendiente &&
        (perteneceAlUsuario || esOrdenActivaSinPropietario)
      );
    });

    if (
      ordenPendienteEncontrada &&
      !obtenerIdUsuarioOrden(ordenPendienteEncontrada) &&
      !propietariosLocales[
        String(ordenPendienteEncontrada.id)
      ]
    ) {
      await guardarPropietarioLocal(
        ordenPendienteEncontrada.id,
        sesion.userId
      );
    }

    console.log(
      "ORDEN PENDIENTE DEL USUARIO:",
      ordenPendienteEncontrada
    );
    console.log("===========================================");

    return ordenPendienteEncontrada || null;
  };

  const cargarPedidoPendiente = async (productosDisponibles) => {
    try {
      setCargandoPedidoActual(true);

      const orden = await buscarOrdenPendienteDeMesa();

      if (!orden) {
        setOrdenPendiente(null);
        setPedidoActual([]);
        return;
      }

      let ordenConDetalle = orden;

      if (!Array.isArray(orden.items)) {
        try {
          ordenConDetalle = await obtenerDetalleOrden(orden.id);
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
      console.log("Error cargando pedido pendiente:", error);
      setOrdenPendiente(null);
      setPedidoActual([]);
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
  }, [])
);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find(
        (item) => item.producto.id === producto.id
      );

      if (existe) {
        return prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }

      return [...prev, { producto, cantidad: 1, notas: "" }];
    });
  };

  const cambiarCantidad = (productoId, delta) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.producto.id === productoId
            ? { ...item, cantidad: item.cantidad + delta }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const actualizarNota = (productoId, nota) => {
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
    if (carrito.length === 0) {
      Alert.alert(
        "Sin productos nuevos",
        "Agrega al menos un producto antes de enviar."
      );
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
              const headers = await getAuthHeaders();

              let orden = await buscarOrdenPendienteDeMesa();

              if (!orden) {
                const sesion = await obtenerSesionActual();
                const userIdNumerico = Number(sesion.userId);

                const orderData = {
                  table: mesa.id,
                  customer_name: mesa.customerName || "",

                  // Se envían los nombres más comunes para que el
                  // serializer use el campo que exista en el backend.
                  created_by: userIdNumerico,
                  user: userIdNumerico,
                  waiter: userIdNumerico,
                };

                console.log("========== CREAR ORDEN ==========");
                console.log("URL CREAR ORDEN:", ORDERS_URL);
                console.log(
                  "USUARIO QUE CREA LA ORDEN:",
                  sesion.userId
                );
                console.log("PAYLOAD ORDEN:", orderData);

                const orderResponse = await fetch(ORDERS_URL, {
                  method: "POST",
                  headers,
                  body: JSON.stringify(orderData),
                });

                const orderDataResponse = await parseJsonResponse(
                  orderResponse,
                  "CREAR ORDEN"
                );

                if (!orderResponse.ok) {
                  throw new Error(
                    JSON.stringify(orderDataResponse)
                  );
                }

                orden = orderDataResponse;

                await guardarPropietarioLocal(
                  orden.id,
                  sesion.userId
                );

                const usuarioDevuelto =
                  obtenerIdUsuarioOrden(orden);

                console.log("ORDEN CREADA COMPLETA:", orden);
                console.log(
                  "USUARIO DEVUELTO POR BACKEND:",
                  usuarioDevuelto
                );

                if (!usuarioDevuelto) {
                  console.log(
                    "AVISO: el backend no devolvió propietario; " +
                      "se usará el respaldo local orderOwnersById."
                  );
                }
              } else {
                const sesion = await obtenerSesionActual();

                await guardarPropietarioLocal(
                  orden.id,
                  sesion.userId
                );
              }

              for (const item of carrito) {
                const orderItemData = {
                  order: orden.id,
                  product: item.producto.id,
                  quantity: item.cantidad,
                };

                console.log("========== CREAR ITEM ==========");
                console.log("URL CREAR ITEM:", ORDER_ITEMS_URL);
                console.log("PAYLOAD ITEM:", orderItemData);

                const itemResponse = await fetch(ORDER_ITEMS_URL, {
                  method: "POST",
                  headers,
                  body: JSON.stringify(orderItemData),
                });

                const itemCreated = await parseJsonResponse(
                  itemResponse,
                  "CREAR ITEM"
                );

                if (!itemResponse.ok) {
                  throw new Error(JSON.stringify(itemCreated));
                }
              }

              await marcarMesaOcupada();

              setCarrito([]);

              await cargarPedidoPendiente(productos);

              setVista("carrito");

              Alert.alert(
                "Pedido registrado",
                "Los productos fueron agregados correctamente a la mesa."
              );
            } catch (error) {
              console.log("Error enviando pedido:", error);
              Alert.alert(
                "Error",
                "No se pudo registrar el pedido. Revisa la consola para ver el detalle del backend."
              );
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
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  const categorias = [
    ...new Set(productos.map((producto) => producto.categoria)),
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
                producto.subcategoria || "Sin subcategoría"
            )
        ),
      ]
    : [];

  const productosFiltrados =
    categoriaSeleccionada && subcategoriaSeleccionada
      ? productos.filter(
          (producto) =>
            producto.categoria === categoriaSeleccionada &&
            (producto.subcategoria || "Sin subcategoría") ===
              subcategoriaSeleccionada
        )
      : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Mesas</Text>
        </TouchableOpacity>

<View style={styles.headerCenter}>
  <Text style={styles.headerTitle}>Mesa {getMesaNumber()}</Text>

  {ordenPendiente && (
    <Text style={styles.pedidoBadge}>
      Pedido #{ordenPendiente.id}
    </Text>
  )}
</View>

<TouchableOpacity
  style={[
    styles.actualizarMenuBtn,
    actualizandoMenu && styles.actualizarMenuBtnDisabled,
  ]}
  onPress={() => cargarProductos(false)}
  disabled={actualizandoMenu}
>
  <Text style={styles.actualizarMenuText}>
    {actualizandoMenu ? "..." : "Actualizar"}
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.carritoBtn}
  onPress={() =>
    setVista(
      vista === "productos" ? "carrito" : "productos"
    )
  }
>
          <Text style={styles.carritoText}>
            {vista === "productos"
              ? `🛒 ${cantidadTotal}`
              : "← Productos"}
          </Text>
        </TouchableOpacity>
      </View>

      {vista === "productos" && (
        <View style={{ flex: 1 }}>
          {!categoriaSeleccionada && (
            <FlatList
              data={categorias}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoriaCard}
                  onPress={() => {
                    setCategoriaSeleccionada(item);
                    setSubcategoriaSeleccionada(null);
                  }}
                >
                  <Text style={styles.categoriaNombre}>{item}</Text>
                  <Text style={styles.categoriaHint}>
                    Ver subcategorías →
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No hay categorías disponibles.
                </Text>
              }
            />
          )}

          {categoriaSeleccionada &&
            !subcategoriaSeleccionada && (
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={styles.volverNivelBtn}
                  onPress={() => {
                    setCategoriaSeleccionada(null);
                    setSubcategoriaSeleccionada(null);
                  }}
                >
                  <Text style={styles.volverNivelText}>
                    ← Categorías
                  </Text>
                </TouchableOpacity>

                <FlatList
                  data={subcategorias}
                  keyExtractor={(item) => item}
                  contentContainerStyle={styles.list}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.categoriaCard}
                      onPress={() =>
                        setSubcategoriaSeleccionada(item)
                      }
                    >
                      <Text style={styles.categoriaNombre}>
                        {item}
                      </Text>
                      <Text style={styles.categoriaHint}>
                        Ver productos →
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

          {categoriaSeleccionada &&
            subcategoriaSeleccionada && (
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={styles.volverNivelBtn}
                  onPress={() =>
                    setSubcategoriaSeleccionada(null)
                  }
                >
                  <Text style={styles.volverNivelText}>
                    ← {categoriaSeleccionada}
                  </Text>
                </TouchableOpacity>

                <FlatList
                  data={productosFiltrados}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={styles.list}
                  renderItem={({ item }) => {
                    const enCarrito = carrito.find(
                      (carritoItem) =>
                        carritoItem.producto.id === item.id
                    );

                    return (
                      <View style={styles.productoCard}>
                        <View style={styles.productoInfo}>
                          <Text style={styles.productoNombre}>
                            {item.nombre}
                          </Text>

                          <Text style={styles.productoPrecio}>
                            Bs. {item.precio.toFixed(2)}
                          </Text>

                          <Text style={styles.productoCategoria}>
                            {item.categoria}
                          </Text>

                          {item.subcategoria ? (
                            <Text
                              style={
                                styles.productoSubcategoria
                              }
                            >
                              {item.subcategoria}
                            </Text>
                          ) : null}
                        </View>

                        {enCarrito ? (
                          <View style={styles.cantidadControl}>
                            <TouchableOpacity
                              onPress={() =>
                                cambiarCantidad(item.id, -1)
                              }
                              style={styles.ctrlBtn}
                            >
                              <Text style={styles.ctrlBtnText}>
                                −
                              </Text>
                            </TouchableOpacity>

                            <Text style={styles.cantidadNum}>
                              {enCarrito.cantidad}
                            </Text>

                            <TouchableOpacity
                              onPress={() =>
                                cambiarCantidad(item.id, 1)
                              }
                              style={styles.ctrlBtn}
                            >
                              <Text style={styles.ctrlBtnText}>
                                +
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() =>
                              agregarAlCarrito(item)
                            }
                          >
                            <Text style={styles.addBtnText}>
                              Agregar
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  }}
                />
              </View>
            )}
        </View>
      )}

      {vista === "carrito" && (
        <ScrollView contentContainerStyle={styles.list}>
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
            <View style={styles.pedidoActualBox}>
              <Text style={styles.sectionTitle}>
                Pedido actual
              </Text>

              <Text style={styles.sectionSubtitle}>
                Orden pendiente #{ordenPendiente?.id}
              </Text>

              {pedidoActual.map((item) => (
                <View
                  key={`actual-${item.id}`}
                  style={styles.pedidoActualItem}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pedidoActualNombre}>
                      {item.producto.nombre}
                    </Text>

                    <Text style={styles.pedidoActualCantidad}>
                      {item.cantidad} unidad(es)
                    </Text>
                  </View>

                  <Text style={styles.pedidoActualPrecio}>
                    Bs.{" "}
                    {(item.precio * item.cantidad).toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={styles.pedidoActualTotalRow}>
                <Text style={styles.pedidoActualTotalLabel}>
                  Total actual
                </Text>

                <Text style={styles.pedidoActualTotalValue}>
                  Bs. {totalPedidoActual.toFixed(2)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.sinPedidoBox}>
              <Text style={styles.sinPedidoText}>
                Esta mesa todavía no tiene productos registrados.
              </Text>
            </View>
          )}

          {carrito.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Productos por agregar
              </Text>

              {carrito.map((item) => (
                <View
                  key={`nuevo-${item.producto.id}`}
                  style={styles.carritoItem}
                >
                  <View style={styles.carritoItemTop}>
                    <Text style={styles.carritoNombre}>
                      {item.producto.nombre}
                    </Text>

                    <View style={styles.cantidadControl}>
                      <TouchableOpacity
                        onPress={() =>
                          cambiarCantidad(
                            item.producto.id,
                            -1
                          )
                        }
                        style={styles.ctrlBtn}
                      >
                        <Text style={styles.ctrlBtnText}>−</Text>
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
                        style={styles.ctrlBtn}
                      >
                        <Text style={styles.ctrlBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.carritoSubtotal}>
                    Bs.{" "}
                    {(
                      item.producto.precio * item.cantidad
                    ).toFixed(2)}
                  </Text>

                  <TextInput
                    style={styles.notaInput}
                    placeholder="Nota (ej: sin cebolla)"
                    placeholderTextColor={palette.placeholder}
                    value={item.notas}
                    onChangeText={(texto) =>
                      actualizarNota(item.producto.id, texto)
                    }
                  />
                </View>
              ))}
            </>
          )}

          {(pedidoActual.length > 0 || carrito.length > 0) && (
            <View style={styles.totalBox}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>
                  Pedido actual
                </Text>
                <Text style={styles.totalValue}>
                  Bs. {totalPedidoActual.toFixed(2)}
                </Text>
              </View>

              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>
                  Por agregar
                </Text>
                <Text style={styles.totalValue}>
                  Bs. {totalCarrito.toFixed(2)}
                </Text>
              </View>

              <View style={styles.totalGeneralLine}>
                <Text style={styles.totalGeneralLabel}>
                  Total de la mesa
                </Text>
                <Text style={styles.totalGeneralValue}>
                  Bs. {totalGeneral.toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {pedidoActual.length === 0 && carrito.length === 0 && (
            <Text style={styles.emptyText}>
              El pedido está vacío.
            </Text>
          )}
        </ScrollView>
      )}

      {vista === "carrito" && carrito.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.enviarBtn,
              enviando && styles.btnDisabled,
            ]}
            onPress={enviarPedido}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <Text style={styles.enviarBtnText}>
                {ordenPendiente
                  ? "Agregar al pedido"
                  : "Enviar pedido"}
              </Text>
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
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.background,
  },

  header: {
    backgroundColor: palette.primary,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 4,
    borderBottomColor: palette.accent,
    elevation: 4,
  },

  backBtn: {
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: palette.dark,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.light,
  },

  backText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "700",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
  },

  headerTitle: {
    color: palette.white,
    fontSize: 20,
    fontWeight: "800",
  },

  pedidoBadge: {
    color: palette.light,
    fontSize: 11,
    marginTop: 3,
    fontWeight: "600",
  },

  carritoBtn: {
    backgroundColor: palette.accent,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    minWidth: 72,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.light,
  },

  actualizarMenuBtn: {
    backgroundColor: palette.light,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 18,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: palette.white,
  },

  actualizarMenuBtnDisabled: {
    opacity: 0.6,
  },

  actualizarMenuText: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  carritoText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: "700",
  },

  list: {
    padding: 16,
    paddingBottom: 24,
  },

  categoriaCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 5,
    borderLeftColor: palette.accent,
    elevation: 2,
  },

  categoriaNombre: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.text,
  },

  categoriaHint: {
    fontSize: 13,
    color: palette.primary,
    marginTop: 5,
    fontWeight: "600",
  },

  volverNivelBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: palette.muted,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },

  volverNivelText: {
    color: palette.primary,
    fontWeight: "800",
  },

  productoCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: palette.border,
    elevation: 1,
  },

  productoInfo: {
    flex: 1,
    marginRight: 10,
  },

  productoNombre: {
    fontSize: 17,
    fontWeight: "800",
    color: palette.text,
  },

  productoPrecio: {
    fontSize: 15,
    color: palette.accent,
    marginTop: 5,
    fontWeight: "800",
  },

  productoCategoria: {
    fontSize: 13,
    color: palette.textSecondary,
    marginTop: 3,
  },

  productoSubcategoria: {
    fontSize: 12,
    color: palette.gray,
    marginTop: 2,
  },

  addBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },

  addBtnText: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 13,
  },

  cantidadControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  ctrlBtn: {
    backgroundColor: palette.muted,
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },

  ctrlBtnText: {
    fontSize: 19,
    color: palette.dark,
    fontWeight: "bold",
  },

  cantidadNum: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.dark,
    minWidth: 22,
    textAlign: "center",
  },

  loadingPedidoBox: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },

  loadingPedidoText: {
    marginTop: 8,
    color: palette.gray,
  },

  pedidoActualBox: {
    backgroundColor: palette.muted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.light,
    padding: 15,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: palette.text,
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: palette.accent,
    marginBottom: 12,
    fontWeight: "700",
  },

  pedidoActualItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },

  pedidoActualNombre: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
  },

  pedidoActualCantidad: {
    color: palette.gray,
    fontSize: 12,
    marginTop: 2,
  },

  pedidoActualPrecio: {
    color: palette.accent,
    fontWeight: "800",
    fontSize: 14,
  },

  pedidoActualTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13,
  },

  pedidoActualTotalLabel: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: "800",
  },

  pedidoActualTotalValue: {
    color: palette.accent,
    fontSize: 17,
    fontWeight: "800",
  },

  sinPedidoBox: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },

  sinPedidoText: {
    color: palette.gray,
    textAlign: "center",
  },

  carritoItem: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 15,
    marginBottom: 11,
    elevation: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 4,
    borderLeftColor: palette.primary,
  },

  carritoItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  carritoNombre: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.text,
    flex: 1,
    marginRight: 10,
  },

  carritoSubtotal: {
    fontSize: 14,
    color: palette.accent,
    marginBottom: 9,
    fontWeight: "700",
  },

  notaInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: palette.text,
    backgroundColor: palette.background,
  },

  totalBox: {
    backgroundColor: palette.card,
    borderRadius: 15,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },

  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  totalLabel: {
    fontSize: 14,
    color: palette.textSecondary,
  },

  totalValue: {
    fontSize: 14,
    color: palette.text,
    fontWeight: "800",
  },

  totalGeneralLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 13,
    marginTop: 4,
  },

  totalGeneralLabel: {
    fontSize: 16,
    color: palette.primary,
    fontWeight: "800",
  },

  totalGeneralValue: {
    fontSize: 19,
    color: palette.accent,
    fontWeight: "800",
  },

  footer: {
    padding: 16,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderColor: palette.border,
  },

  enviarBtn: {
    backgroundColor: palette.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.light,
    elevation: 2,
  },

  btnDisabled: {
    opacity: 0.6,
  },

  enviarBtnText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "800",
  },

  emptyText: {
    textAlign: "center",
    color: palette.gray,
    marginTop: 40,
    fontSize: 15,
  },
});
