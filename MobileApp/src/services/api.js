const BASE_URL = "http://10.0.2.2:8000";

const headers = () => ({
  "Content-Type": "application/json",
});

// PRODUCTOS
export const getProductos = async (restaurante_id) => {
  const res = await fetch(`${BASE_URL}/productos?restaurante_id=${restaurante_id}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
};

// PEDIDOS
export const crearPedido = async (pedido) => {
  const res = await fetch(`${BASE_URL}/pedidos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(pedido),
  });
  if (!res.ok) throw new Error('Error al enviar pedido');
  return res.json();
};

export const getPedidosMesa = async (mesa_id) => {
  const res = await fetch(`${BASE_URL}/pedidos?mesa_id=${mesa_id}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
};