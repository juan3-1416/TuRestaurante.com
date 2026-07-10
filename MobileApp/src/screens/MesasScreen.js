import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { colors } from "../theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

// Ejemplo:
const API_URL = "http://192.168.0.10:8000/api/tables/tables/";

export default function MesasScreen({ navigation }) {
  const [filter, setFilter] = useState("Todas");
  const [tables, setTables] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState("Administrador");
  const [userEmail, setUserEmail] = useState("Sesión activa");

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

  const cargarMesas = async () => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(API_URL, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      const mesasOrdenadas = data.sort(
        (a, b) => Number(a.number) - Number(b.number)
      );

      setTables(mesasOrdenadas);
    } catch (error) {
      console.log("Error al cargar mesas:", error);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarMesas();
    }, [])
  );

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

      const data = await response.json();

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
    }
  };

  const crearMesa = async () => {
    try {
      const headers = await getAuthHeaders();

      const siguienteNumero =
        tables.length > 0
          ? Math.max(...tables.map((mesa) => Number(mesa.number))) + 1
          : 1;

      const nuevaMesa = {
        table_number: String(siguienteNumero),
        number: String(siguienteNumero),
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

      if (!response.ok) {
        throw new Error(text);
      }

      const mesaCreada = JSON.parse(text);

      setTables((prevTables) =>
        [...prevTables, mesaCreada].sort(
          (a, b) => Number(a.number) - Number(b.number)
        )
      );
    } catch (error) {
      console.log("Error creando mesa:", error);
    }
  };

  const eliminarMesa = async (id) => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error("Error al eliminar mesa");
      }

      setTables((prevTables) =>
        prevTables.filter((mesa) => mesa.id !== id)
      );
    } catch (error) {
      console.log("Error eliminando mesa:", error);
    }
  };

  const filtered =
    filter === "Todas"
      ? tables
      : tables.filter((table) => table.status === filter);

  const getStyles = (status) => {
    switch (status) {
      case "Libre":
        return { color: "#22C55E", icon: "check-circle" };
      case "Ocupada":
        return { color: "#EF4444", icon: "dollar-sign" };
      case "Reservada":
        return { color: "#EAB308", icon: "clock" };
      default:
        return { color: "#6B7280", icon: "circle" };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStyles(item.status);

    return (
      <View style={[styles.card, { borderColor: statusStyle.color }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Pedido", { mesa: item })}
        >
          <View
            style={[styles.dot, { backgroundColor: statusStyle.color }]}
          />

          <View style={styles.row}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: statusStyle.color + "20" },
              ]}
            >
              <Icon
                name={statusStyle.icon}
                size={20}
                color={statusStyle.color}
              />
            </View>

            <View>
              <Text style={styles.title}>Mesa {item.number}</Text>
              <Text style={styles.sub}>{item.capacity} personas</Text>
            </View>
          </View>

          {item.customerName ? (
            <View style={styles.clientBox}>
              <Text style={styles.clientLabel}>Cliente</Text>
              <Text style={styles.client}>{item.customerName}</Text>
            </View>
          ) : (
            <Text style={styles.empty}>Sin Reservar</Text>
          )}

          <View style={styles.footer}>
            {item.status === "Ocupada" && (
              <Text style={styles.total}>Bs. {item.currentTotal}</Text>
            )}

            {item.status === "Reservada" && (
              <Text style={styles.time}>{item.activeTime}</Text>
            )}

            {item.status === "Libre" && (
              <Text style={styles.available}>Disponible</Text>
            )}

            <Icon name="play" size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() =>
            updateTableCapacity(item.id, Number(item.capacity) + 1)
          }
        >
          <Text style={styles.editText}>
            + Capacidad Mesa {item.number}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => eliminarMesa(item.id)}
        >
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => setMenuVisible(false)}
              >
                <Icon name="grid" size={21} color="#4C1D95" />
                <Text style={styles.drawerItemText}>Mapa de mesas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={irHistorial}
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

      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuVisible(true)}
          >
            <Icon name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Mesas</Text>

          <TouchableOpacity style={styles.addMesaBtn} onPress={crearMesa}>
            <Text style={styles.addMesaText}>+ Mesa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {["Todas", "Libre", "Ocupada", "Reservada"].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item)}
              style={[
                styles.filter,
                filter === item && styles.activeFilter,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && { color: "#FFFFFF" },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    padding: 15,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#4C1D95",
    alignItems: "center",
    justifyContent: "center",
  },

  pageTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 22,
    fontWeight: "bold",
    color: "#4C1D95",
  },

  addMesaBtn: {
    backgroundColor: "#4C1D95",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  addMesaText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  filters: {
    flexDirection: "row",
    marginBottom: 15,
  },

  filter: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
  },

  activeFilter: {
    backgroundColor: "#4C1D95",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F2937",
  },

  card: {
    width: "48%",
    padding: 15,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    marginBottom: 15,
  },

  dot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconBox: {
    padding: 10,
    borderRadius: 15,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },

  sub: {
    fontSize: 11,
    color: "#6B7280",
  },

  clientBox: {
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 15,
    marginTop: 10,
  },

  clientLabel: {
    fontSize: 10,
    color: "#9CA3AF",
  },

  client: {
    fontWeight: "bold",
    color: "#111827",
  },

  empty: {
    marginTop: 10,
    fontStyle: "italic",
    color: "#9CA3AF",
  },

  footer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  total: {
    fontWeight: "bold",
    color: "#2563EB",
  },

  time: {
    color: "#CA8A04",
  },

  available: {
    color: "#22C55E",
    fontWeight: "bold",
  },

  editBtn: {
    marginTop: 10,
    backgroundColor: "#DBEAFE",
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
  },

  editText: {
    color: "#2563EB",
    fontWeight: "bold",
    fontSize: 12,
  },

  deleteBtn: {
    marginTop: 10,
    backgroundColor: "#FEE2E2",
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
  },

  deleteText: {
    color: "#DC2626",
    fontWeight: "bold",
    fontSize: 12,
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
    gap: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 10,
  },

  drawerItemText: {
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
    gap: 10,
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 14,
  },

  logoutText: {
    color: "#DC2626",
    fontWeight: "bold",
    fontSize: 15,
  },
});