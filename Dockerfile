# Dockerfile
FROM node:22-alpine

WORKDIR /app

# 1. Ставим зависимости (и prod, и dev — так проще для начала)
COPY package*.json ./
RUN npm ci

# 2. Кладём Prisma схему и конфиг (важно — до generate)
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# 3. Фейковый DATABASE_URL только для этапа сборки
ARG DATABASE_URL="postgres://user:password@localhost:5432/dummy"
ENV DATABASE_URL=$DATABASE_URL

# 4. Генерим Prisma Client
RUN npx prisma generate

# 5. Теперь весь остальной код (Nest, src и т.д.)
COPY . .

# 6. Сборка Nest
RUN npm run build

EXPOSE 3000

# На рантайме настоящий DATABASE_URL придёт из docker-compose / env
CMD ["npm", "run", "start:migrate:prod"]