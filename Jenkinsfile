#!groovy

// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// timeout in minutes
http_timeout = 10
pause_timeout = 1
jenkins_timeout = 120

// dev box agent node label
node_label = "dev-box"

sh = "bash -Eeuo pipefail"

// check health for http uri
def http_check_health(uri) {
  def status = 0
  while (!status.equals(200)) {
    try {
      echo "Waiting for PAI to be ready ..."
      sleep(30)
      def response = httpRequest(uri)
      println("Status: " + response.status)
      println("Content: " + response.content)
      status = response.status
    } catch (err) {
      if (err instanceof org.jenkinsci.plugins.workflow.steps.FlowInterruptedException) {
        echo "Http request timeout."
        currentBuild.result = "FAILURE"
        break;
      }
      echo "PAI is not ready: ${err}"
    }
  }
}

pipeline {
  environment {
    REGISTRY_URI = "10.0.1.5:5000"
    YARN_SINGLEBOX_URI = "http://10.0.1.6"
    YARN_CLUSTER_URI = "http://10.0.1.8"
    K8S_CLUSTER_URI = "http://10.0.3.6"
    ACCOUNT = credentials("USER_ACCOUNT")
  }
  agent {
    label "pipeline"
  }

  stages {
    // Occupy Bed
    stage("Occupy Bed") {
      steps {
        script {
          env.IMAGE_TAG = sh(
            returnStdout: true,
            script: '''#!/bin/bash
              echo ${GIT_BRANCH//\\//-}-$(git rev-parse --short HEAD)-${BUILD_ID}
            '''
          ).trim()
          echo "IMAGE_TAG=${IMAGE_TAG}"
          echo "NODE_NAME=${NODE_NAME}"
        }
      }
    }

    // Prepare Cluster
    stage("Prepare Cluster") {
      agent {
        label node_label
      }
      steps {
        sh "${sh} ${WORKSPACE}/tests/jenkins/stage_prepare.sh"
      }
    }

    // Build Images
    stage("Build Images") {
      agent {
        label node_label
      }
      steps {
        sh "${sh} ${WORKSPACE}/tests/jenkins/stage_build.sh"
      }
    }

    // Deploy PAI
    stage("Deploy PAI") {
      parallel {
        stage("YARN Single Box") {
          agent {
            label node_label
          }
          steps {
            script {
              try {
                sh "${sh} ${WORKSPACE}/tests/jenkins/stage_deploy.sh yarn singlebox"
              } catch (err) {
                echo "Deploy YARN Single Box Failed: ${err}"
                currentBuild.result = "FAILURE"
              }
            }
          }
        }
        stage("YARN Cluster") {
          agent {
            label node_label
          }
          steps {
            script {
              try {
                sh "${sh} ${WORKSPACE}/tests/jenkins/stage_deploy.sh yarn cluster"
              } catch (err) {
                echo "Deploy YARN Cluster Failed: ${err}"
                currentBuild.result = "FAILURE"
              }
            }
          }
        }
        stage("Pure K8S Cluster") {
          agent {
            label node_label
          }
          steps {
            script {
              try {
                sh "${sh} ${WORKSPACE}/tests/jenkins/stage_deploy.sh k8s cluster"
              } catch (err) {
                echo "Deploy Pure K8S Cluster Failed: ${err}"
                currentBuild.result = "FAILURE"
              }
            }
          }
        }
      }
    }

    // Test PAI
    stage("Test PAI") {
      parallel {
        stage("YARN Single Box") {
          agent {
            label node_label
          }
          steps {
            script {
              if (currentBuild.result == "FAILURE") {
                echo "Deploy failed, skip test."
              } else {
                try {
                  timeout(time: http_timeout, unit: "MINUTES") {
                    http_check_health("${YARN_SINGLEBOX_URI}/rest-server/api/v1")
                    sh "${sh} ${WORKSPACE}/tests/jenkins/stage_test.sh yarn ${YARN_SINGLEBOX_URI}/rest-server"
                  }
                } catch (err) {
                  echo "Test YARN Single Box Failed: ${err}"
                  currentBuild.result = "FAILURE"
                }
              }
            }
          }
        }
        stage("YARN Cluster") {
          agent {
            label node_label
          }
          steps {
            script {
              if (currentBuild.result == "FAILURE") {
                echo "Deploy failed, skip test."
              } else {
                try {
                  timeout(time: http_timeout, unit: "MINUTES") {
                    http_check_health("${YARN_CLUSTER_URI}/rest-server/api/v1")
                    sh "${sh} ${WORKSPACE}/tests/jenkins/stage_test.sh yarn ${YARN_CLUSTER_URI}/rest-server"
                  }
                } catch (err) {
                  echo "Test YARN Cluster Failed: ${err}"
                  currentBuild.result = "FAILURE"
                }
              }
            }
          }
        }
        stage("Pure K8S Cluster") {
          agent {
            label node_label
          }
          steps {
            script {
              if (currentBuild.result == "FAILURE") {
                echo "Deploy failed, skip test."
              } else {
                try {
                  timeout(time: http_timeout, unit: "MINUTES") {
                    http_check_health("${K8S_CLUSTER_URI}/rest-server/api/v1")
                    sh "${sh} ${WORKSPACE}/tests/jenkins/stage_test.sh k8s ${K8S_CLUSTER_URI}/rest-server"
                  }
                } catch (err) {
                  echo "Test Pure K8S Cluster Failed: ${err}"
                  currentBuild.result = "FAILURE"
                }
              }
            }
          }
        }
      }
    }

    // Pause on Failure
    stage("Pause on Failure") {
      steps {
        script {
          try {
            if (currentBuild.result == "FAILURE") {
              def pauseNow
              timeout(time: pause_timeout, unit: "MINUTES") {
                pauseNow = input(
                  message: "Do you want to reserve the environment for debug?",
                  ok: "Yes",
                  parameters: [booleanParam(
                    defaultValue: true,
                    description: "If you want to debug, click the Yes", name: "Yes?"
                  )]
                )
                echo "pauseNow: " + pauseNow
              }
              if (pauseNow) {
                input (message: 'Click "Proceed" to finish!')
              }
            }
          } catch (err) {
            echo "Encountered error: ${err}"
            echo "Whatever, Will clean up cluster now!"
          }
        }
      }
    }

    // Clean up Cluster
    stage("Clean up Cluster") {
      parallel {
        stage("YARN Single Box") {
          agent {
            label node_label
          }
          steps {
            sh "${sh} ${WORKSPACE}/tests/jenkins/stage_clean.sh yarn singlebox"
          }
        }
        stage("YARN Cluster") {
          agent {
            label node_label
          }
          steps {
            sh "${sh} ${WORKSPACE}/tests/jenkins/stage_clean.sh yarn cluster"
          }
        }
        stage("Pure K8S Cluster") {
          agent {
            label node_label
          }
          steps {
            sh "${sh} ${WORKSPACE}/tests/jenkins/stage_clean.sh k8s cluster"
          }
        }
      }
    }
  }

  post {
    always {
      echo "The end of Jenkins pipeline."
    }
    success {
      echo "Jenkins succeeeded :)"
      office365ConnectorSend(
        status: "Build success",
        webhookUrl: "${env.HOOK}"
      )
    }
    unstable {
      echo "Jenkins is unstable :/"
    }
    failure {
      echo "Jenkins failed :("
      office365ConnectorSend(
        status: "Build failure",
        webhookUrl: "${env.HOOK}"
      )
      step([
        $class: "Mailer",
        notifyEveryUnstableBuild: true,
        recipients: emailextrecipients([
          [$class: "CulpritsRecipientProvider"],
          [$class: "RequesterRecipientProvider"]
        ]),
        to: "paialert@microsoft.com"
      ])
    }
    changed {
      echo "Things were different before ..."
    }
  }
  options {
    disableConcurrentBuilds()
    timeout(time: jenkins_timeout, unit: "MINUTES")
  }
}
