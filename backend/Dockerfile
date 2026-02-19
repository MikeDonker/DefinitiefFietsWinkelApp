FROM oven/bun:1.1.34

WORKDIR /app

COPY backend/package.json backend/bun.lock ./
RUN bun install

COPY backend/ ./

ENV NODE_ENV=production
ENV PORT=3000

RUN bunx prisma generate

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]

