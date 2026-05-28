const BASE_URL = "http://192.168.0.6:8000/api";

const headers = () => ({
  "Content-Type": "application/json",
});
export const login = async (username, password) => {
  console.log("INTENTANDO LOGIN...");

  const res = await fetch("http://192.168.0.6:8000/api/auth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  console.log("STATUS:", res.status);

  const text = await res.text();
  console.log("RESPUESTA:", text);

  return JSON.parse(text);
};

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