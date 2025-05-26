# Usa una imagen oficial de Node.js como base
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Copia el archivo de variables de entorno
#COPY .env ./.env

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente
COPY . .

# Expone el puerto
EXPOSE 8080

# Variable de entorno para producción
ENV NODE_ENV=production

# Comando para construir y ejecutar la app
RUN npm run build

CMD [  "npm", "run", "start:prod" ]