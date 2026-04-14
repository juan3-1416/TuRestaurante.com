// PRODUCTOS
export const getProductos = async (restaurante_id) => {
  const res = await fetch(`${BASE_URL}/productos?restaurante_id=${restaurante_id}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json(); // [{ id, nombre, precio, categoria }]
};
 
// PEDIDOS
export const crearPedido = async (pedido) => {
  const res = await fetch(`${BASE_URL}/pedidos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(pedido),
    // pedido: { mesa_id, mesero_id, restaurante_id, items: [{ producto_id, cantidad, notas }] }
  });
  if (!res.ok) throw new Error('Error al enviar pedido');
  return res.json(); // { id, estado, creado_en }
};
 
export const getPedidosMesa = async (mesa_id) => {
  const res = await fetch(`${BASE_URL}/pedidos?mesa_id=${mesa_id}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
};