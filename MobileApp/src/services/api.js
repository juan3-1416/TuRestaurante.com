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

const parseJsonResponse = async (response, contexto = "API") => {
  const text = await response.text();

  console.log(`STATUS ${contexto}:`, response.status);
  console.log(`RESPUESTA ${contexto}:`, text);

  let data;

  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `El servidor no devolvió JSON. Estado: ${response.status}. Respuesta: ${text}`
    );
  }

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data) || `Error en ${contexto}`
    );
  }

  return data;
};

const normalizarLista = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

// LOGIN
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

  return await parseJsonResponse(response, "LOGIN");
};

// USUARIOS
// USUARIOS
export const getUsuarios = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/users/`,
    {
      method: "GET",
      headers: getHeaders(token),
    }
  );

  const text = await response.text();

  console.log("STATUS USUARIOS:", response.status);
  console.log("RESPUESTA USUARIOS:", text);

  let data;

  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `El servidor no devolvió JSON. Estado: ${response.status}. Respuesta: ${text}`
    );
  }

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data) || "Error al obtener usuarios"
    );
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  return [];
};

// PRODUCTOS
export const getProductos = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/inventory/products/`,
    {
      method: "GET",
      headers: {
        ...getHeaders(token),
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    }
  );

  const data = await parseJsonResponse(response, "PRODUCTOS");

  return normalizarLista(data);
};

// MESAS
export const getMesas = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/tables/`,
    {
      method: "GET",
      headers: getHeaders(token),
    }
  );

  const data = await parseJsonResponse(response, "MESAS");

  return normalizarLista(data);
};

export const crearMesa = async (mesa, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/tables/`,
    {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(mesa),
    }
  );

  return await parseJsonResponse(response, "CREAR MESA");
};

export const actualizarMesa = async (mesaId, datos, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/tables/${mesaId}/`,
    {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify(datos),
    }
  );

  return await parseJsonResponse(response, "ACTUALIZAR MESA");
};

export const eliminarMesa = async (mesaId, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/tables/${mesaId}/`,
    {
      method: "DELETE",
      headers: getHeaders(token),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error al eliminar mesa");
  }

  return true;
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

  const data = await parseJsonResponse(response, "ORDENES");

  return normalizarLista(data);
};

export const getOrdenDetalle = async (ordenId, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/orders/orders/${ordenId}/`,
    {
      method: "GET",
      headers: getHeaders(token),
    }
  );

  return await parseJsonResponse(response, "DETALLE ORDEN");
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

  return await parseJsonResponse(response, "CREAR ORDEN");
};

export const actualizarOrden = async (ordenId, datos, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/orders/orders/${ordenId}/`,
    {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify(datos),
    }
  );

  return await parseJsonResponse(response, "ACTUALIZAR ORDEN");
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

  return await parseJsonResponse(response, "CREAR ORDER ITEM");
};