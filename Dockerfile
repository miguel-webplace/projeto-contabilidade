FROM node:20.20.2-trixie
EXPOSE 3000/tcp

WORKDIR /project

VOLUME migration.sql migration.sql

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build