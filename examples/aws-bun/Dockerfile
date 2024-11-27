FROM oven/bun

COPY bun.lockb . 
COPY package.json . 

RUN bun install --frozen-lockfile

COPY . .

CMD ["bun", "index.ts"]

EXPOSE 3000
