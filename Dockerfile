FROM oven/bun:1.2.2

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY src ./src
COPY tsconfig.json rslib.config.ts ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "src/api-service/cli.ts"]
