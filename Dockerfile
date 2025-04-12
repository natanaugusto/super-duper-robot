FROM node:22-alpine

ARG PORT=3000

WORKDIR /var/app

COPY . .

RUN npm install --verbose

EXPOSE ${PORT}

CMD ["npm", "start"]