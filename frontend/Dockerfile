FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose port 5173
EXPOSE 5173

# Start Vite with --host to expose to network
CMD ["npm", "run", "dev", "--", "--host"]
