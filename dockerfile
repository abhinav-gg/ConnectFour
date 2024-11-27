# Use Node as base image
FROM node:18-alpine

# Install concurrently
RUN npm install -g concurrently

# Set working directory
WORKDIR /app

# Copy both frontend and backend files
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Install dependencies for both services
RUN cd frontend && npm install
RUN cd backend && npm install

# Expose ports for both services
EXPOSE 3000 3001

# Start both services using concurrently
CMD ["concurrently", "\"cd frontend && npm start\"", "\"cd backend && npm start\""]