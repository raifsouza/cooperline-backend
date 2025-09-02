# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including development dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy rest of the application
COPY . .

# Set environment variable to disable ESLint
ENV DISABLE_ESLINT_PLUGIN=true

# Build the application
RUN DISABLE_ESLINT_PLUGIN=true npm run build

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]