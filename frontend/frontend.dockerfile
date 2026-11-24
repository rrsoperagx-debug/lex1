# Etap 1: Budowanie
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
# Zwiększamy limit RAM dla wirtualnej maszyny Node do wykorzystania SWAP
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN rm -rf dist && npm run build

# Etap 2: Serwowanie (Nginx)
FROM nginx:stable-alpine

# Kopiujemy zbudowane pliki
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Kopiujemy szablon konfiguracji bezpośrednio do /
COPY nginx.conf.template /nginx.conf.template

# Konfiguracja środowiska
ENV PORT=80
ENV BACKEND_URL=http://backend:8000

EXPOSE 80

# KLUCZOWE: Czyścimy ENTRYPOINT, aby uniknąć problematycznych skryptów obrazu Nginx
ENTRYPOINT []

# Ręczne wykonanie envsubst i uruchomienie Nginxa
CMD ["sh", "-c", "envsubst '${PORT} ${BACKEND_URL}' < /nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
