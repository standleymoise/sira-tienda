# Imagen para Dokploy (o cualquier servidor con Docker): compila Astro y lo sirve con nginx.
# En Dokploy: Application → Build Type «Dockerfile», y en «Build-time Arguments»:
#   SITE_URL=https://midominio.com
#   PUBLIC_TIENDA_URL=https://midominio.com        (mismo dominio si WordPress se reparte por rutas)
#   BASE_PATH=/
# Ver README → «Publicar en Dokploy».

# ---------- 1. Compilar ----------
# Debian (glibc), igual que GitHub Actions: sharp (fotos e íconos) trae binarios para esta plataforma.
FROM node:24-bookworm-slim AS compilar
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL
ARG PUBLIC_TIENDA_URL
ARG BASE_PATH=/
ENV SITE_URL=$SITE_URL PUBLIC_TIENDA_URL=$PUBLIC_TIENDA_URL BASE_PATH=$BASE_PATH
# Si WordPress no responde, el build falla a propósito y Dokploy deja la versión anterior.
RUN npm run build

# ---------- 2. Servir ----------
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilar /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
