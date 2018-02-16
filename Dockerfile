FROM node:9

EXPOSE 3000 3001 8080

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN apt-get install -y make gcc g++ python

COPY package.json /usr/src/app/

RUN yarn install

COPY . /usr/src/app

CMD yarn start
