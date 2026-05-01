import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { colors } from "../theme/colors";

const TABLES = [
  { id: "1", number: 1, capacity: 4, status: "Libre" },
  { id: "2", number: 2, capacity: 4, status: "Ocupada", total: 150.5, cliente: "Familia Perez" },
  { id: "3", number: 3, capacity: 2, status: "Reservada", hora: "19:30", cliente: "Juan Gomez" },
  { id: "4", number: 4, capacity: 6, status: "Libre" },
];

export default function MesasScreen({ navigation }) {
  const [filter, setFilter] = useState("Todas");

  const filtered =
    filter === "Todas"
      ? TABLES
      : TABLES.filter((t) => t.status === filter);

  const getStyles = (status) => {
    switch (status) {
      case "Libre":
        return { color: "#22C55E", icon: "check-circle" };
      case "Ocupada":
        return { color: "#EF4444", icon: "dollar-sign" };
      case "Reservada":
        return { color: "#EAB308", icon: "clock" };
    }
  };

  const renderItem = ({ item }) => {
    const s = getStyles(item.status);

    return (
      <TouchableOpacity
        style={[styles.card, { borderColor: s.color }]}
        onPress={() => navigation.navigate("Pedido", { mesa: item })}
      >
        {/* Indicador */}
        <View style={[styles.dot, { backgroundColor: s.color }]} />

        {/* Header */}
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: s.color + "20" }]}>
            <Icon name={s.icon} size={20} color={s.color} />
          </View>

          <View>
            <Text style={styles.title}>Mesa {item.number}</Text>
            <Text style={styles.sub}>{item.capacity} personas</Text>
          </View>
        </View>

        {/* Cliente */}
        {item.cliente ? (
          <View style={styles.clientBox}>
            <Text style={styles.clientLabel}>Cliente</Text>
            <Text style={styles.client}>{item.cliente}</Text>
          </View>
        ) : (
          <Text style={styles.empty}>Sin Reservar</Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {item.status === "Ocupada" && (
            <Text style={styles.total}>Bs. {item.total}</Text>
          )}

          {item.status === "Reservada" && (
            <Text style={styles.time}>{item.hora}</Text>
          )}

          {item.status === "Libre" && (
            <Text style={styles.available}>Disponible</Text>
          )}

          <Icon name="play" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.header}>Mapa de Mesas</Text>

      {/* FILTROS */}
      <View style={styles.filters}>
        {["Todas", "Libre", "Ocupada", "Reservada"].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filter,
              filter === f && styles.activeFilter,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && { color: "#fff" },
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* GRID */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
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
    marginBottom: 15,
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
});