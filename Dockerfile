FROM node:22-alpine

ARG PORT=3000

WORKDIR /var/app

RUN apk add --no-cache bash

COPY . .

COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

EXPOSE ${PORT}

ENTRYPOINT [ "./entrypoint.sh" ]