# ==========================================
# Stage 1: Build the frontend assets
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable legacy peer deps to resolve potential peer conflicts
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the code and build for production
COPY . .
RUN npm run build 

# ==========================================
# Stage 2: Serve with Nginx
# ==========================================
FROM nginx:alpine

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# We copy our source nginx.conf to a safe place (so it doesn't get messed up by envsubst)
COPY nginx.conf /etc/nginx/nginx.conf.template

# Environment defaults for Railway
ENV PORT=80
ENV BACKEND_URL=https://test-production-bf56f.up.railway.app

# Copy the compiled assets from the builder stage
# (Vite projects output to dist folder by default)
COPY --from=builder /app/dist /usr/share/nginx/html

# Railway assigns a random PORT, so we must inject it and the backend URL dynamically
EXPOSE 80

# Use 'sh -c' to run envsubst on our template and then start Nginx
CMD ["sh", "-c", "envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
