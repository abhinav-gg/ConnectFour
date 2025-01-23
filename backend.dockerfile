# Use a Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /backend

# Copy package files
COPY package*.json ./backend
COPY tsconfig.json ./backend

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the default production port
EXPOSE 3001

# Start the application in production mode
CMD ["npm", "run", "start"]
