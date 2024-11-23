# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the Next.js app
RUN npm run build

# Expose ports for Next.js and Socket.IO
EXPOSE 3000
EXPOSE 3001

# Start command
CMD ["npm", "run", "start"]
