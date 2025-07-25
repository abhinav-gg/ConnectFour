FROM node:20-alpine

WORKDIR /app

# Copy only package files first for npm install cache layer
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/

WORKDIR /app/backend

# Install dependencies before copying source to utilize layer cache
RUN npm install --legacy-peer-deps

# Now copy shared last (changes often)
WORKDIR /app
COPY shared ./shared

WORKDIR /app/backend

# Now copy only required backend subdirectories
COPY backend/config ./config
COPY backend/data ./data
COPY backend/src ./src

# Clean and build
RUN rm -rf dist && npm run build

# Debug build output
RUN ls -R -la /app/backend/dist

EXPOSE 3001

CMD ["npm", "run", "start"]
