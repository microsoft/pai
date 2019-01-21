FROM frameworkcontroller/frameworkbarrier:v0.3.0 as barrier

FROM python:2.7-alpine3.8

ENV BARRIER_DIR=/opt/frameworkcontroller/frameworkbarrier

RUN mkdir /pai-runtime
COPY --from=barrier ${BARRIER_DIR}/frameworkbarrier /pai-runtime
ADD src/init /pai-runtime/init
ADD src/prep /pai-runtime/prep
COPY src/run src/entry src/parse.py /pai-runtime/
ENTRYPOINT ["/pai-runtime/entry"]
