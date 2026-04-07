# Usar una imagen optimizada y ligera de Node.js
FROM node:20-alpine

WORKDIR /app

# Copiar configuración de dependencias primero para aprovechar la caché de Docker
COPY package.json package-lock.json ./

# Instalar las librerías
RUN npm install

# Copiar el resto del código
COPY . .

EXPOSE 3000
