# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ .
RUN npm run build

# Serve stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# Nginx config for SPA routing
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
