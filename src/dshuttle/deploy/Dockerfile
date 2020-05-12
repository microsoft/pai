FROM ubuntu:16.04

RUN apt-get update && \
    apt-get install -y --no-install-recommends fuse

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
