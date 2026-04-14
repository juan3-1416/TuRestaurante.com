// src/screens/PedidoScreen.js
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { colors } from '../theme/colors';
import { getProductos, crearPedido } from '../services/api';

export default function PedidoScreen({ route, navigation }) {
  const { mesa, usuario } = route.params;

  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]); // [{ producto, cantidad, notas }]
  const [notaItem, setNotaItem] = useState(''); // nota del ítem siendo agregado
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [vista, setVista] = useState('productos'); // 'productos' | 'carrito'

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await getProductos(usuario.restaurante_id);
        setProductos(data);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [usuario.restaurante_id]);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id);
      if (existe) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { producto, cantidad: 1, notas: '' }];
    });
  };

  const cambiarCantidad = (productoId, delta) => {
    setCarrito((prev) =>
      prev
        .map((i) =>
          i.producto.id === productoId
            ? { ...i, cantidad: i.cantidad + delta }
            : i
        )
        .filter((i) => i.cantidad > 0)
    );
  };

  const actualizarNota = (productoId, nota) => {
    setCarrito((prev) =>
      prev.map((i) =>
        i.producto.id === productoId ? { ...i, notas: nota } : i
      )
    );
  };

  const totalCarrito = carrito.reduce(
    (sum, i) => sum + i.producto.precio * i.cantidad,
    0
  );

  const enviarPedido = async () => {
    if (carrito.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega al menos un producto antes de enviar.');
      return;
    }

    Alert.alert(
      'Confirmar pedido',
      `Mesa ${mesa.numero} — ${carrito.length} ítem(s)\nTotal: Bs. ${totalCarrito.toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setEnviando(true);
            try {
              await crearPedido({
                mesa_id: mesa.id,
                mesero_id: usuario.id,
                restaurante_id: usuario.restaurante_id,
                items: carrito.map((i) => ({
                  producto_id: i.producto.id,
                  cantidad: i.cantidad,
                  notas: i.notas,
                })),
              });
              Alert.alert('¡Pedido enviado!', 'El cajero ya puede verlo.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'No se pudo enviar el pedido. Intenta de nuevo.');
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Mesas</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesa {mesa.numero}</Text>
        <TouchableOpacity
          style={styles.carritoBtn}
          onPress={() => setVista(vista === 'productos' ? 'carrito' : 'productos')}
        >
          <Text style={styles.carritoText}>
            {vista === 'productos' ? `🛒 ${carrito.length}` : '← Productos'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* VISTA: PRODUCTOS */}
      {vista === 'productos' && (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const enCarrito = carrito.find((i) => i.producto.id === item.id);
            return (
              <View style={styles.productoCard}>
                <View style={styles.productoInfo}>
                  <Text style={styles.productoNombre}>{item.nombre}</Text>
                  <Text style={styles.productoPrecio}>Bs. {item.precio.toFixed(2)}</Text>
                  {item.categoria && (
                    <Text style={styles.productoCategoria}>{item.categoria}</Text>
                  )}
                </View>
                {enCarrito ? (
                  <View style={styles.cantidadControl}>
                    <TouchableOpacity
                      onPress={() => cambiarCantidad(item.id, -1)}
                      style={styles.ctrlBtn}
                    >
                      <Text style={styles.ctrlBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.cantidadNum}>{enCarrito.cantidad}</Text>
                    <TouchableOpacity
                      onPress={() => cambiarCantidad(item.id, 1)}
                      style={styles.ctrlBtn}
                    >
                      <Text style={styles.ctrlBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => agregarAlCarrito(item)}
                  >
                    <Text style={styles.addBtnText}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* VISTA: CARRITO */}
      {vista === 'carrito' && (
        <ScrollView contentContainerStyle={styles.list}>
          {carrito.length === 0 ? (
            <Text style={styles.emptyText}>El carrito está vacío.</Text>
          ) : (
            carrito.map((item) => (
              <View key={item.producto.id} style={styles.carritoItem}>
                <View style={styles.carritoItemTop}>
                  <Text style={styles.carritoNombre}>{item.producto.nombre}</Text>
                  <View style={styles.cantidadControl}>
                    <TouchableOpacity
                      onPress={() => cambiarCantidad(item.producto.id, -1)}
                      style={styles.ctrlBtn}
                    >
                      <Text style={styles.ctrlBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.cantidadNum}>{item.cantidad}</Text>
                    <TouchableOpacity
                      onPress={() => cambiarCantidad(item.producto.id, 1)}
                      style={styles.ctrlBtn}
                    >
                      <Text style={styles.ctrlBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.carritoSubtotal}>
                  Bs. {(item.producto.precio * item.cantidad).toFixed(2)}
                </Text>
                <TextInput
                  style={styles.notaInput}
                  placeholder="Nota (ej: sin cebolla)"
                  placeholderTextColor="#aaa"
                  value={item.notas}
                  onChangeText={(t) => actualizarNota(item.producto.id, t)}
                />
              </View>
            ))
          )}

          {carrito.length > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Bs. {totalCarrito.toFixed(2)}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Botón enviar */}
      {vista === 'carrito' && carrito.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.enviarBtn, enviando && styles.btnDisabled]}
            onPress={enviarPedido}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.enviarBtnText}>Enviar pedido</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.dark,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  backText: { color: colors.secondary, fontSize: 14 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  carritoBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  carritoText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  list: { padding: 16 },
  productoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },
  productoInfo: { flex: 1, marginRight: 10 },
  productoNombre: { fontSize: 15, fontWeight: '600', color: colors.text },
  productoPrecio: { fontSize: 14, color: colors.primary, marginTop: 2 },
  productoCategoria: { fontSize: 12, color: colors.secondary, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  cantidadControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctrlBtn: {
    backgroundColor: colors.lightGray,
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnText: { fontSize: 18, color: colors.dark, fontWeight: 'bold' },
  cantidadNum: { fontSize: 16, fontWeight: 'bold', color: colors.dark, minWidth: 20, textAlign: 'center' },
  carritoItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  carritoItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  carritoNombre: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  carritoSubtotal: { fontSize: 14, color: colors.primary, marginBottom: 8 },
  notaInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.lightGray,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 8,
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.dark },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: colors.accent },
  footer: { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderColor: '#eee' },
  enviarBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  enviarBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: colors.secondary, marginTop: 40, fontSize: 15 },
});