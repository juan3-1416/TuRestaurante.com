import React, { useCallback, useEffect, useState } from "react";
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

const API_BASE_URL = "http://192.168.0.22:8000";
const ORDERS_URL = `${API_BASE_URL}/api/orders/orders/`;
const PRODUCTS_URL = `${API_BASE_URL}/api/inventory/products/`;

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

const cargarPerfil = async () => {
try {
const nombreGuardado = await AsyncStorage.getItem("userName");
const correoGuardado = await AsyncStorage.getItem("userEmail");


  setUserName(nombreGuardado || "Administrador");
  setUserEmail(correoGuardado || "Sesión activa");
} catch (error) {
  console.log("Error cargando perfil:", error);
}


};

const cargarDatos = async () => {
try {
setLoading(true);


  const headers = await getAuthHeaders();

  const [productosResponse, ordenesResponse] = await Promise.all([
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
  console.log("ORDENES BACKEND:", ordenesData);

  if (!productosResponse.ok) {
    throw new Error(JSON.stringify(productosData));
  }

  if (!ordenesResponse.ok) {
    throw new Error(JSON.stringify(ordenesData));
  }

  const listaProductos = Array.isArray(productosData)
    ? productosData
    : productosData.results || [];

  const productosAdaptados = listaProductos.map((producto) => ({
    id: producto.id,
    nombre: producto.name || producto.nombre || `Producto #${producto.id}`,
    precio: Number(producto.price || producto.precio || 0),
  }));

  const listaOrdenes = Array.isArray(ordenesData)
    ? ordenesData
    : ordenesData.results || [];

  const ordenesOrdenadas = [...listaOrdenes].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  setProductos(productosAdaptados);
  setOrdenes(ordenesOrdenadas);
} catch (error) {
  console.log("Error cargando historial:", error);
  Alert.alert("Error", "No se pudo cargar el historial de órdenes.");
} finally {
  setLoading(false);
}


};

useEffect(() => {
cargarPerfil();
}, []);

useFocusEffect(
useCallback(() => {
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
"userName",
"userEmail",
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
            <Icon name="x" size={24} color="#FFFFFF" />
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
            <Icon name="grid" size={21} color="#4C1D95" />
            <Text style={styles.drawerItemText}>Mapa de mesas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.drawerItem, styles.drawerItemActive]}
            onPress={() => setMenuVisible(false)}
          >
            <Icon name="clock" size={21} color="#4C1D95" />
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
            <Icon name="log-out" size={20} color="#DC2626" />
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
    onRequestClose={() => setDetalleVisible(false)}
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
            onPress={() => setDetalleVisible(false)}
          >
            <Icon name="x" size={22} color="#4C1D95" />
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
        <Icon name="menu" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Historial de órdenes</Text>

      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={cargarDatos}
        disabled={loading}
      >
        <Icon name="refresh-cw" size={21} color="#4C1D95" />
      </TouchableOpacity>
    </View>

    {loading ? (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4C1D95" />
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
            No hay órdenes registradas.
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
backgroundColor: "#F1F5F9",
},

topBar: {
flexDirection: "row",
alignItems: "center",
backgroundColor: "#FFFFFF",
paddingHorizontal: 15,
paddingTop: 15,
paddingBottom: 15,
elevation: 2,
},

menuBtn: {
width: 44,
height: 44,
borderRadius: 12,
backgroundColor: "#4C1D95",
alignItems: "center",
justifyContent: "center",
},

headerTitle: {
flex: 1,
marginLeft: 12,
fontSize: 20,
fontWeight: "bold",
color: "#4C1D95",
},

refreshBtn: {
width: 44,
height: 44,
borderRadius: 12,
backgroundColor: "#EDE9FE",
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
color: "#6B7280",
fontSize: 14,
},

list: {
padding: 16,
},

card: {
backgroundColor: "#FFFFFF",
borderRadius: 14,
padding: 16,
marginBottom: 12,
borderWidth: 1,
borderColor: "#E5E7EB",
},

cardHeader: {
flexDirection: "row",
justifyContent: "space-between",
alignItems: "center",
},

title: {
fontSize: 17,
fontWeight: "bold",
color: "#111827",
},

text: {
fontSize: 14,
color: "#374151",
marginTop: 6,
},

total: {
fontSize: 18,
fontWeight: "bold",
color: "#0F828C",
marginTop: 8,
},

date: {
fontSize: 12,
color: "#6B7280",
marginTop: 4,
},

itemsText: {
fontSize: 13,
color: "#6B7280",
marginTop: 6,
},

detalleHint: {
marginTop: 10,
color: "#4C1D95",
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
backgroundColor: "#FEF3C7",
color: "#92400E",
},

statusFinalizada: {
backgroundColor: "#DCFCE7",
color: "#166534",
},

emptyText: {
textAlign: "center",
marginTop: 40,
color: "#6B7280",
},

modalBackground: {
flex: 1,
backgroundColor: "rgba(15, 23, 42, 0.45)",
},

backdrop: {
...StyleSheet.absoluteFillObject,
},

drawer: {
width: "78%",
maxWidth: 330,
height: "100%",
backgroundColor: "#F8FAFC",
elevation: 12,
},

drawerHeader: {
backgroundColor: "#4C1D95",
alignItems: "center",
paddingTop: 48,
paddingBottom: 28,
paddingHorizontal: 18,
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
backgroundColor: "#FFFFFF",
alignItems: "center",
justifyContent: "center",
marginBottom: 12,
},

avatarText: {
color: "#4C1D95",
fontSize: 31,
fontWeight: "bold",
},

drawerName: {
color: "#FFFFFF",
fontSize: 19,
fontWeight: "bold",
},

drawerEmail: {
color: "#DDD6FE",
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
backgroundColor: "#FFFFFF",
paddingHorizontal: 16,
paddingVertical: 16,
borderRadius: 14,
marginBottom: 10,
},

drawerItemActive: {
backgroundColor: "#EDE9FE",
},

drawerItemText: {
marginLeft: 14,
color: "#1F2937",
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
backgroundColor: "#FEE2E2",
paddingVertical: 14,
borderRadius: 14,
},

logoutText: {
marginLeft: 10,
color: "#DC2626",
fontWeight: "bold",
fontSize: 15,
},

detailOverlay: {
flex: 1,
justifyContent: "flex-end",
backgroundColor: "rgba(15, 23, 42, 0.45)",
},

detailModal: {
maxHeight: "88%",
backgroundColor: "#F8FAFC",
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
backgroundColor: "#FFFFFF",
borderTopLeftRadius: 24,
borderTopRightRadius: 24,
},

detailTitle: {
fontSize: 21,
fontWeight: "bold",
color: "#4C1D95",
},

detailSubtitle: {
marginTop: 3,
fontSize: 14,
color: "#6B7280",
},

detailCloseBtn: {
width: 40,
height: 40,
borderRadius: 20,
alignItems: "center",
justifyContent: "center",
backgroundColor: "#EDE9FE",
},

detailContent: {
padding: 16,
},

detailInfoBox: {
backgroundColor: "#FFFFFF",
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
color: "#6B7280",
fontSize: 13,
},

detailValue: {
color: "#111827",
fontSize: 13,
fontWeight: "bold",
maxWidth: "62%",
textAlign: "right",
},

detailSectionTitle: {
color: "#111827",
fontSize: 17,
fontWeight: "bold",
marginBottom: 10,
},

detailItem: {
flexDirection: "row",
alignItems: "center",
backgroundColor: "#FFFFFF",
borderRadius: 12,
padding: 14,
marginBottom: 10,
},

detailItemInfo: {
flex: 1,
marginRight: 10,
},

detailItemName: {
color: "#111827",
fontSize: 15,
fontWeight: "bold",
},

detailItemMeta: {
color: "#6B7280",
fontSize: 13,
marginTop: 4,
},

detailItemSubtotal: {
color: "#0F828C",
fontSize: 14,
fontWeight: "bold",
},

detailEmpty: {
textAlign: "center",
color: "#6B7280",
marginTop: 12,
},

detailTotalBox: {
flexDirection: "row",
justifyContent: "space-between",
backgroundColor: "#EDE9FE",
padding: 16,
borderRadius: 14,
marginTop: 8,
marginBottom: 10,
},

detailTotalLabel: {
color: "#4C1D95",
fontSize: 16,
fontWeight: "bold",
},

detailTotalValue: {
color: "#4C1D95",
fontSize: 18,
fontWeight: "bold",
},
});
