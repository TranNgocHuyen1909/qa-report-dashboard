FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


FROM dependencies AS build

COPY . .
RUN npm run build


FROM node:22-bookworm-slim AS api

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist/server ./dist/server

RUN mkdir -p /app/.cache && chown -R node:node /app

USER node

EXPOSE 8788

CMD ["node", "dist/server/main.js"]


FROM nginx:1.27-alpine AS web

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/index.html /usr/share/nginx/html/index.html
COPY --from=build /app/dist/assets /usr/share/nginx/html/assets

EXPOSE 80
