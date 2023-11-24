FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD npm install mongoose; npx nodemon server.js