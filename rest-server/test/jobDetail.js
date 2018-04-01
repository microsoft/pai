// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the 'Software'), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// test
describe('JobDetail API /api/v1/jobs/:jobName', () => {
  // Mock launcher webservice
  beforeEach(() => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test_job')
      .reply(200, {
        'summarizedFrameworkInfo': {
          'frameworkName': 'test_job',
          'frameworkVersion': 10,
          'executionType': 'START',
          'frameworkDescription': null,
          'userName': 'admin',
          'queue': 'vc3',
          'firstRequestTimestamp': 1522559373599,
          'lastRequestTimestamp': 1522559373599,
          'frameworkState': 'FRAMEWORK_COMPLETED',
          'frameworkRetryPolicyState': {
            'retriedCount': 0,
            'transientNormalRetriedCount': 0,
            'transientConflictRetriedCount': 0,
            'nonTransientRetriedCount': 0,
            'unKnownRetriedCount': 0
          },
          'frameworkCompletedTimestamp': 1522560400212,
          'applicationExitCode': 177
        },
        'aggregatedFrameworkRequest': {
          'frameworkRequest': {
            'frameworkName': 'test_job',
            'frameworkDescriptor': {
              'description': null,
              'version': 10,
              'executionType': 'START',
              'retryPolicy': {
                'maxRetryCount': 0,
                'fancyRetryPolicy': false
              },
              'parentFramework': null,
              'user': {
                'name': 'admin'
              },
              'taskRoles': {
                'ptb_instance': {
                  'taskNumber': 1,
                  'scaleUnitNumber': 1,
                  'scaleUnitTimeoutSec': 0,
                  'taskRetryPolicy': {
                    'maxRetryCount': 0,
                    'fancyRetryPolicy': false
                  },
                  'taskService': {
                    'version': 0,
                    'entryPoint': 'source YarnContainerScripts/0.sh',
                    'sourceLocations': [
                      '/Container/admin/test_job/YarnContainerScripts'
                    ],
                    'resource': {
                      'cpuNumber': 2,
                      'memoryMB': 16384,
                      'portRanges': [

                      ],
                      'diskType': 'HDD',
                      'diskMB': 0,
                      'gpuNumber': 0,
                      'gpuAttribute': 0
                    }
                  },
                  'platformSpecificParameters': {
                    'taskNodeLabel': null,
                    'taskNodeGpuType': null
                  }
                }
              },
              'platformSpecificParameters': {
                'amResource': null,
                'amNodeLabel': null,
                'taskNodeLabel': null,
                'taskNodeGpuType': null,
                'queue': 'vc3',
                'containerConnectionMaxLostCount': -2,
                'containerConnectionMaxExceedCount': 2,
                'antiaffinityAllocation': false,
                'killAllOnAnyCompleted': true,
                'killAllOnAnyServiceCompleted': true,
                'generateContainerIpList': true,
                'amType': 'DEFAULT',
                'agentUseHeartbeat': false,
                'agentHeartbeatIntervalSec': 30,
                'agentExpiryIntervalSec': 180,
                'agentUseHealthCheck': false,
                'taskServiceHealthCheck': null
              }
            },
            'launchClientType': 'UNKNOWN',
            'launchClientHostName': '172.17.0.3',
            'launchClientUserName': 'UNKNOWN',
            'firstRequestTimestamp': 1522559373599,
            'lastRequestTimestamp': 1522559373599
          },
          'overrideApplicationProgressRequest': null,
          'migrateTaskRequests': null
        },
        'aggregatedFrameworkStatus': {
          'frameworkStatus': {
            'frameworkName': 'test_job',
            'frameworkVersion': 10,
            'frameworkState': 'FRAMEWORK_COMPLETED',
            'frameworkRetryPolicyState': {
              'retriedCount': 0,
              'transientNormalRetriedCount': 0,
              'transientConflictRetriedCount': 0,
              'nonTransientRetriedCount': 0,
              'unKnownRetriedCount': 0
            },
            'frameworkCreatedTimestamp': 1522559373599,
            'frameworkCompletedTimestamp': 1522560400212,
            'applicationId': 'application_1522466352615_0006',
            'applicationProgress': 1,
            'applicationTrackingUrl': 'http://10.151.40.133:8088/proxy/application_1522466352615_0006/',
            'applicationLaunchedTimestamp': 1522559423939,
            'applicationCompletedTimestamp': 1522560400168,
            'applicationExitCode': 177,
            'applicationExitDiagnostics': '[ExitStatus]: LAUNCHER_EXIT_STATUS_UNDEFINED\n[ExitCode]: 177\n[ExitDiagnostics]:\nExitStatus undefined in Launcher, maybe UserApplication itself failed.\n[ExitType]: UNKNOWN\n________________________________________________________________________________________________________________________________________________________________________________________________________\n[ExitCustomizedDiagnostics]:\n<Raw>[ExitCode]: 1\n<Raw>[ExitDiagnostics]:\nException from container-launch.\nContainer id: container_e11_1522466352615_0006_01_000002\nExit code: 1\nStack trace: ExitCodeException exitCode=1: \n\tat org.apache.hadoop.util.Shell.runCommand(Shell.java:545)\n\tat org.apache.hadoop.util.Shell.run(Shell.java:456)\n\tat org.apache.hadoop.util.Shell$ShellCommandExecutor.execute(Shell.java:722)\n\tat org.apache.hadoop.yarn.server.nodemanager.DefaultContainerExecutor.launchContainer(DefaultContainerExecutor.java:212)\n\tat org.apache.hadoop.yarn.server.nodemanager.containermanager.launcher.ContainerLaunch.call(ContainerLaunch.java:302)\n\tat org.apache.hadoop.yarn.server.nodemanager.containermanager.launcher.ContainerLaunch.call(ContainerLaunch.java:82)\n\tat java.util.concurrent.FutureTask.run(FutureTask.java:266)\n\tat java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)\n\tat java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)\n\tat java.lang.Thread.run(Thread.java:748)\n\nShell output: [ERROR] EXIT signal received in yarn container, exiting ...\n\n\nContainer exited with a non-zero exit code 1\n\n________________________________________________________________________________________________________________________________________________________________________________________________________\n<Raw>[ExitCustomizedDiagnostics]:\n\n[ptb_instance][0]: TASK_COMPLETED:\n[TaskStatus]:\n{\n  \'taskIndex\': 0,\n  \'taskRoleName\': \'ptb_instance\',\n  \'taskState\': \'TASK_COMPLETED\',\n  \'taskRetryPolicyState\': {\n    \'retriedCount\': 0,\n    \'transientNormalRetriedCount\': 0,\n    \'transientConflictRetriedCount\': 0,\n    \'nonTransientRetriedCount\': 0,\n    \'unKnownRetriedCount\': 0\n  },\n  \'taskCreatedTimestamp\': 1522559440659,\n  \'taskCompletedTimestamp\': 1522560381565,\n  \'taskServiceStatus\': {\n    \'serviceVersion\': 0\n  },\n  \'containerId\': \'container_e11_1522466352615_0006_01_000002\',\n  \'containerHost\': \'10.151.40.131\',\n  \'containerIp\': \'10.151.40.131\',\n  \'containerGpus\': 0,\n  \'containerLogHttpAddress\': \'http://10.151.40.131:8042/node/containerlogs/container_e11_1522466352615_0006_01_000002/admin/\',\n  \'containerConnectionLostCount\': 0,\n  \'containerIsDecommissioning\': null,\n  \'containerLaunchedTimestamp\': 1522559442904,\n  \'containerCompletedTimestamp\': 1522560381557,\n  \'containerExitCode\': 1,\n  \'containerExitDiagnostics\': \'Exception from container-launch.\\nContainer id: container_e11_1522466352615_0006_01_000002\\nExit code: 1\\nStack trace: ExitCodeException exitCode=1: \\n\\tat org.apache.hadoop.util.Shell.runCommand(Shell.java:545)\\n\\tat org.apache.hadoop.util.Shell.run(Shell.java:456)\\n\\tat org.apache.hadoop.util.Shell$ShellCommandExecutor.execute(Shell.java:722)\\n\\tat org.apache.hadoop.yarn.server.nodemanager.DefaultContainerExecutor.launchContainer(DefaultContainerExecutor.java:212)\\n\\tat org.apache.hadoop.yarn.server.nodemanager.containermanager.launcher.ContainerLaunch.call(ContainerLaunch.java:302)\\n\\tat org.apache.hadoop.yarn.server.nodemanager.containermanager.launcher.ContainerLaunch.call(ContainerLaunch.java:82)\\n\\tat java.util.concurrent.FutureTask.run(FutureTask.java:266)\\n\\tat java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)\\n\\tat java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)\\n\\tat java.lang.Thread.run(Thread.java:748)\\n\\nShell output: [ERROR] EXIT signal received in yarn container, exiting ...\\n\\n\\nContainer exited with a non-zero exit code 1\\n\',\n  \'containerExitType\': \'UNKNOWN\'\n}\n[ContainerDiagnostics]:\nContainer completed container_e11_1522466352615_0006_01_000002 on HostName 10.151.40.131.\nContainerLogHttpAddress: http://10.151.40.131:8042/node/containerlogs/container_e11_1522466352615_0006_01_000002/admin/\nAppCacheNetworkPath: 10.151.40.131:/tmp/hadoop-root/nm-local-dir/usercache/admin/appcache/application_1522466352615_0006\nContainerLogNetworkPath: 10.151.40.131:/usr/local/hadoop/logs/userlogs/application_1522466352615_0006/container_e11_1522466352615_0006_01_000002\n________________________________________________________________________________________________________________________________________________________________________________________________________\n[AMStopReason]:Task [ptb_instance][0] Completed and KillAllOnAnyCompleted enabled.\n',
            'applicationExitType': 'UNKNOWN'
          },
          'aggregatedTaskRoleStatuses': {
            'ptb_instance': {
              'taskRoleStatus': {
                'taskRoleName': 'ptb_instance',
                'taskRoleRolloutStatus': {
                  'overallRolloutServiceVersion': null,
                  'overallRolloutStatus': 'UNKNOWN',
                  'overallRolloutStartTimestamp': null,
                  'overallRolloutEndTimestamp': null,
                  'currentRolloutScaleUnit': null,
                  'currentRolloutTaskIndexes': null,
                  'currentRolloutStatus': 'UNKNOWN',
                  'currentRolloutStartTimestamp': null,
                  'currentRolloutEndTimestamp': null
                },
                'frameworkVersion': 10
              },
              'taskStatuses': {
                'taskRoleName': 'ptb_instance',
                'taskStatusArray': [
                  {
                    'taskIndex': 0,
                    'taskRoleName': 'ptb_instance',
                    'taskState': 'TASK_COMPLETED',
                    'taskRetryPolicyState': {
                      'retriedCount': 0,
                      'transientNormalRetriedCount': 0,
                      'transientConflictRetriedCount': 0,
                      'nonTransientRetriedCount': 0,
                      'unKnownRetriedCount': 0
                    },
                    'taskCreatedTimestamp': 1522559440659,
                    'taskCompletedTimestamp': 1522560381565,
                    'taskServiceStatus': {
                      'serviceVersion': 0
                    },
                    'containerId': 'container_e11_1522466352615_0006_01_000002',
                    'containerHost': '10.151.40.131',
                    'containerIp': '10.151.40.131',
                    'containerGpus': 0,
                    'containerLogHttpAddress': 'http://10.151.40.131:8042/node/containerlogs/container_e11_1522466352615_0006_01_000002/admin/',
                    'containerConnectionLostCount': 0,
                    'containerIsDecommissioning': null,
                    'containerLaunchedTimestamp': 1522559442904,
                    'containerCompletedTimestamp': 1522560381557,
                    'containerExitCode': 1,
                    'containerExitDiagnostics': 'Exception from container-launch.\nContainer id: container_e11_1522466352615_0006_01_000002\nExit code: 1\nStack trace: ExitCodeException exitCode=1: \n\tat org.apache.hadoop.util.Shell.runCommand(Shell.java:545)\n\tat org.apache.hadoop.util.Shell.run(Shell.java:456)\n\tat org.apache.hadoop.util.Shell$ShellCommandExecutor.execute(Shell.java:722)\n\tat org.apache.hadoop.yarn.server.nodemanager.DefaultContainerExecutor.launchContainer(DefaultContainerExecutor.java:212)\n\tat org.apache.hadoop.yarn.server.nodemanager.containermanager.launcher.ContainerLaunch.call(ContainerLaunch.java:302)\n\tat org.apache.hadoop.yarn.server.nodemanager.containermanager.launcher.ContainerLaunch.call(ContainerLaunch.java:82)\n\tat java.util.concurrent.FutureTask.run(FutureTask.java:266)\n\tat java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)\n\tat java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)\n\tat java.lang.Thread.run(Thread.java:748)\n\nShell output: [ERROR] EXIT signal received in yarn container, exiting ...\n\n\nContainer exited with a non-zero exit code 1\n',
                    'containerExitType': 'UNKNOWN'
                  }
                ],
                'frameworkVersion': 10
              }
            }
          }
        }
      });

    global.nock(global.launcherWebserviceUri)
      .get('/v1/Frameworks/test_job2')
      .reply(404, {
        'error':'JobNotFound',
        'message':'could not find job test_job2'
      });
  });

  //
  // Positive cases
  //
  // GET /api/v1/jobs/test_job
  it('Case 1 (Positive): should return test_job detail info', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/test_job')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        done();
      });
  });

  //
  // Negative cases
  //
  // GET /api/v1/jobs/test_job
  it('Case 1 (Negative): job does not exist should return error', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/test_job2')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res, 'json response').be.json;
        done();
      });
  });
});
