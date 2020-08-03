# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM node:carbon

WORKDIR /database-controller

COPY ./src ./src
COPY ./sdk ./sdk
COPY ./version ./version

WORKDIR src

RUN yarn install

RUN npm install json -g
RUN json -I -f package.json -e "this.paiVersion=\"`cat ../version/PAI.VERSION`\""
RUN json -I -f package.json -e "this.paiCommitVersion=\"`cat ../version/COMMIT.VERSION`\""


CMD ["sleep", "infinity"]
