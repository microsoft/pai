pipeline {
  agent {
    node {
      label 'dev-box'
    }

  }
  stages {
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
              try {
                script {
                  env.BED = "bed1"
                }
                script {
                  env.SINGLE_BOX_URL = readFile("${JENKINS_HOME}/${BED}/singlebox/quick-start/pai_url.txt").trim()
                  echo "${SINGLE_BOX_URL}"
                }
                sh (
                  //returnStatus: true,
                  script: '''#!/bin/bash


set -x
#set -euxo pipefail
declare -r PAI_ENDPOINT=${SINGLE_BOX_URL}
TOKEN=$(
    curl --silent --verbose \
        $PAI_ENDPOINT/rest-server/api/v1/token \
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
    $PAI_ENDPOINT/rest-server/api/v1/jobs \
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
        curl --silent --verbose $PAI_ENDPOINT/rest-server/api/v1/jobs/$JOB_NAME \
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
        stage('Test Cluster') {
          agent {
            node {
              label 'dev-box'
            }

          }
          steps {
            script {
              try {
                script {
                  env.CLUSTER_URL = readFile("${JENKINS_HOME}/${BED}/cluster/quick-start/pai_url.txt").trim()
                  echo "${CLUSTER_URL}"
                }
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
  options {
    disableConcurrentBuilds()
  }
}