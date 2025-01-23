# Use a Node.js image
FROM node:20-alpine

# Set the working directory
RUN mkdir /backend
RUN mkdir /shared

WORKDIR /backend

# Copy package files and tsconfig.json
COPY backend .

WORKDIR ../shared

# Copy the shared folder
COPY shared .         # Copy the shared folder to the root of the container

WORKDIR /
RUN ls -la

WORKDIR /backend

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY backend .                # Copy everything from the backend folder

# Build the application
RUN npm run build

# Expose the default production port
EXPOSE 3001

# Start the application in production mode
CMD ["npm", "run", "start"]