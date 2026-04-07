# Usa una imagen oficial ligera de Python
FROM python:3.12-slim

# Evitar que Python escriba archivos .pyc y el log buffering
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Instalar dependencias del sistema requeridas para PostgreSQL y otros paquetes
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copiar el codigo base
COPY . /app/
