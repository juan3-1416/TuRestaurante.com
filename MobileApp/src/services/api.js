const API_BASE_URL = "http://192.168.0.10:8000";

const getHeaders = (token = null) => {
  const baseHeaders = {
    "Content-Type": "application/json",
  };

  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  return baseHeaders;
};

export const login = async (username, password) => {
  console.log("INTENTANDO LOGIN...");

  const response = await fetch(
    `${API_BASE_URL}/api/users/token/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        username,
        password,
      }),
    }
  );

  const text = await response.text();

  console.log("STATUS LOGIN:", response.status);
  console.log("RESPUESTA LOGIN:", text);

  let data;

  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `El servidor no devolvió JSON. Estado: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.detail || "No se pudo iniciar sesión"
    );
  }

  return data;
};

// PRODUCTOS
export const getProductos = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/inventory/products/`,
    {
      method: "GET",
      headers: getHeaders(token),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data) || "Error al obtener productos"
    );
  }

  return data;
};

// ÓRDENES
export const getOrdenes = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/orders/orders/`,
    {
      method: "GET",
      headers: getHeaders(token),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data) || "Error al obtener órdenes"
    );
  }

  return data;
};

export const crearOrden = async (orden, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/orders/orders/`,
    {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(orden),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data) || "Error al crear la orden"
    );
  }

  return data;
};

// ÍTEMS DE ORDEN
export const crearOrderItem = async (item, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/orders/order-items/`,
    {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(item),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data) || "Error al crear el producto de la orden"
    );
  }

  return data;
};

// MESAS
export const getMesas = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/tables/tables/`,
    {
      method: "GET",
      headers: getHeaders(token),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data) || "Error al obtener mesas"
    );
  }

  return data;
};