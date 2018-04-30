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

// test
describe('VC API /api/v1/virtual-clusters', () => {
  // Mock yarn rest api
  beforeEach(() => {
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, {
        "scheduler": {
          "schedulerInfo": {
            "capacity": 100.0,
            "maxCapacity": 100.0,
            "queueName": "root",
            "queues": {
              "queue": [
                {
                  "absoluteCapacity": 10.5,
                  "absoluteMaxCapacity": 50.0,
                  "absoluteUsedCapacity": 0.0,
                  "capacity": 10.5,
                  "maxCapacity": 50.0,
                  "numApplications": 0,
                  "queueName": "a",
                  "queues": {
                    "queue": [
                      {
                        "absoluteCapacity": 3.15,
                        "absoluteMaxCapacity": 25.0,
                        "absoluteUsedCapacity": 0.0,
                        "capacity": 30.000002,
                        "maxCapacity": 50.0,
                        "numApplications": 0,
                        "queueName": "a1",
                        "queues": {
                          "queue": [
                            {
                              "absoluteCapacity": 2.6775,
                              "absoluteMaxCapacity": 25.0,
                              "absoluteUsedCapacity": 0.0,
                              "capacity": 85.0,
                              "maxActiveApplications": 1,
                              "maxActiveApplicationsPerUser": 1,
                              "maxApplications": 267,
                              "maxApplicationsPerUser": 267,
                              "maxCapacity": 100.0,
                              "numActiveApplications": 0,
                              "numApplications": 0,
                              "numContainers": 0,
                              "numPendingApplications": 0,
                              "queueName": "a1a",
                              "resourcesUsed": {
                                "memory": 0,
                                "vCores": 0
                              },
                              "state": "RUNNING",
                              "type": "capacitySchedulerLeafQueueInfo",
                              "usedCapacity": 0.0,
                              "usedResources": "<memory:0, vCores:0>",
                              "userLimit": 100,
                              "userLimitFactor": 1.0,
                              "users": null
                            },
                            {
                              "absoluteCapacity": 0.47250003,
                              "absoluteMaxCapacity": 25.0,
                              "absoluteUsedCapacity": 0.0,
                              "capacity": 15.000001,
                              "maxActiveApplications": 1,
                              "maxActiveApplicationsPerUser": 1,
                              "maxApplications": 47,
                              "maxApplicationsPerUser": 47,
                              "maxCapacity": 100.0,
                              "numActiveApplications": 0,
                              "numApplications": 0,
                              "numContainers": 0,
                              "numPendingApplications": 0,
                              "queueName": "a1b",
                              "resourcesUsed": {
                                "memory": 0,
                                "vCores": 0
                              },
                              "state": "RUNNING",
                              "type": "capacitySchedulerLeafQueueInfo",
                              "usedCapacity": 0.0,
                              "usedResources": "<memory:0, vCores:0>",
                              "userLimit": 100,
                              "userLimitFactor": 1.0,
                              "users": null
                            }
                          ]
                        },
                        "resourcesUsed": {
                          "memory": 0,
                          "vCores": 0
                        },
                        "state": "RUNNING",
                        "usedCapacity": 0.0,
                        "usedResources": "<memory:0, vCores:0>"
                      },
                      {
                        "absoluteCapacity": 7.35,
                        "absoluteMaxCapacity": 50.0,
                        "absoluteUsedCapacity": 0.0,
                        "capacity": 70.0,
                        "maxActiveApplications": 1,
                        "maxActiveApplicationsPerUser": 100,
                        "maxApplications": 735,
                        "maxApplicationsPerUser": 73500,
                        "maxCapacity": 100.0,
                        "numActiveApplications": 0,
                        "numApplications": 0,
                        "numContainers": 0,
                        "numPendingApplications": 0,
                        "queueName": "a2",
                        "resourcesUsed": {
                            "memory": 0,
                            "vCores": 0
                        },
                        "state": "RUNNING",
                        "type": "capacitySchedulerLeafQueueInfo",
                        "usedCapacity": 0.0,
                        "usedResources": "<memory:0, vCores:0>",
                        "userLimit": 100,
                        "userLimitFactor": 100.0,
                        "users": null
                    }
                ]
                  },
                  "resourcesUsed": {
                    "memory": 0,
                    "vCores": 0
                  },
                  "state": "RUNNING",
                  "usedCapacity": 0.0,
                  "usedResources": "<memory:0, vCores:0>"
                },
                {
                  "absoluteCapacity": 89.5,
                  "absoluteMaxCapacity": 100.0,
                  "absoluteUsedCapacity": 0.0,
                  "capacity": 89.5,
                  "maxCapacity": 100.0,
                  "numApplications": 2,
                  "queueName": "b",
                  "queues": {
                    "queue": [
                      {
                        "absoluteCapacity": 53.7,
                        "absoluteMaxCapacity": 100.0,
                        "absoluteUsedCapacity": 0.0,
                        "capacity": 60.000004,
                        "maxActiveApplications": 1,
                        "maxActiveApplicationsPerUser": 100,
                        "maxApplications": 5370,
                        "maxApplicationsPerUser": 537000,
                        "maxCapacity": 100.0,
                        "numActiveApplications": 1,
                        "numApplications": 2,
                        "numContainers": 0,
                        "numPendingApplications": 1,
                        "queueName": "b1",
                        "resourcesUsed": {
                          "memory": 0,
                          "vCores": 0
                        },
                        "state": "RUNNING",
                        "type": "capacitySchedulerLeafQueueInfo",
                        "usedCapacity": 0.0,
                        "usedResources": "<memory:0, vCores:0>",
                        "userLimit": 100,
                        "userLimitFactor": 100.0,
                        "users": {
                          "user": [
                            {
                              "numActiveApplications": 0,
                              "numPendingApplications": 1,
                              "resourcesUsed": {
                                "memory": 0,
                                "vCores": 0
                              },
                              "username": "user2"
                            },
                            {
                              "numActiveApplications": 1,
                              "numPendingApplications": 0,
                              "resourcesUsed": {
                                "memory": 0,
                                "vCores": 0
                              },
                              "username": "user1"
                            }
                          ]
                        }
                    },
                      {
                        "absoluteCapacity": 35.3525,
                        "absoluteMaxCapacity": 100.0,
                        "absoluteUsedCapacity": 0.0,
                        "capacity": 39.5,
                        "maxActiveApplications": 1,
                        "maxActiveApplicationsPerUser": 100,
                        "maxApplications": 3535,
                        "maxApplicationsPerUser": 353500,
                        "maxCapacity": 100.0,
                        "numActiveApplications": 123,
                        "numApplications": 0,
                        "numContainers": 0,
                        "numPendingApplications": 0,
                        "queueName": "b2",
                        "resourcesUsed": {
                          "memory": 0,
                          "vCores": 0
                        },
                        "state": "RUNNING",
                        "type": "capacitySchedulerLeafQueueInfo",
                        "usedCapacity": 0.0,
                        "usedResources": "<memory:0, vCores:0>",
                        "userLimit": 100,
                        "userLimitFactor": 100.0,
                        "users": null
                      },
                      {
                        "absoluteCapacity": 0.4475,
                        "absoluteMaxCapacity": 100.0,
                        "absoluteUsedCapacity": 0.0,
                        "capacity": 0.5,
                        "maxActiveApplications": 1,
                        "maxActiveApplicationsPerUser": 100,
                        "maxApplications": 44,
                        "maxApplicationsPerUser": 4400,
                        "maxCapacity": 100.0,
                        "numActiveApplications": 0,
                        "numApplications": 0,
                        "numContainers": 0,
                        "numPendingApplications": 0,
                        "queueName": "b3",
                        "resourcesUsed": {
                          "memory": 0,
                          "vCores": 0
                        },
                        "state": "RUNNING",
                        "type": "capacitySchedulerLeafQueueInfo",
                        "usedCapacity": 0.0,
                        "usedResources": "<memory:0, vCores:0>",
                        "userLimit": 100,
                        "userLimitFactor": 100.0,
                        "users": null
                      }
                    ]
                },
                  "resourcesUsed": {
                    "memory": 0,
                    "vCores": 0
                  },
                  "state": "RUNNING",
                  "usedCapacity": 0.0,
                  "usedResources": "<memory:0, vCores:0>"
                }
              ]
            },
            "type": "capacityScheduler",
            "usedCapacity": 0.0
          }
        }
      });
  });

  // GET /api/v1/virtual-clusters
  it('should return virtual cluster list', (done) => {
    chai.request(server)
      .get('/api/v1/virtual-clusters')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        expect(res.body).to.have.property('a1a');
        expect(res.body).to.nested.include({'b2.numActiveJobs': 123});
        done();
      });
  });

  // positive test case
  // get exist vc info
  it('should return virtual cluster info', (done) => {
    chai.request(server)
      .get('/api/v1/virtual-clusters/b3')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        expect(res.body).to.have.property('capacity', 0.4475);
        done();
      });
  });

  // negative test case
  // get non-exist vc
  it('should return not found', (done) => {
    chai.request(server)
      .get('/api/v1/virtual-clusters/noexist')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res, 'json response').be.json;
        done();
      });
  });

  // negative test case
  // unsupported scheduler type
  it('should return GetVirtualClusterListError', (done) => {
    nock.cleanAll();
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, {
        "scheduler":
        {
          "schedulerInfo":
          {
            "type":"fifoScheduler",
            "capacity":1,
            "usedCapacity":"NaN",
            "qstate":"RUNNING",
            "minQueueMemoryCapacity":1024,
            "maxQueueMemoryCapacity":10240,
            "numNodes":0,
            "usedNodeCapacity":0,
            "availNodeCapacity":0,
            "totalNodeCapacity":0,
            "numContainers":0
          }
        }
      });
    chai.request(server)
      .get('/api/v1/virtual-clusters')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(500);
        expect(res, 'json response').be.json;
        expect(res.body).to.have.property('error', 'GetVirtualClusterListError');
        done();
      });
  });
});
