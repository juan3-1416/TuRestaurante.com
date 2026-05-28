import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { colors } from "../theme/colors";


// Ejemplo:
const API_URL = "http://192.168.0.6:8000/api/tables/";

export default function MesasScreen({ navigation }) {
  const [filter, setFilter] = useState("Todas");
  const [tables, setTables] = useState([]);

  useEffect(() => {
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.log("Error al cargar mesas:", error);
    }
  };

const crearMesa = async () => {
  try {
    const nuevaMesa = {
      number: String(tables.length + 1),
      capacity: 4,
      status: "Libre",
      pos_x: 0,
      pos_y: 0,
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nuevaMesa),
    });

    const text = await response.text();

    console.log("STATUS:", response.status);
    console.log("RESPUESTA BACKEND:", text);

    if (!response.ok) {
      throw new Error(text);
    }

    const mesaCreada = JSON.parse(text);
    setTables([...tables, mesaCreada]);
  } catch (error) {
    console.log("Error creando mesa:", error);
  }
};

  const eliminarMesa = async (id) => {
    try {
      const response = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar mesa");
      }

      setTables(tables.filter((mesa) => mesa.id !== id));
    } catch (error) {
      console.log("Error eliminando mesa:", error);
    }
  };

  const filtered =
    filter === "Todas"
      ? tables
      : tables.filter((t) => t.status === filter);

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
    const s = getStyles(item.status);

    return (
      <TouchableOpacity
        style={[styles.card, { borderColor: s.color }]}
        onPress={() => navigation.navigate("Pedido", { mesa: item })}
      >
        <View style={[styles.dot, { backgroundColor: s.color }]} />

        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: s.color + "20" }]}>
            <Icon name={s.icon} size={20} color={s.color} />
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

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => eliminarMesa(item.id)}
        >
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Mapa de Mesas</Text>

        <TouchableOpacity style={styles.addMesaBtn} onPress={crearMesa}>
          <Text style={styles.addMesaText}>+ Mesa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {["Todas", "Libre", "Ocupada", "Reservada"].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filter, filter === f && styles.activeFilter]}
          >
            <Text style={[styles.filterText, filter === f && { color: "#fff" }]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(i) => String(i.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    padding: 15,
  },

  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4C1D95",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  addMesaBtn: {
    backgroundColor: "#4C1D95",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },

  addMesaText: {
    color: "#fff",
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
  },

  card: {
    width: "48%",
    padding: 15,
    borderRadius: 25,
    backgroundColor: "#ffffffcc",
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
});