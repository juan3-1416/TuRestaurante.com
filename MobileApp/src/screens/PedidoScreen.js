// src/screens/PedidoScreen.js
import React, { useEffect, useState } from "react";
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

const API_BASE_URL = "http://192.168.0.10:8000";

const PRODUCTS_URL = `${API_BASE_URL}/api/inventory/products/`;
const ORDERS_URL = `${API_BASE_URL}/api/orders/orders/`;
const ORDER_ITEMS_URL = `${API_BASE_URL}/api/orders/order-items/`;
const TABLES_URL = `${API_BASE_URL}/api/tables/`;

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

    console.log("========== BUSCAR ORDEN PENDIENTE ==========");
    console.log("ORDERS_URL:", ORDERS_URL);
    console.log("MESA ACTUAL:", mesa);

    const response = await fetch(ORDERS_URL, {
      method: "GET",
      headers,
    });

    const data = await parseJsonResponse(response, "ORDENES BACKEND");

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

      return (
        Number(mesaOrden) === Number(mesa.id) &&
        order.status === "Pendiente"
      );
    });

    console.log("ORDEN PENDIENTE ENCONTRADA:", ordenPendienteEncontrada);
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

  const cargarProductos = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      console.log("========== CARGAR PRODUCTOS ==========");
      console.log("PRODUCTS_URL:", PRODUCTS_URL);

      const response = await fetch(PRODUCTS_URL, {
        method: "GET",
        headers,
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

      await cargarPedidoPendiente(productosAdaptados);
    } catch (error) {
      console.log("Error cargando productos:", error);
      Alert.alert("Error", "No se pudo cargar el menú del backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

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
                const orderData = {
                  table: mesa.id,
                  customer_name: mesa.customerName || "",
                };

                console.log("========== CREAR ORDEN ==========");
                console.log("URL CREAR ORDEN:", ORDERS_URL);
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
                  throw new Error(JSON.stringify(orderDataResponse));
                }

                orden = orderDataResponse;
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
        <ActivityIndicator size="large" color={colors.primary} />
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
                color={colors.primary}
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
                    placeholderTextColor="#9CA3AF"
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
              <ActivityIndicator color={colors.white} />
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
    backgroundColor: colors.lightGray,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    backgroundColor: colors.dark,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    padding: 4,
  },

  backText: {
    color: colors.secondary,
    fontSize: 14,
  },

  headerCenter: {
    alignItems: "center",
  },

  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },

  pedidoBadge: {
    color: "#DDD6FE",
    fontSize: 11,
    marginTop: 2,
  },

  carritoBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  carritoText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },

  list: {
    padding: 16,
  },

  categoriaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  categoriaNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },

  categoriaHint: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  volverNivelBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  volverNivelText: {
    color: "#374151",
    fontWeight: "bold",
  },

  productoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  productoInfo: {
    flex: 1,
    marginRight: 10,
  },

  productoNombre: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
  },

  productoPrecio: {
    fontSize: 15,
    color: "#0F828C",
    marginTop: 4,
    fontWeight: "600",
  },

  productoCategoria: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  productoSubcategoria: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },

  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  addBtnText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 13,
  },

  cantidadControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  ctrlBtn: {
    backgroundColor: colors.lightGray,
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  ctrlBtnText: {
    fontSize: 18,
    color: colors.dark,
    fontWeight: "bold",
  },

  cantidadNum: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.dark,
    minWidth: 20,
    textAlign: "center",
  },

  loadingPedidoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },

  loadingPedidoText: {
    marginTop: 8,
    color: "#6B7280",
  },

  pedidoActualBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 14,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#047857",
    marginBottom: 12,
  },

  pedidoActualItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
  },

  pedidoActualNombre: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },

  pedidoActualCantidad: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },

  pedidoActualPrecio: {
    color: "#047857",
    fontWeight: "bold",
    fontSize: 14,
  },

  pedidoActualTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  pedidoActualTotalLabel: {
    color: "#065F46",
    fontSize: 15,
    fontWeight: "bold",
  },

  pedidoActualTotalValue: {
    color: "#047857",
    fontSize: 16,
    fontWeight: "bold",
  },

  sinPedidoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  sinPedidoText: {
    color: "#6B7280",
    textAlign: "center",
  },

  carritoItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },

  carritoItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  carritoNombre: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 10,
  },

  carritoSubtotal: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
  },

  notaInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#111827",
    backgroundColor: colors.lightGray,
  },

  totalBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },

  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  totalLabel: {
    fontSize: 14,
    color: "#4B5563",
  },

  totalValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "bold",
  },

  totalGeneralLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    marginTop: 4,
  },

  totalGeneralLabel: {
    fontSize: 16,
    color: colors.dark,
    fontWeight: "bold",
  },

  totalGeneralValue: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: "bold",
  },

  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: "#EEEEEE",
  },

  enviarBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },

  btnDisabled: {
    opacity: 0.6,
  },

  enviarBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    color: colors.secondary,
    marginTop: 40,
    fontSize: 15,
  },
});