# Use an official Node.js runtime as the base image for building
FROM node:16 AS build

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy your source code into the container
COPY . .

# Build your application (replace "build" with the actual npm script for building)
RUN npm run build

# Run your Node.js script (replace "main.js" with the actual entry point)
ENTRYPOINT ["node", "build/src/main.js", "data=/data"]
