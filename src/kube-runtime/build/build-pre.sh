set -o errexit
set -o nounset
set -o pipefail

BASH_DIR=$(cd $(dirname ${BASH_SOURCE}) && pwd)
PROJECT_DIR=${BASH_DIR}/../..
IMAGE_NAME=hivedscheduler

cd ${PROJECT_DIR}

docker build -t ${IMAGE_NAME} -f ${BASH_DIR}/Dockerfile .

echo Succeeded to build docker image ${IMAGE_NAME}
