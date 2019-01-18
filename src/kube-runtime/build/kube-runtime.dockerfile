FROM golang:alpine as builder

ENV PROJECT_DIR=${GOPATH}/src/github.com/microsoft/frameworkcontroller
ENV INSTALL_DIR=/opt/frameworkcontroller/frameworkbarrier

RUN apk update && apk add --no-cache bash git && \
        mkdir -p ${PROJECT_DIR} ${INSTALL_DIR}
RUN git clone https://github.com/Microsoft/frameworkcontroller.git --depth=1 && \
        cp -r frameworkcontroller/* ${PROJECT_DIR}
RUN ${PROJECT_DIR}/build/frameworkbarrier/go-build.sh && \
    mv ${PROJECT_DIR}/dist/frameworkbarrier/* ${INSTALL_DIR}

FROM python:2.7-alpine3.8

ENV BARRIER_DIR=/opt/frameworkcontroller/frameworkbarrier

RUN mkdir /pai-runtime
COPY --from=builder ${BARRIER_DIR}/frameworkbarrier /pai-runtime
ADD src/init /pai-runtime/init
ADD src/prep /pai-runtime/prep
COPY src/run src/entry src/parse.py /pai-runtime/
ENTRYPOINT ["/pai-runtime/entry"]
