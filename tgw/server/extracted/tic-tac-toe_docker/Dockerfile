# Use the official Node.js 14 image as a base
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (3000 for Create React App)
EXPOSE 5174

# Set the command to run the development server
CMD ["npm", "run", "dev"]
