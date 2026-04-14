// src/screens/MesasScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { getMesas } from '../services/api';

export default function MesasScreen({ route, navigation }) {
  const { usuario } = route.params;
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarMesas = useCallback(async () => {
    try {
      const data = await getMesas(usuario.restaurante_id);
      setMesas(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las mesas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [usuario.restaurante_id]);

  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]);

  // Recargar mesas al volver de PedidoScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarMesas);
    return unsubscribe;
  }, [navigation, cargarMesas]);

  const handleMesaPress = (mesa) => {
    navigation.navigate('Pedido', { mesa, usuario });
  };

  const renderMesa = ({ item }) => {
    const ocupada = item.estado === 'ocupada';
    return (
      <TouchableOpacity
        style={[styles.mesa, ocupada ? styles.mesaOcupada : styles.mesaLibre]}
        onPress={() => handleMesaPress(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.mesaNumero}>Mesa {item.numero}</Text>
        <View style={[styles.badge, { backgroundColor: ocupada ? colors.danger : colors.success }]}>
          <Text style={styles.badgeText}>{ocupada ? 'Ocupada' : 'Libre'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando mesas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesas</Text>
        <Text style={styles.headerSub}>Hola, {usuario.nombre}</Text>
      </View>

      <FlatList
        data={mesas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMesa}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              cargarMesas();
            }}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay mesas registradas.</Text>
        }
      />
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  loadingText: {
    marginTop: 12,
    color: colors.secondary,
    fontSize: 14,
  },
  header: {
    backgroundColor: colors.dark,
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSub: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 2,
  },
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mesa: {
    width: '48%',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  mesaLibre: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.success,
  },
  mesaOcupada: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  mesaNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.secondary,
    marginTop: 40,
    fontSize: 15,
  },
});