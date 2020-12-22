set -e

OPENPAI_BRANCH_NAME = $1

git fetch origin ${OPENPAI_BRANCH_NAME} && git checkout ${OPENPAI_BRANCH_NAME}
git branch
echo "pai" > cluster-id

echo "Generating services configurations..."
python3 ./contrib/kubespray/script/openpai-generator.py -l /cluster-configuration/layout.yaml -c /cluster-configuration/config.yaml -o /cluster-configuration
git branch

echo "Pushing cluster config to cluster..."
python ./paictl.py config push -p /cluster-configuration -m service < cluster-id
git branch

echo "Starting OpenPAI services..."
python ./paictl.py service start < cluster-id
