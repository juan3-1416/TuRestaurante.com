# Guía: Cómo poblar la base de datos con datos de demostración

Para que el software de **TuRestaurante** pueda ser presentado con gráficos, reportes e historiales de ventas completamente llenos, hemos incluido un script automatizado que inyecta datos realistas en la base de datos.

Este script simulará **años de operaciones** (pedidos, turnos de caja, ingresos, egresos y clientes), permitiendo que toda la plataforma y el dashboard de reportes cobren vida inmediatamente.

---

## 📍 Ubicación del Script
El código fuente de este generador se encuentra exactamente en:
`backend/apps/orders/management/commands/seed_data.py`

Tienes que instalar las siguientes librerias que se encuentran en requirements.txt

Puedes revisarlo para entender o modificar cómo se generan los nombres de los platos, los montos de dinero o la frecuencia de los pedidos.

---

## 🚀 Ejecutar el Script usando Docker

Dado que el proyecto utiliza contenedores, los comandos deben enviarse directamente al contenedor del backend (`rest_backend`). Sigue estos pasos en orden estricto:

### Paso 1: Levantar los contenedores
Asegúrate de que tus contenedores de Docker (base de datos, redis, backend y frontend) estén corriendo. Si no lo están, levántalos desde la carpeta raíz del proyecto con:
```bash
docker-compose up -d
```

### Paso 2: Ejecutar el poblado de datos
Una vez que el contenedor `rest_backend` está funcionando, ejecuta el siguiente comando para que Django llame a nuestro archivo `seed_data.py`:

```bash
docker-compose exec backend python manage.py seed_data
```

### ¿Qué sucederá al correr el comando?
1. **Borrado (Flush):** Eliminará de forma segura todas las órdenes, productos, meses y turnos de caja actuales. *(¡No lo uses en producción si tienes datos reales que no quieres perder!)*
2. **Creación de Empleados:** Generará Meseros y Cajeros genéricos.
3. **Creación del Menú:** Instalará un menú base hiperrealista con categorías (Bebidas, Platos Principales, Postres) y precios lógicos.
4. **Simulación Histórica:** Simulará turnos de caja diarios (desde Enero de 2025 hasta la fecha actual), generando entre 5 y 25 pedidos aleatorios por día, respetando horas pico y cobros exactos.

Al finalizar, verás un mensaje de color verde en la consola indicando la cantidad de miles de pedidos generados. 

### ¡Listo para usar!
Con la base de datos poblada, puedes dirigirte al navegador en el puerto de tu Frontend (ej. `http://localhost:3000`), navegar a la pestaña de **Reportes** y disfrutar de métricas y gráficos visualmente coherentes y completamente repletos de datos.
