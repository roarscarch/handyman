FROM node:22-alpine AS build
WORKDIR /app

COPY frontend/handyman-frontend/package.json frontend/handyman-frontend/package-lock.json ./
RUN npm ci

COPY frontend/handyman-frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine AS final
EXPOSE 80

COPY frontend/handyman-frontend/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html


