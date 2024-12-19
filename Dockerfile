# Use the official Node.js image from Docker Hub
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose port 3000 to communicate with the outside world
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]
