# Use a Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR ./

RUN ls -la
# Copy package files and tsconfig.json
COPY package*.json ./  # Copy package.json and package-lock.json (if exists)
COPY tsconfig.json ./   # Copy tsconfig.json

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .                # Copy everything from the backend folder
COPY ../shared .         # Copy the shared folder to the root of the container

# Build the application
RUN npm run build

# Expose the default production port
EXPOSE 3001

# Start the application in production mode
CMD ["npm", "run", "start"]