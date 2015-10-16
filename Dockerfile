FROM mhart/alpine-node:latest

EXPOSE 3000
ENV PORT 3000

WORKDIR /app

COPY package.json /app/package.json

RUN apk --update add git
RUN npm install

COPY . /app

CMD ["bin/hubot"]
