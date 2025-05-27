FROM node:18.20.4-alpine

ENV TZ=Asia/Seoul
ENV PORT=3000
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /app

RUN apk add tzdata

COPY package.json .
COPY yarn.lock .
RUN yarn

COPY . .
RUN npx prisma generate && yarn build
USER node
CMD [ "yarn", "start:prod"]
