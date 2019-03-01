FROM alpine

RUN apk update && \
    apk add lsof gawk bash

RUN mkdir -p /cleaner-test
WORKDIR /cleaner-test

COPY cleaner-test.sh /cleaner-test/

ENTRYPOINT ["sh", "/cleaner-test/cleaner-test.sh 94 60"]