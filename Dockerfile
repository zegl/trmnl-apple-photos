# Node 22
FROM node:22-alpine


# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build the worker
RUN pnpm worker:build

# Start the application
CMD ["pnpm", "worker:start-built"]