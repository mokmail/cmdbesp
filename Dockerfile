FROM node:22-alpine AS react-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js eslint.config.js ./
COPY src/ src/
COPY public/ public/
COPY uploads/ uploads/
RUN npm run build

FROM node:22-alpine AS node-runtime

FROM nginx:alpine AS runtime
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=node-runtime /usr/lib /usr/lib

WORKDIR /app
COPY --from=react-build /app/dist /usr/share/nginx/html
COPY server.js ./
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

VOLUME /app/uploads

EXPOSE 4455

ENTRYPOINT ["/entrypoint.sh"]