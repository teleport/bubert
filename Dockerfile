FROM mhart/alpine-node:latest

EXPOSE 3000
ENV PORT 3000

WORKDIR /app

COPY package.json /app/package.json
RUN npm install

COPY . /app

CMD ["bin/hubot"]
