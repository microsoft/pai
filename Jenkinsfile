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
    stage('Build Images') {
      agent {
        node {
          label 'dev-box'
        }

        }
        steps {
          sh '''#! /bin/bash

set -ex

# prepare path
sudo mkdir -p ${JENKINS_HOME}/${BED}/singlebox/quick-start
sudo mkdir -p ${JENKINS_HOME}/${BED}/singlebox/cluster-configuration
sudo chown core:core -R $JENKINS_HOME
sudo chown core:core -R /pathHadoop/
QUICK_START_PATH=${JENKINS_HOME}/${BED}/singlebox/quick-start
CONFIG_PATH=${JENKINS_HOME}/${BED}/singlebox/cluster-configuration
cd pai-management/

# generate quick-start
$JENKINS_HOME/scripts/${BED}-gen_single-box.sh ${QUICK_START_PATH}
# ! fix permission
sudo chown core:core -R /mnt/jenkins/workspace

# generate config
ls $CONFIG_PATH/
rm -rf $CONFIG_PATH/*.yaml
./paictl.py cluster generate-configuration -i ${QUICK_START_PATH}/quick-start.yaml -o $CONFIG_PATH
# update image tag
sed -i "38s/.*/    docker-tag: ${IMAGE_TAG}/" $CONFIG_PATH/services-configuration.yaml
# setup registry
$JENKINS_HOME/scripts/setup_azure_int_registry.sh $CONFIG_PATH

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
# setup registry
/jenkins/scripts/setup_azure_int_registry.sh /cluster-configuration

# Step 2. Boot up Kubernetes
# install k8s
./paictl.py cluster k8s-bootup -p /cluster-configuration

# Step 3. Start all PAI services
# start pai services
./paictl.py service start -p /cluster-configuration

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
# setup registry
/jenkins/scripts/setup_azure_int_registry.sh /cluster-configuration

# Step 2. Boot up Kubernetes
# install k8s
./paictl.py cluster k8s-bootup -p /cluster-configuration

# Step 3. Start all PAI services
# start pai services
./paictl.py service start -p /cluster-configuration

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
    stage('Test') {
      parallel {
        stage('Test A SingleBox') {
          agent {
            node {
              label 'dev-box'
            }

          }
          steps {
            script {
              env.SINGLE_BOX_URL = readFile("${JENKINS_HOME}/${BED}/singlebox/quick-start/pai_url.txt").trim()
              echo "${SINGLE_BOX_URL}"
              // env.PAI_ENDPOINT = readFile("${JENKINS_HOME}/${BED}/singlebox/quick-start/pai_url.txt").trim()

              if(currentBuild.result == 'FAILURE') {
                echo "Deploy Failed!!! Skip test!"
              } else {
                try {
                  timeout(time: 15, unit: 'MINUTES'){
                    def responseCode = 500
                    while(!responseCode.equals(200)){
                      try {
                        sleep(6)
                        echo "Waiting for PAI to be ready ..."

                        def response = httpRequest(env.SINGLE_BOX_URL)
                        println("Status: "+response.status)
                        println("Content: "+response.content)

                        responseCode = response.status
                        echo "Response code: ${responseCode}."
                      } catch (err) {
                        if(err instanceof org.jenkinsci.plugins.workflow.steps.FlowInterruptedException){
                          echo "Timout!"
                          currentBuild.result = 'FAILURE'
                          break;
                        }
                        echo "PAI is not ready: ${err}"
                      }
                    }
                  }

                  sh (
                    //returnStatus: true,
                    script: '''#!/bin/bash

set -ex
#set -euxo pipefail

sleep 60

TOKEN=$(
curl --silent --verbose \
$SINGLE_BOX_URL/rest-server/api/v1/token \
--header 'Content-Type: application/json' \
--data '{
"username": "admin",
"password": "admin-password",
"expiration": 3600
}' \\
| python -c "import sys,json;sys.stdout.write(json.loads(sys.stdin.read())['token'])"
)

# Submit a job
JOB_NAME="e2e-test-$RANDOM-$RANDOM"
curl --silent --verbose \
--request POST \
$SINGLE_BOX_URL/rest-server/api/v1/jobs \
--header "Authorization: Bearer $TOKEN" \
--header 'Content-Type: application/json' \
--data "{
\\"jobName\\": \\"$JOB_NAME\\",
\\"image\\": \\"aiplatform/pai.run.cntk\\",
\\"taskRoles\\": [
{
\\"name\\": \\"Master\\",
\\"taskNumber\\": 1,
\\"cpuNumber\\": 1,
\\"memoryMB\\": 256,
\\"command\\": \\"/bin/bash --version\\"
}
]
}"
while :; do
sleep 10
STATUS=$(
curl --silent --verbose $SINGLE_BOX_URL/rest-server/api/v1/jobs/$JOB_NAME \
| python -c "import sys,json;sys.stdout.write(json.loads(sys.stdin.read())['jobStatus']['state'])"
)
if [ "$STATUS" == 'SUCCEEDED' ]; then exit 0; fi
if [ "$STATUS" != 'WAITING' ] && [ "$STATUS" != 'RUNNING' ]; then exit 1; fi
done


'''
                  )
                } catch (err) {
                  echo "Failed: ${err}"
                  currentBuild.result = 'FAILURE'
                }
              }
            }
          }
        }
        stage('Test Cluster') {
          agent {
            node {
              label 'dev-box'
            }

          }
          steps {
            script {
              env.CLUSTER_URL = readFile("${JENKINS_HOME}/${BED}/cluster/quick-start/pai_url.txt").trim()
              echo "${CLUSTER_URL}"
              // env.PAI_ENDPOINT = readFile("${JENKINS_HOME}/${BED}/cluster/quick-start/pai_url.txt").trim()

              if(currentBuild.result == 'FAILURE') {
                echo "Deploy Failed!!! Skip test!"
              } else {
                try {
                  timeout(time: 15, unit: 'MINUTES'){
                    def responseCode = 500
                    while(!responseCode.equals(200)){
                      try {
                        sleep(6)
                        echo "Waiting for PAI to be ready ..."

                        def response = httpRequest(env.CLUSTER_URL)
                        println("Status: "+response.status)
                        println("Content: "+response.content)

                        responseCode = response.status
                        echo "Response code: ${responseCode}."
                      } catch (err) {
                        if(err instanceof org.jenkinsci.plugins.workflow.steps.FlowInterruptedException){
                          echo "Timout!"
                          currentBuild.result = 'FAILURE'
                          break;
                        }

                        echo "PAI is not ready: ${err}"
                      }
                    }
                  }

                  sh (
                    //returnStatus: true,
                    script: '''#!/bin/bash

set -ex
#set -euxo pipefail

sleep 60

TOKEN=$(
curl --silent --verbose \
$CLUSTER_URL/rest-server/api/v1/token \
--header 'Content-Type: application/json' \
--data '{
"username": "admin",
"password": "admin-password",
"expiration": 3600
}' \\
| python -c "import sys,json;sys.stdout.write(json.loads(sys.stdin.read())['token'])"
)

# Submit a job
JOB_NAME="e2e-test-$RANDOM-$RANDOM"
curl --silent --verbose \
--request POST \
$CLUSTER_URL/rest-server/api/v1/jobs \
--header "Authorization: Bearer $TOKEN" \
--header 'Content-Type: application/json' \
--data "{
\\"jobName\\": \\"$JOB_NAME\\",
\\"image\\": \\"aiplatform/pai.run.cntk\\",
\\"taskRoles\\": [
{
\\"name\\": \\"Master\\",
\\"taskNumber\\": 1,
\\"cpuNumber\\": 1,
\\"memoryMB\\": 256,
\\"command\\": \\"/bin/bash --version\\"
}
]
}"
while :; do
sleep 10
STATUS=$(
curl --silent --verbose $CLUSTER_URL/rest-server/api/v1/jobs/$JOB_NAME \
| python -c "import sys,json;sys.stdout.write(json.loads(sys.stdin.read())['jobStatus']['state'])"
)
if [ "$STATUS" == 'SUCCEEDED' ]; then exit 0; fi
if [ "$STATUS" != 'WAITING' ] && [ "$STATUS" != 'RUNNING' ]; then exit 1; fi
done


'''
                  )
                } catch (err) {
                  echo "Failed: ${err}"
                  currentBuild.result = 'FAILURE'
                }
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
./paictl.py service delete -p /cluster-configuration

# clean k8s
./paictl.py cluster k8s-clean -p /cluster-configuration << EOF
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
./paictl.py service delete -p /cluster-configuration

# clean k8s
./paictl.py cluster k8s-clean -p /cluster-configuration << EOF
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
