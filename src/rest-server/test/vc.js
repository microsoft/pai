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
            "type": "capacityScheduler",
            "capacity": 100,
            "usedCapacity": 0,
            "maxCapacity": 100,
            "queueName": "root",
            "queues": {
                "queue": [
                    {
                        "type": "capacitySchedulerLeafQueueInfo",
                        "capacity": 30.000002,
                        "usedCapacity": 0,
                        "maxCapacity": 100,
                        "absoluteCapacity": 30.000002,
                        "absoluteMaxCapacity": 100,
                        "absoluteUsedCapacity": 0,
                        "numApplications": 0,
                        "queueName": "a",
                        "state": "RUNNING",
                        "resourcesUsed": {
                            "memory": 0,
                            "vCores": 0,
                            "GPUs": 0
                        },
                        "hideReservationQueues": false,
                        "nodeLabels": [
                            "*"
                        ],
                        "allocatedContainers": 0,
                        "reservedContainers": 0,
                        "pendingContainers": 0,
                        "capacities": {
                            "queueCapacitiesByPartition": [
                                {
                                    "partitionName": "",
                                    "capacity": 30.000002,
                                    "usedCapacity": 0,
                                    "maxCapacity": 100,
                                    "absoluteCapacity": 30.000002,
                                    "absoluteUsedCapacity": 0,
                                    "absoluteMaxCapacity": 100,
                                    "maxAMLimitPercentage": 100
                                }
                            ]
                        },
                        "resources": {
                            "resourceUsagesByPartition": [
                                {
                                    "partitionName": "",
                                    "used": {
                                        "memory": 0,
                                        "vCores": 0,
                                        "GPUs": 0
                                    },
                                    "reserved": {
                                        "memory": 0,
                                        "vCores": 0,
                                        "GPUs": 0
                                    },
                                    "pending": {
                                        "memory": 0,
                                        "vCores": 0,
                                        "GPUs": 0
                                    },
                                    "amUsed": {
                                        "memory": 0,
                                        "vCores": 0,
                                        "GPUs": 0
                                    },
                                    "amLimit": {
                                        "memory": 15360,
                                        "vCores": 8,
                                        "GPUs": 0
                                    }
                                }
                            ]
                        },
                        "numActiveApplications": 0,
                        "numPendingApplications": 0,
                        "numContainers": 0,
                        "maxApplications": 3000,
                        "maxApplicationsPerUser": 3000,
                        "userLimit": 100,
                        "users": null,
                        "userLimitFactor": 1,
                        "AMResourceLimit": {
                            "memory": 15360,
                            "vCores": 8,
                            "GPUs": 0
                        },
                        "usedAMResource": {
                            "memory": 0,
                            "vCores": 0,
                            "GPUs": 0
                        },
                        "userAMResourceLimit": {
                            "memory": 15360,
                            "vCores": 8,
                            "GPUs": 0
                        },
                        "preemptionDisabled": false,
                        "defaultPriority": 0
                    },
                    {
                        "type": "capacitySchedulerLeafQueueInfo",
                        "capacity": 70,
                        "usedCapacity": 0,
                        "maxCapacity": 100,
                        "absoluteCapacity": 70,
                        "absoluteMaxCapacity": 100,
                        "absoluteUsedCapacity": 0,
                        "numApplications": 0,
                        "queueName": "default",
                        "state": "RUNNING",
                        "resourcesUsed": {
                            "memory": 0,
                            "vCores": 0,
                            "GPUs": 0
                        },
                        "hideReservationQueues": false,
                        "nodeLabels": [
                            "*"
                        ],
                        "allocatedContainers": 0,
                        "reservedContainers": 0,
                        "pendingContainers": 0,
                        "capacities": {
                            "queueCapacitiesByPartition": [
                                {
                                    "partitionName": "",
                                    "capacity": 70,
                                    "usedCapacity": 0,
                                    "maxCapacity": 100,
                                    "absoluteCapacity": 70,
                                    "absoluteUsedCapacity": 0,
                                    "absoluteMaxCapacity": 100,
                                    "maxAMLimitPercentage": 100
                                }
                            ]
                        },
                        "resources": {
                            "resourceUsagesByPartition": [
                                {
                                    "partitionName": "",
                                    "used": {
                                        "memory": 0,
                                        "vCores": 0,
                                        "GPUs": 0
                                    },
                                    "reserved": {
                                        "memory": 0,
                                        "vCores": 0,
                                        "GPUs": 0
                                    },
                                    "pending": {
                                        "memory": 0,
                                        "vCores": 0,
                                        "GPUs": 0
                                    },
                                    "amUsed": {
                                        "memory": 0,
                                        "vCores": 0,
                                        "GPUs": 0
                                    },
                                    "amLimit": {
                                        "memory": 15360,
                                        "vCores": 8,
                                        "GPUs": 0
                                    }
                                }
                            ]
                        },
                        "numActiveApplications": 0,
                        "numPendingApplications": 0,
                        "numContainers": 0,
                        "maxApplications": 7000,
                        "maxApplicationsPerUser": 7000,
                        "userLimit": 100,
                        "users": null,
                        "userLimitFactor": 100,
                        "AMResourceLimit": {
                            "memory": 15360,
                            "vCores": 8,
                            "GPUs": 0
                        },
                        "usedAMResource": {
                            "memory": 0,
                            "vCores": 0,
                            "GPUs": 0
                        },
                        "userAMResourceLimit": {
                            "memory": 15360,
                            "vCores": 8,
                            "GPUs": 0
                        },
                        "preemptionDisabled": false,
                        "defaultPriority": 0
                    }
                ]
            },
            "capacities": {
                "queueCapacitiesByPartition": [
                    {
                        "partitionName": "",
                        "capacity": 100,
                        "usedCapacity": 0,
                        "maxCapacity": 100,
                        "absoluteCapacity": 100,
                        "absoluteUsedCapacity": 0,
                        "absoluteMaxCapacity": 100,
                        "maxAMLimitPercentage": 0
                    }
                ]
            },
            "health": {
                "lastrun": 1543912751445,
                "operationsInfo": {
                    "entry": {
                        "key": "last-release",
                        "value": {
                            "nodeId": "N/A",
                            "containerId": "N/A",
                            "queue": "N/A"
                        }
                    }
                },
                "lastRunDetails": [
                    {
                        "operation": "releases",
                        "count": 0,
                        "resources": {
                            "memory": 0,
                            "vCores": 0,
                            "GPUs": 0
                        }
                    },
                    {
                        "operation": "allocations",
                        "count": 0,
                        "resources": {
                            "memory": 0,
                            "vCores": 0,
                            "GPUs": 0
                        }
                    },
                    {
                        "operation": "reservations",
                        "count": 0,
                        "resources": {
                            "memory": 0,
                            "vCores": 0,
                            "GPUs": 0
                        }
                    }
                ]
            }
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
        expect(res.body).to.have.property('code', 'NoVirtualClusterError');
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
        expect(res.body).to.have.property('code', 'BadConfigurationError');
        done();
      });
  });
});
