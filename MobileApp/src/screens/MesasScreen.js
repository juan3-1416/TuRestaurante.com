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
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { colors } from "../theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const API_URL = "http://192.168.0.10:8000/api/tables/";
const USERS_URL = "http://192.168.0.10:8000/api/users/";

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
  overlay:
    colors.overlay ?? "rgba(15, 23, 42, 0.45)",
};

export default function MesasScreen({ navigation }) {
  const [filter, setFilter] = useState("Todas");
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState("Administrador");
  const [userEmail, setUserEmail] = useState("Sesión activa");

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

  const filtered =
    filter === "Todas"
      ? tables
      : tables.filter((table) => table.status === filter);

  const getStyles = (status) => {
    switch (status) {
      case "Libre":
        return {
          color: palette.success,
          icon: "check-circle",
        };
      case "Ocupada":
        return {
          color: palette.danger,
          icon: "users",
        };
      case "Reservada":
        return {
          color: palette.warning,
          icon: "clock",
        };
      case "Pedido":
        return {
          color: palette.accent,
          icon: "shopping-cart",
        };
      default:
        return {
          color: palette.gray,
          icon: "circle",
        };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStyles(item.status);
    const numeroMesa = getTableNumber(item);

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
              <Text style={styles.title}>Mesa {numeroMesa}</Text>
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
              <Text style={styles.total}>Bs. {item.currentTotal || 0}</Text>
            )}

            {item.status === "Reservada" && (
              <Text style={styles.time}>{item.activeTime || "Reservada"}</Text>
            )}

            {item.status === "Libre" && (
              <Text style={styles.available}>Disponible</Text>
            )}

            {item.status === "Pedido" && (
              <Text style={styles.orderText}>Pedido activo</Text>
            )}

            <Icon name="play" size={16} color={palette.primary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() =>
            updateTableCapacity(item.id, Number(item.capacity) + 1)
          }
        >
          <Text style={styles.editText}>
            + Capacidad Mesa {numeroMesa}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deleteBtn,
            !puedeEliminarMesa(item) && styles.deleteBtnDisabled,
          ]}
          onPress={() => confirmarEliminarMesa(item)}
        >
          <Text
            style={[
              styles.deleteText,
              !puedeEliminarMesa(item) && styles.deleteTextDisabled,
            ]}
          >
            Eliminar
          </Text>
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
              <TouchableOpacity
                style={[styles.drawerItem, styles.drawerItemActive]}
                onPress={() => setMenuVisible(false)}
              >
                <Icon name="grid" size={21} color={palette.primary} />
                <Text style={styles.drawerItemText}>Mapa de mesas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={irHistorial}
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

      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuVisible(true)}
          >
            <Icon name="menu" size={26} color={palette.white} />
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Mesas</Text>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={cargarMesas}
            disabled={loading}
          >
            <Icon name="refresh-cw" size={18} color={palette.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.addMesaBtn} onPress={crearMesa}>
            <Text style={styles.addMesaText}>+ Mesa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {["Todas", "Libre", "Ocupada", "Reservada", "Pedido"].map((item) => (
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
                  filter === item && { color: palette.white },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
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
            columnWrapperStyle={{ justifyContent: "space-between" }}
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
    padding: 15,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
    backgroundColor: palette.primary,
    borderRadius: 18,
    padding: 10,
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

  pageTitle: {
    flex: 1,
    marginLeft: 4,
    fontSize: 22,
    fontWeight: "bold",
    color: palette.white,
  },

  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: palette.light,
    alignItems: "center",
    justifyContent: "center",
  },

  addMesaBtn: {
    backgroundColor: palette.accent,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.light,
  },

  addMesaText: {
    color: palette.white,
    fontWeight: "bold",
  },

  filters: {
    flexDirection: "row",
    marginBottom: 15,
    flexWrap: "wrap",
    gap: 8,
  },

  filter: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.muted,
    borderWidth: 1,
    borderColor: palette.border,
  },

  activeFilter: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "bold",
    color: palette.text,
  },

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: palette.textSecondary,
    fontWeight: "bold",
  },

  emptyListBox: {
    paddingVertical: 40,
    alignItems: "center",
  },

  emptyListText: {
    color: palette.gray,
    fontWeight: "bold",
  },

  card: {
    width: "48%",
    padding: 15,
    borderRadius: 22,
    backgroundColor: palette.card,
    borderWidth: 2,
    marginBottom: 15,
    elevation: 2,
  },

  dot: {
    position: "absolute",
    top: 11,
    right: 11,
    width: 11,
    height: 11,
    borderRadius: 6,
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
    color: palette.text,
  },

  sub: {
    fontSize: 11,
    color: palette.gray,
  },

  clientBox: {
    backgroundColor: palette.muted,
    padding: 10,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },

  clientLabel: {
    fontSize: 10,
    color: palette.gray,
  },

  client: {
    fontWeight: "bold",
    color: palette.text,
  },

  empty: {
    marginTop: 10,
    fontStyle: "italic",
    color: palette.placeholder,
  },

  footer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  total: {
    fontWeight: "bold",
    color: palette.accent,
  },

  time: {
    color: palette.warning,
    fontWeight: "600",
  },

  available: {
    color: palette.success,
    fontWeight: "bold",
  },

  orderText: {
    color: palette.accent,
    fontWeight: "bold",
  },

  editBtn: {
    marginTop: 10,
    backgroundColor: palette.infoBackground,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.light,
  },

  editText: {
    color: palette.primary,
    fontWeight: "bold",
    fontSize: 12,
  },

  deleteBtn: {
    marginTop: 10,
    backgroundColor: palette.dangerBackground,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  deleteBtnDisabled: {
    backgroundColor: palette.muted,
  },

  deleteText: {
    color: palette.danger,
    fontWeight: "bold",
    fontSize: 12,
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
    gap: 14,
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
    gap: 10,
    backgroundColor: palette.dangerBackground,
    paddingVertical: 14,
    borderRadius: 14,
  },

  logoutText: {
    color: palette.danger,
    fontWeight: "bold",
    fontSize: 15,
  },
});
