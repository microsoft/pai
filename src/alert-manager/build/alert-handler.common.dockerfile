# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM node:24.20.0-bookworm

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY ./src/alert-handler .

RUN yarn install --frozen-lockfile --non-interactive

ENTRYPOINT ["npm", "start"]
