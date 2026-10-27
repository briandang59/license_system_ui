FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@10.18.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY . .
ARG APP=admin
RUN mkdir -p apps/web/public
RUN pnpm --filter @license/${APP} build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ARG APP=admin
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
ENV APP_NAME=${APP}
COPY --from=build --chown=node:node /app/apps/${APP}/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=build --chown=node:node /app/apps/${APP}/public ./apps/${APP}/public
USER node
EXPOSE 3000
CMD ["sh", "-c", "exec node apps/$APP_NAME/server.js"]
