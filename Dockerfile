
FROM oven/bun:1.2-debian AS base

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY bunfig.toml ./bunfig.toml

# Expose the port the application runs on
EXPOSE 3000

# Define the default command to run the application
# Uses the modified "start" script from package.json which now only runs the server
CMD ["bun", "run", "start"]