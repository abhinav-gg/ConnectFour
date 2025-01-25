# Use a Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /backend

# Copy package files
COPY backend/package*.json ./  # Copy package.json and package-lock.json (if exists)
COPY backend/tsconfig.json ./   # Copy tsconfig.json

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY backend .

# Copy the shared directory
COPY shared ./shared

RUN ls -la

# Build the application
RUN npm run build

# Expose the default production port
EXPOSE 3001

# Start the application in production mode
CMD ["npm", "run", "start"]