FROM node:22-alpine AS react-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js eslint.config.js ./
COPY src/ src/
COPY public/ public/
COPY *.csv ./
COPY ID_generated/ ID_generated/
RUN npm run build

FROM python:3.13-slim AS streamlit-deps
WORKDIR /app
COPY pyproject.toml uv.lock ./
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
RUN uv sync --frozen --no-dev

FROM node:22-alpine AS runtime
RUN apk add --no-cache nginx

WORKDIR /app
COPY --from=react-build /app/dist /usr/share/nginx/html
COPY --from=react-build /app/ID_generated /app/ID_generated
COPY server.js ./

COPY --from=streamlit-deps /app/.venv /app/.venv
COPY --from=streamlit-deps /usr/local/bin/uv /usr/local/bin/uv
ENV PATH="/app/.venv/bin:$PATH"

COPY dashboard.py ./
COPY *.csv ./

COPY nginx.conf /etc/nginx/nginx.conf

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]