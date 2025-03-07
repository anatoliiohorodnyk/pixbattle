FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev  # Змінити --production на --omit=dev
COPY . .

EXPOSE 3000
CMD ["npm", "start"]