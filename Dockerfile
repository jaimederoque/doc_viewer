# Imagen base de Node.js (versión LTS Alpine para menor tamaño)
FROM node:20-alpine

# Crear directorio de la aplicación
WORKDIR /app

# Crear directorio para datos persistentes
RUN mkdir -p /data

# Copiar package.json y package-lock.json primero (para cache de capas Docker)
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Crear usuario no-root para seguridad (requerido en OpenShift)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app /data

# Cambiar a usuario no-root
USER nodejs

# Exponer el puerto
EXPOSE 3001

# Variable de entorno para la ruta de datos persistentes
ENV DATA_PATH=/data
ENV PORT=3001

# Comando de inicio
CMD ["node", "server.js"]
