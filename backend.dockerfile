# Use a Node.js image
FROM node:20-alpine

WORKDIR /
# Set the working directory
RUN mkdir /backend
RUN mkdir /shared

# Copy package files and tsconfig.json
COPY backend ./backend

RUN ls -la
RUN ls -la backend

# Copy the shared folder
COPY shared ./shared         # Copy the shared folder to the root of the container


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