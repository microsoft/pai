pipeline {
  agent {
    node {
      label 'pipeline'
    }

  }
  stages {
    stage('Choose Deployment Bed') {
      steps {
        script {
          sh (
            script: '''#!/bin/bash
set -ex
IFS=", " read -r -a labels <<< "$NODE_NAME"
#echo ${labels[@]}
echo ${labels[0]} > ${WORKSPACE}/BED.txt
''',
            returnStdout: true
          )
          env.BED = readFile("${WORKSPACE}/BED.txt").trim()
          echo "Select CI Cluster: ${BED}"

          sh '''#!/bin/bash
set -ex

echo ${GIT_BRANCH/\\//-}-$(git rev-parse --short HEAD)-${BUILD_ID} > ${WORKSPACE}/IMAGE_TAG.txt
'''
          env.IMAGE_TAG = readFile("${WORKSPACE}/IMAGE_TAG.txt").trim()
          echo "Image tag: ${IMAGE_TAG}"
        }

        //sh 'printenv'
      }
    }
    stage('Clean dev-box') {
      agent {
        node {
          label 'dev-box'
        }

      }
      steps {
        sh '''#!/bin/bash
set -ex
sudo --preserve-env $JENKINS_HOME/scripts/prepare_build_env.sh'''
        }
    }

    stage('Deploy') {
      parallel {
        stage('Install A SingleBox') {
          agent {
            node {
              label 'dev-box'
            }

          }
          steps {
            sh '''#!/bin/bash
set -ex

CONFIG_PATH=${JENKINS_HOME}/${BED}/singlebox/cluster-configuration
QUICK_START_PATH=${JENKINS_HOME}/${BED}/singlebox/quick-start

# Run your dev-box
# Assume the path of custom-hadoop-binary-path in your service-configuration is /pathHadoop.
# Assume the directory path of your cluster-configuration is /pathConfiguration.
# By now, you can leave it as it is, we only mount those two directories into docker container for later usage.
sudo docker run -itd \
  -e COLUMNS=$COLUMNS \
  -e LINES=$LINES \
  -e TERM=$TERM \
  -v /var/lib/docker:/var/lib/docker \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /var/lib/jenkins/scripts:/jenkins/scripts \
  -v /pathHadoop:/pathHadoop \
  -v ${CONFIG_PATH}:/cluster-configuration \
  -v ${QUICK_START_PATH}:/quick-start \
  --pid=host \
  --privileged=true \
  --net=host \
  --name=dev-box-singlebox \
  openpai.azurecr.io/paiclusterint/dev-box > SINGLE_BOX_DEV_BOX.txt

'''
            script {
              env.SINGLE_BOX_DEV_BOX = readFile("$WORKSPACE/SINGLE_BOX_DEV_BOX.txt").trim()
            }

            script {
              try {
                sh '''#!/bin/bash
set -ex

# Working in your dev-box
sudo docker exec -i ${SINGLE_BOX_DEV_BOX} /bin/bash <<EOF_DEV_BOX
set -ex

# prepare directory
rm -rf /cluster-configuration/cluster-configuration.yaml
rm -rf /cluster-configuration/k8s-role-definition.yaml
rm -rf /cluster-configuration/kubernetes-configuration.yaml
rm -rf /cluster-configuration/services-configuration.yaml
cd /pai/pai-management

# Choose the branch
if [[ $GIT_BRANCH == PR* ]];
then
    #PR_ID=$(echo ${GIT_BRANCH} | cut -d\'-\' -f 2)
    git fetch origin pull/$(echo ${GIT_BRANCH} | cut -d\'-\' -f 2)/head:${GIT_BRANCH}
    git checkout ${GIT_BRANCH}
else
    git fetch origin ${GIT_BRANCH}
    git checkout --track origin/${GIT_BRANCH}
    git reset --hard origin/${GIT_BRANCH}
fi

# Create quick-start.yaml
/jenkins/scripts/${BED}-gen_single-box.sh /quick-start

# Step 1. Generate config
./paictl.py cluster generate-configuration -i /quick-start/quick-start.yaml -o /cluster-configuration
# update image tag
sed -i "38s/.*/    docker-tag: ${IMAGE_TAG}/" /cluster-configuration/services-configuration.yaml
# change ectdid, zkid
sed -i "41s/.*/    etcdid: singleboxetcdid1/" /cluster-configuration/cluster-configuration.yaml
sed -i "42s/.*/    zkid: "1"/" /cluster-configuration/cluster-configuration.yaml
# setup registry
/jenkins/scripts/setup_azure_int_registry.sh /cluster-configuration

# Step 2. Boot up Kubernetes
# install k8s
./paictl.py cluster k8s-bootup -p /cluster-configuration

# ! TODO wait for cluster ready
sleep 6s

# Step 3. Start all PAI services
# start pai services
# TODO
#./paictl.py service start -p /cluster-configuration

EOF_DEV_BOX

sudo chown core:core -R $JENKINS_HOME
sudo chown core:core -R /pathHadoop/
sudo chown core:core -R /mnt/jenkins/workspace

'''
              } catch (err) {
                echo "Deploy SingleBox Failed: ${err}"
                currentBuild.result = 'FAILURE'
              }
            }
          }
        }
        stage('Install Cluster') {
          agent {
            node {
              label 'dev-box'
            }

          }
          steps {
            sh '''#!/bin/bash
set -ex

CONFIG_PATH=${JENKINS_HOME}/${BED}/cluster/cluster-configuration
QUICK_START_PATH=${JENKINS_HOME}/${BED}/cluster/quick-start

# Run your dev-box
# Assume the path of custom-hadoop-binary-path in your service-configuration is /pathHadoop.
# Assume the directory path of your cluster-configuration is /pathConfiguration.
# By now, you can leave it as it is, we only mount those two directories into docker container for later usage.
sudo docker run -itd \
  -e COLUMNS=$COLUMNS \
  -e LINES=$LINES \
  -e TERM=$TERM \
  -v /var/lib/docker:/var/lib/docker \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /var/lib/jenkins/scripts:/jenkins/scripts \
  -v /pathHadoop:/pathHadoop \
  -v ${CONFIG_PATH}:/cluster-configuration \
  -v ${QUICK_START_PATH}:/quick-start \
  --pid=host \
  --privileged=true \
  --net=host \
  --name=dev-box-cluster \
  openpai.azurecr.io/paiclusterint/dev-box > CLUSTER_DEV_BOX.txt

'''
            script {
              env.CLUSTER_DEV_BOX = readFile("$WORKSPACE/CLUSTER_DEV_BOX.txt").trim()
            }

            script {
              try {
                sh '''#!/bin/bash
set -ex

# Working in your dev-box
sudo docker exec -i ${CLUSTER_DEV_BOX} /bin/bash <<EOF_DEV_BOX
set -ex

# prepare directory
rm -rf /cluster-configuration/cluster-configuration.yaml
rm -rf /cluster-configuration/k8s-role-definition.yaml
rm -rf /cluster-configuration/kubernetes-configuration.yaml
rm -rf /cluster-configuration/services-configuration.yaml
cd /pai/pai-management

# Choose the branch
if [[ $GIT_BRANCH == PR* ]];
then
    #PR_ID=$(echo ${GIT_BRANCH} | cut -d\'-\' -f 2)
    git fetch origin pull/$(echo ${GIT_BRANCH} | cut -d\'-\' -f 2)/head:${GIT_BRANCH}
    git checkout ${GIT_BRANCH}
else
    git fetch origin ${GIT_BRANCH}
    git checkout --track origin/${GIT_BRANCH}
    git reset --hard origin/${GIT_BRANCH}
fi

# Create quick-start.yaml
/jenkins/scripts/${BED}-gen_cluster.sh /quick-start

# Step 1. Generate config
./paictl.py cluster generate-configuration -i /quick-start/quick-start.yaml -o /cluster-configuration
# update image tag
sed -i "38s/.*/    docker-tag: ${IMAGE_TAG}/" /cluster-configuration/services-configuration.yaml
# change ectdid, zkid
sed -i "41s/.*/    etcdid: clusteretcdid1/" /cluster-configuration/cluster-configuration.yaml
sed -i "42s/.*/    zkid: "2"/" /cluster-configuration/cluster-configuration.yaml
# setup registry
/jenkins/scripts/setup_azure_int_registry.sh /cluster-configuration

# Step 2. Boot up Kubernetes
# install k8s
./paictl.py cluster k8s-bootup -p /cluster-configuration

# ! TODO wait for cluster ready
sleep 6s

# Step 3. Start all PAI services
# start pai services
# TODO
#./paictl.py service start -p /cluster-configuration

EOF_DEV_BOX

sudo chown core:core -R $JENKINS_HOME
sudo chown core:core -R /pathHadoop/
sudo chown core:core -R /mnt/jenkins/workspace

'''
              } catch (err) {
                echo "Deploy Cluster Failed: ${err}"
                currentBuild.result = 'FAILURE'
              }
            }
          }
        }
      }
    }

    stage('Pause on failure') {
      agent {
        node {
          label 'dev-box'
        }

      }
      steps {
        script {
          try {
            if(currentBuild.result == 'FAILURE'){
              def pauseNow
              timeout(time: 15, unit: 'MINUTES'){
                pauseNow= input(message: 'Do you want to reserve the environment for debug?', ok: 'Yes',
                parameters: [booleanParam(defaultValue: true,
                description: 'If you want to debug, click the Yes', name: 'Yes?')])

                echo "pauseNow:" + pauseNow
              }

              if(pauseNow){
                input (
                  message: 'Click "Proceed" to finish!'
                )
              }
            }
          } catch (err) {
            echo "Encountered error: ${err}"
            echo "Whatever, Will cleanup now!"
          }
        }

      }
    }
    stage('Clean Up') {
      parallel {
        stage('Clean up A SingleBox') {
          agent {
            node {
              label 'dev-box'
            }

          }
          steps {
            sh '''#!/bin/bash
set -x

# Working in your dev-box
sudo docker exec -i ${SINGLE_BOX_DEV_BOX} /bin/bash <<EOF_DEV_BOX
set -x

cd /pai/pai-management

# Choose the branch
if [[ $GIT_BRANCH == PR* ]];
then
    #PR_ID=$(echo ${GIT_BRANCH} | cut -d\'-\' -f 2)
    git fetch origin pull/$(echo ${GIT_BRANCH} | cut -d\'-\' -f 2)/head:${GIT_BRANCH}
    git checkout ${GIT_BRANCH}
else
    git fetch origin ${GIT_BRANCH}
    git checkout --track origin/${GIT_BRANCH}
    git reset --hard origin/${GIT_BRANCH}
fi

# delete service for next install
# TODO
#./paictl.py service start -p /cluster-configuration -n cluster-configuration
#
#./paictl.py service delete -p /cluster-configuration << EOF
#Y
#EOF

# clean k8s
./paictl.py cluster k8s-clean -p /cluster-configuration -f << EOF
Y
EOF

EOF_DEV_BOX

sudo docker rm -f ${SINGLE_BOX_DEV_BOX}

'''
          }
        }
        stage('Clean up Cluster') {
          agent {
            node {
              label 'dev-box'
            }

          }
          steps {
            sh '''#!/bin/bash
set -x

# Working in your dev-box
sudo docker exec -i ${CLUSTER_DEV_BOX} /bin/bash <<EOF_DEV_BOX
set -x

cd /pai/pai-management

# Choose the branch
if [[ $GIT_BRANCH == PR* ]];
then
    #PR_ID=$(echo ${GIT_BRANCH} | cut -d\'-\' -f 2)
    git fetch origin pull/$(echo ${GIT_BRANCH} | cut -d\'-\' -f 2)/head:${GIT_BRANCH}
    git checkout ${GIT_BRANCH}
else
    git fetch origin ${GIT_BRANCH}
    git checkout --track origin/${GIT_BRANCH}
    git reset --hard origin/${GIT_BRANCH}
fi

# delete service for next install
# TODO
#./paictl.py service start -p /cluster-configuration -n cluster-configuration
#
#./paictl.py service delete -p /cluster-configuration << EOF
#Y
#EOF

# clean k8s
./paictl.py cluster k8s-clean -p /cluster-configuration -f << EOF
Y
EOF

EOF_DEV_BOX

sudo docker rm -f ${CLUSTER_DEV_BOX}

'''
          }
        }
      }
    }
  }
  post {
    always {
      echo 'I am the end of pipeline'
    }

    success {
      echo 'I succeeeded!'
      office365ConnectorSend(
        status: "Build success",
        webhookUrl: "${env.HOOK}"
      )
    }

    unstable {
      echo 'I am unstable :/'

    }

    failure {
      echo 'I failed :('
      office365ConnectorSend(
        status: "Build failure",
        webhookUrl: "${env.HOOK}"
      )
      step([
            $class: 'Mailer',
            notifyEveryUnstableBuild: true,
            recipients: emailextrecipients([[$class: 'CulpritsRecipientProvider'], [$class: 'RequesterRecipientProvider']])
      ])
    }

    changed {
      echo 'Things were different before...'

    }

  }
  options {
    disableConcurrentBuilds()
  }
}
