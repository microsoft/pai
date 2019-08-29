set -o errexit
set -o nounset
set -o pipefail

BASH_DIR=$(cd $(dirname ${BASH_SOURCE}) && pwd)
# Ensure ${PROJECT_DIR} is ${GOPATH}/src/github.com/microsoft/hivedscheduler
PROJECT_DIR=${BASH_DIR}/../..
DIST_DIR=${PROJECT_DIR}/dist/runtime

cd ${PROJECT_DIR}

rm -rf ${DIST_DIR}
mkdir -p ${DIST_DIR}

go build -o ${DIST_DIR}/exithandler cmd/exithandler/*
chmod a+x ${DIST_DIR}/exithandler
cp -r bin/exithandler/* ${DIST_DIR}

echo Succeeded to build binary distribution into ${DIST_DIR}:
cd ${DIST_DIR} && ls -lR .