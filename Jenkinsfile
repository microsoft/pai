pipeline {
  agent {
    node {
      label 'pai'
    }

  }
  stages {
    stage('Build Images') {
      agent {
        node {
          label 'build-images'
        }

      }
      steps {
        sh '''#! /bin/bash

set -x

# prepare
/mnt/cleanAndPrepare.sh

# set CONFIG_PATH
CONFIG_PATH=/mnt/pathConfiguration
sudo chmod 777 $CONFIG_PATH

# work directory
cd pai-management/

# generate SingleBox quick-start.yaml
/mnt/genSingleBoxQuickStart.sh && echo \'Setup Registry!\'

# generate config
./paictl.py cluster generate-configuration -i $CONFIG_PATH/quick-start.yaml -o $CONFIG_PATH
# update image tag
sed -i "46s/.*/    docker-tag: ${GIT_BRANCH/\\//-}-$(git rev-parse --short HEAD)-${BUILD_ID}/" $CONFIG_PATH/services-configuration.yaml
# setup registry
/mnt/setupIntRegistry.sh

# build images
sudo ./paictl.py image build -p $CONFIG_PATH

# push images
sudo ./paictl.py image push -p $CONFIG_PATH
'''
      }
    }
    stage('Deploy') {
      parallel {
        stage('Install A SingleBox') {
          agent {
            node {
              label 'single-box'
            }

          }
          steps {
            sh '''#!/bin/bash

sudo docker ps -q -f status=created | xargs --no-run-if-empty sudo docker rm
sudo docker ps -q -f status=exited | xargs --no-run-if-empty sudo docker rm

cd pai-management

# Run your dev-box
# Assume the path of custom-hadoop-binary-path in your service-configuration is /pathHadoop.
# Assume the directory path of your cluster-configuration is /pathConfiguration.
# By now, you can leave it as it is, we only mount those two directories into docker container for later usage.
# sudo docker run -itd \\
#         -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \\
#         -v /var/lib/docker:/var/lib/docker \\
#         -v /var/run/docker.sock:/var/run/docker.sock \\
#         -v /mnt/pathHadoop:/pathHadoop \\
#         -v /mnt/pathConfiguration:/cluster-configuration  \\
#         --pid=host \\
#         --privileged=true \\
#         --net=host \\
#         --name=dev-box \\
#         docker.io/openpai/dev-box

# Working in your dev-box
sudo docker exec -i dev-box /bin/bash <<EOF_DEV_BOX

set -x

rm -rf /cluster-configuration/cluster-configuration.yaml
rm -rf /cluster-configuration/k8s-role-definition.yaml
rm -rf /cluster-configuration/kubernetes-configuration.yaml
rm -rf /cluster-configuration/services-configuration.yaml
# TODO don't clean, for cache
#rm -rf /pathHadoop/*
cd /pai/pai-management

# Choose the branch
git fetch origin ${GIT_BRANCH}
git reset --hard origin/${GIT_BRANCH}

# Choose the branch
if [[ $GIT_BRANCH == "PR*" ]];
    export PR_ID=$(echo $GIT_BRANCH | cut -d\\\'-\\\' -f 2)
    git fetch origin pull/$PR_ID/head:$GIT_BRANCH
    git checkout $GIT_BRANCH
then
    git fetch origin $GIT_BRANCH
    git checkout --track origin/$GIT_BRANCH
    git reset --hard origin/$GIT_BRANCH
fi

# TODO this don\'t work!
#export IMAGE_TAG=${GIT_BRANCH/\\//-}-$(git rev-parse --short HEAD)-${BUILD_ID}
#echo "Image tag: $IMAGE_TAG"

# create quick-start.yaml
/cluster-configuration/genSingleBoxQuickStart.sh

# Step 1. Generate config
#export CONFIG_PATH=/cluster-configuration
./paictl.py cluster generate-configuration -i /quick-start.yaml -o /cluster-configuration

# update image tag
sed -i "46s/.*/    docker-tag: ${GIT_BRANCH/\\//-}-$(git rev-parse --short HEAD)-${BUILD_ID}/" /cluster-configuration/services-configuration.yaml

# setup vc
sed -i "66s/.*/  virtualClusters:/" /cluster-configuration/services-configuration.yaml
sed -i "67s/.*/    default:/" /cluster-configuration/services-configuration.yaml
sed -i "68s/.*/      description: Default VC./" /cluster-configuration/services-configuration.yaml
sed -i "69s/.*/      capacity: 100/" /cluster-configuration/services-configuration.yaml

# setup registry
/cluster-configuration/setupIntRegistry.sh

# delete service for next install
./paictl.py service delete -p /cluster-configuration

# clean k8s first
./paictl.py cluster k8s-clean -p /cluster-configuration << EOF
Y
EOF

# Step 2. Boot up Kubernetes
# install k8s
./paictl.py cluster k8s-bootup -p /cluster-configuration

# TODO waiting for 9090 ready
#echo "Waiting k8s dashboard to launch on 9090..."
#timeout 30 bash -c \'until printf "" 2>>/dev/null >>/dev/tcp/$0/$1; do sleep 1; done\' 10.0.1.6 9090


# tep 3. Start all PAI services
# start pai services
./paictl.py service start -p /cluster-configuration

EOF_DEV_BOX

'''
          }
        }
        stage('Install Cluster') {
          agent {
            node {
              label 'cluster-install'
            }

          }
          steps {
            sh '''#!/bin/bash

sudo docker ps -q -f status=created | xargs --no-run-if-empty sudo docker rm
sudo docker ps -q -f status=exited | xargs --no-run-if-empty sudo docker rm

cd pai-management

# Run your dev-box
# Assume the path of custom-hadoop-binary-path in your service-configuration is /pathHadoop.
# Assume the directory path of your cluster-configuration is /pathConfiguration.
# By now, you can leave it as it is, we only mount those two directories into docker container for later usage.
# sudo docker run -itd \\
#         -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \\
#         -v /var/lib/docker:/var/lib/docker \\
#         -v /var/run/docker.sock:/var/run/docker.sock \\
#         -v /mnt/pathHadoop:/pathHadoop \\
#         -v /mnt/pathConfiguration:/cluster-configuration  \\
#         --pid=host \\
#         --privileged=true \\
#         --net=host \\
#         --name=dev-box \\
#         docker.io/openpai/dev-box

# Working in your dev-box
sudo docker exec -i dev-box /bin/bash <<EOF_DEV_BOX

set -x

rm -rf /cluster-configuration/cluster-configuration.yaml
rm -rf /cluster-configuration/k8s-role-definition.yaml
rm -rf /cluster-configuration/kubernetes-configuration.yaml
rm -rf /cluster-configuration/services-configuration.yaml
rm -rf /pathHadoop/*
cd /pai/pai-management

# Choose the branch
git fetch origin ${GIT_BRANCH}
git checkout --track origin/${GIT_BRANCH}
git reset --hard origin/${GIT_BRANCH}

# Image tag
#export IMAGE_TAG=${GIT_BRANCH/\\//-}-$(git rev-parse --short HEAD)-${BUILD_ID}
#echo "Image tag: $IMAGE_TAG"

# generate quick-start.yaml
/cluster-configuration/genClusterQuickStart.sh


# Step 1. Generate config
#export CONFIG_PATH=/cluster-configuration
./paictl.py cluster generate-configuration -i /quick-start.yaml -o /cluster-configuration

# update image tag
sed -i "46s/.*/    docker-tag: ${GIT_BRANCH/\\//-}-$(git rev-parse --short HEAD)-${BUILD_ID}/" /cluster-configuration/services-configuration.yaml

# setup vc
sed -i "66s/.*/  virtualClusters:/" /cluster-configuration/services-configuration.yaml
sed -i "67s/.*/    default:/" /cluster-configuration/services-configuration.yaml
sed -i "68s/.*/      description: Default VC./" /cluster-configuration/services-configuration.yaml
sed -i "69s/.*/      capacity: 100/" /cluster-configuration/services-configuration.yaml

# setup registry
/cluster-configuration/setupIntRegistry.sh

# delete service for next install
./paictl.py service delete -p /cluster-configuration

# clean k8s first
./paictl.py cluster k8s-clean -p /cluster-configuration << EOF
Y
EOF

# Step 2. Boot up Kubernetes
# install k8s
./paictl.py cluster k8s-bootup -p /cluster-configuration

# TODO waiting for 9090 ready
#echo "Waiting k8s dashboard to launch on 9090..."
#timeout 30 bash -c \'until printf "" 2>>/dev/null >>/dev/tcp/$0/$1; do sleep 1; done\' 10.0.1.5 9090


# tep 3. Start all PAI services
# start pai services
./paictl.py service start -p /cluster-configuration


EOF_DEV_BOX
'''
          }
        }
      }
    }
  }
  options {
    disableConcurrentBuilds()
  }
}