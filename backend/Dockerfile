# Use Node.js LTS version
FROM node:20-slim

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose port (Render/Fly.io will use PORT env var)
EXPOSE 5000

# Start the server
CMD [ "npm", "start" ]
