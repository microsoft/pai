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

const nockUtils = require('./utils/nock');

const yarnDefaultResponse = {
    'scheduler': {
        'schedulerInfo': {
            'type': 'capacityScheduler',
            'capacity': 100,
            'usedCapacity': 0,
            'maxCapacity': 100,
            'queueName': 'root',
            'queues': {
                'queue': [
                    {
                        'type': 'capacitySchedulerLeafQueueInfo',
                        'capacity': 10.000002,
                        'usedCapacity': 0,
                        'maxCapacity': 100,
                        'absoluteCapacity': 10.000002,
                        'absoluteMaxCapacity': 100,
                        'absoluteUsedCapacity': 0,
                        'numApplications': 0,
                        'queueName': 'a',
                        'state': 'RUNNING',
                        'resourcesUsed': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'hideReservationQueues': false,
                        'nodeLabels': [
                            '*',
                        ],
                        'allocatedContainers': 0,
                        'reservedContainers': 0,
                        'pendingContainers': 0,
                        'capacities': {
                            'queueCapacitiesByPartition': [
                                {
                                    'partitionName': '',
                                    'capacity': 10.000002,
                                    'usedCapacity': 0,
                                    'maxCapacity': 100,
                                    'absoluteCapacity': 10.000002,
                                    'absoluteUsedCapacity': 0,
                                    'absoluteMaxCapacity': 100,
                                    'maxAMLimitPercentage': 100,
                                },
                            ],
                        },
                        'resources': {
                            'resourceUsagesByPartition': [
                                {
                                    'partitionName': '',
                                    'used': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'reserved': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'pending': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amUsed': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amLimit': {
                                        'memory': 15360,
                                        'vCores': 8,
                                        'GPUs': 0,
                                    },
                                },
                            ],
                        },
                        'numActiveApplications': 0,
                        'numPendingApplications': 0,
                        'numContainers': 0,
                        'maxApplications': 3000,
                        'maxApplicationsPerUser': 3000,
                        'userLimit': 100,
                        'users': null,
                        'userLimitFactor': 1,
                        'AMResourceLimit': {
                            'memory': 15360,
                            'vCores': 8,
                            'GPUs': 0,
                        },
                        'usedAMResource': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'userAMResourceLimit': {
                            'memory': 15360,
                            'vCores': 8,
                            'GPUs': 0,
                        },
                        'preemptionDisabled': false,
                        'defaultPriority': 0,
                        'defaultNodeLabelExpression': '',
                    },
                    {
                        'type': 'capacitySchedulerLeafQueueInfo',
                        'capacity': 20.000000,
                        'usedCapacity': 0,
                        'maxCapacity': 100,
                        'absoluteCapacity': 20.000000,
                        'absoluteMaxCapacity': 100,
                        'absoluteUsedCapacity': 0,
                        'numApplications': 2,
                        'queueName': 'c',
                        'state': 'RUNNING',
                        'resourcesUsed': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'hideReservationQueues': false,
                        'nodeLabels': [
                            '*',
                        ],
                        'allocatedContainers': 0,
                        'reservedContainers': 0,
                        'pendingContainers': 0,
                        'capacities': {
                            'queueCapacitiesByPartition': [
                                {
                                    'partitionName': '',
                                    'capacity': 20.000000,
                                    'usedCapacity': 0,
                                    'maxCapacity': 100,
                                    'absoluteCapacity': 20.000000,
                                    'absoluteUsedCapacity': 0,
                                    'absoluteMaxCapacity': 100,
                                    'maxAMLimitPercentage': 100,
                                },
                            ],
                        },
                        'resources': {
                            'resourceUsagesByPartition': [
                                {
                                    'partitionName': '',
                                    'used': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'reserved': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'pending': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amUsed': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amLimit': {
                                        'memory': 15360,
                                        'vCores': 8,
                                        'GPUs': 0,
                                    },
                                },
                            ],
                        },
                        'numActiveApplications': 1,
                        'numPendingApplications': 1,
                        'numContainers': 0,
                        'maxApplications': 3000,
                        'maxApplicationsPerUser': 3000,
                        'userLimit': 100,
                        'users': null,
                        'userLimitFactor': 1,
                        'AMResourceLimit': {
                            'memory': 15360,
                            'vCores': 8,
                            'GPUs': 0,
                        },
                        'usedAMResource': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'userAMResourceLimit': {
                            'memory': 15360,
                            'vCores': 8,
                            'GPUs': 0,
                        },
                        'preemptionDisabled': false,
                        'defaultPriority': 0,
                    },
                    {
                        'type': 'capacitySchedulerLeafQueueInfo',
                        'capacity': 70,
                        'usedCapacity': 0,
                        'maxCapacity': 100,
                        'absoluteCapacity': 70,
                        'absoluteMaxCapacity': 100,
                        'absoluteUsedCapacity': 0,
                        'numApplications': 0,
                        'queueName': 'default',
                        'state': 'RUNNING',
                        'resourcesUsed': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'hideReservationQueues': false,
                        'nodeLabels': [
                            '*',
                        ],
                        'allocatedContainers': 0,
                        'reservedContainers': 0,
                        'pendingContainers': 0,
                        'capacities': {
                            'queueCapacitiesByPartition': [
                                {
                                    'partitionName': '',
                                    'capacity': 70,
                                    'usedCapacity': 0,
                                    'maxCapacity': 100,
                                    'absoluteCapacity': 70,
                                    'absoluteUsedCapacity': 0,
                                    'absoluteMaxCapacity': 100,
                                    'maxAMLimitPercentage': 100,
                                },
                            ],
                        },
                        'resources': {
                            'resourceUsagesByPartition': [
                                {
                                    'partitionName': '',
                                    'used': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'reserved': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'pending': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amUsed': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amLimit': {
                                        'memory': 15360,
                                        'vCores': 8,
                                        'GPUs': 0,
                                    },
                                },
                            ],
                        },
                        'numActiveApplications': 0,
                        'numPendingApplications': 0,
                        'numContainers': 0,
                        'maxApplications': 7000,
                        'maxApplicationsPerUser': 7000,
                        'userLimit': 100,
                        'users': null,
                        'userLimitFactor': 100,
                        'AMResourceLimit': {
                            'memory': 15360,
                            'vCores': 8,
                            'GPUs': 0,
                        },
                        'usedAMResource': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'userAMResourceLimit': {
                            'memory': 15360,
                            'vCores': 8,
                            'GPUs': 0,
                        },
                        'preemptionDisabled': false,
                        'defaultPriority': 0,
                    },
                    {
                        'type': 'capacitySchedulerLeafQueueInfo',
                        'capacity': 0,
                        'usedCapacity': 0,
                        'maxCapacity': 100,
                        'absoluteCapacity': 0,
                        'absoluteMaxCapacity': 0,
                        'absoluteUsedCapacity': 0,
                        'numApplications': 1,
                        'queueName': 'dedicated_vc',
                        'state': 'RUNNING',
                        'resourcesUsed': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'hideReservationQueues': false,
                        'nodeLabels': [
                            'dedicated_vc',
                        ],
                        'allocatedContainers': 0,
                        'reservedContainers': 0,
                        'pendingContainers': 0,
                        'capacities': {
                            'queueCapacitiesByPartition': [
                                {
                                    'partitionName': '',
                                    'capacity': 0,
                                    'usedCapacity': 0,
                                    'maxCapacity': 100,
                                    'absoluteCapacity': 0,
                                    'absoluteUsedCapacity': 0,
                                    'absoluteMaxCapacity': 0,
                                    'maxAMLimitPercentage': 50,
                                },
                                {
                                    'partitionName': 'dedicated_vc',
                                    'capacity': 100,
                                    'usedCapacity': 25,
                                    'maxCapacity': 100,
                                    'absoluteCapacity': 100,
                                    'absoluteUsedCapacity': 25,
                                    'absoluteMaxCapacity': 100,
                                    'maxAMLimitPercentage': 50,
                                },
                            ],
                        },
                        'resources': {
                            'resourceUsagesByPartition': [
                                {
                                    'partitionName': '',
                                    'used': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'reserved': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'pending': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amUsed': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amLimit': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                },
                                {
                                    'partitionName': 'dedicated_vc',
                                    'used': {
                                        'memory': 3072,
                                        'vCores': 2,
                                        'GPUs': 1,
                                    },
                                    'reserved': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'pending': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amUsed': {
                                        'memory': 1024,
                                        'vCores': 1,
                                        'GPUs': 0,
                                    },
                                    'amLimit': {
                                        'memory': 104448,
                                        'vCores': 12,
                                        'GPUs': 2,
                                    },
                                },
                            ],
                        },
                        'numActiveApplications': 1,
                        'numPendingApplications': 0,
                        'numContainers': 2,
                        'maxApplications': 10000,
                        'maxApplicationsPerUser': 10000,
                        'userLimit': 100,
                        'users': {
                            'user': [
                                {
                                    'username': 'zimiao',
                                    'resourcesUsed': {
                                        'memory': 3072,
                                        'vCores': 2,
                                        'GPUs': 1,
                                    },
                                    'numPendingApplications': 0,
                                    'numActiveApplications': 1,
                                    'AMResourceUsed': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'userResourceLimit': {
                                        'memory': 208896,
                                        'vCores': 24,
                                        'GPUs': 4,
                                    },
                                    'resources': {
                                        'resourceUsagesByPartition': [
                                            {
                                                'partitionName': '',
                                                'used': {
                                                    'memory': 0,
                                                    'vCores': 0,
                                                    'GPUs': 0,
                                                },
                                                'reserved': {
                                                    'memory': 0,
                                                    'vCores': 0,
                                                    'GPUs': 0,
                                                },
                                                'pending': {
                                                    'memory': 0,
                                                    'vCores': 0,
                                                    'GPUs': 0,
                                                },
                                                'amUsed': {
                                                    'memory': 0,
                                                    'vCores': 0,
                                                    'GPUs': 0,
                                                },
                                                'amLimit': {
                                                    'memory': 0,
                                                    'vCores': 0,
                                                    'GPUs': 0,
                                                },
                                            },
                                            {
                                                'partitionName': 'dedicated_vc',
                                                'used': {
                                                    'memory': 3072,
                                                    'vCores': 2,
                                                    'GPUs': 1,
                                                },
                                                'reserved': {
                                                    'memory': 0,
                                                    'vCores': 0,
                                                    'GPUs': 0,
                                                },
                                                'pending': {
                                                    'memory': 0,
                                                    'vCores': 0,
                                                    'GPUs': 0,
                                                },
                                                'amUsed': {
                                                    'memory': 1024,
                                                    'vCores': 1,
                                                    'GPUs': 0,
                                                },
                                                'amLimit': {
                                                    'memory': 104448,
                                                    'vCores': 12,
                                                    'GPUs': 2,
                                                },
                                            },
                                        ],
                                    },
                                    'userWeight': 1,
                                    'isActive': false,
                                },
                            ],
                        },
                        'userLimitFactor': 100,
                        'AMResourceLimit': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'usedAMResource': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'userAMResourceLimit': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'preemptionDisabled': true,
                        'defaultNodeLabelExpression': 'dedicated_vc',
                        'defaultPriority': 0,
                    },
                ],
            },
            'capacities': {
                'queueCapacitiesByPartition': [
                    {
                        'partitionName': '',
                        'capacity': 100,
                        'usedCapacity': 0,
                        'maxCapacity': 100,
                        'absoluteCapacity': 100,
                        'absoluteUsedCapacity': 0,
                        'absoluteMaxCapacity': 100,
                        'maxAMLimitPercentage': 0,
                    },
                ],
            },
            'health': {
                'lastrun': 1543912751445,
                'operationsInfo': {
                    'entry': {
                        'key': 'last-release',
                        'value': {
                            'nodeId': 'N/A',
                            'containerId': 'N/A',
                            'queue': 'N/A',
                        },
                    },
                },
                'lastRunDetails': [
                    {
                        'operation': 'releases',
                        'count': 0,
                        'resources': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                    },
                    {
                        'operation': 'allocations',
                        'count': 0,
                        'resources': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                    },
                    {
                        'operation': 'reservations',
                        'count': 0,
                        'resources': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                    },
                ],
            },
        },
    },
};

const yarnErrorResponse = {
    'scheduler': {
        'schedulerInfo': {
            'type': 'capacityScheduler',
            'capacity': 100,
            'usedCapacity': 0,
            'maxCapacity': 100,
            'queueName': 'root',
            'queues': {
                'queue': [
                    {
                        'type': 'capacitySchedulerLeafQueueInfo',
                        'capacity': 30.000002,
                        'usedCapacity': 0,
                        'maxCapacity': 100,
                        'absoluteCapacity': 30.000002,
                        'absoluteMaxCapacity': 100,
                        'absoluteUsedCapacity': 0,
                        'numApplications': 0,
                        'queueName': 'a',
                        'state': 'RUNNING',
                        'resourcesUsed': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'hideReservationQueues': false,
                        'nodeLabels': [
                            '*',
                        ],
                        'allocatedContainers': 0,
                        'reservedContainers': 0,
                        'pendingContainers': 0,
                        'capacities': {
                            'queueCapacitiesByPartition': [
                                {
                                    'partitionName': '',
                                    'capacity': 30.000002,
                                    'usedCapacity': 0,
                                    'maxCapacity': 100,
                                    'absoluteCapacity': 30.000002,
                                    'absoluteUsedCapacity': 0,
                                    'absoluteMaxCapacity': 100,
                                    'maxAMLimitPercentage': 100,
                                },
                            ],
                        },
                        'resources': {
                            'resourceUsagesByPartition': [
                                {
                                    'partitionName': '',
                                    'used': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'reserved': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'pending': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amUsed': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amLimit': {
                                        'memory': 15360,
                                        'vCores': 8,
                                        'GPUs': 0,
                                    },
                                },
                            ],
                        },
                        'numActiveApplications': 0,
                        'numPendingApplications': 0,
                        'numContainers': 0,
                        'maxApplications': 3000,
                        'maxApplicationsPerUser': 3000,
                        'userLimit': 100,
                        'users': null,
                        'userLimitFactor': 1,
                        'AMResourceLimit': {
                            'memory': 15360,
                            'vCores': 8,
                            'GPUs': 0,
                        },
                        'usedAMResource': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'userAMResourceLimit': {
                            'memory': 15360,
                            'vCores': 8,
                            'GPUs': 0,
                        },
                        'preemptionDisabled': false,
                        'defaultPriority': 0,
                    },
                    {
                        'type': 'capacitySchedulerLeafQueueInfo',
                        'capacity': 70,
                        'usedCapacity': 0,
                        'maxCapacity': 100,
                        'absoluteCapacity': 70,
                        'absoluteMaxCapacity': 100,
                        'absoluteUsedCapacity': 0,
                        'numApplications': 0,
                        'queueName': 'b',
                        'state': 'RUNNING',
                        'resourcesUsed': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'hideReservationQueues': false,
                        'nodeLabels': [
                            '*',
                        ],
                        'allocatedContainers': 0,
                        'reservedContainers': 0,
                        'pendingContainers': 0,
                        'capacities': {
                            'queueCapacitiesByPartition': [
                                {
                                    'partitionName': '',
                                    'capacity': 70,
                                    'usedCapacity': 0,
                                    'maxCapacity': 100,
                                    'absoluteCapacity': 70,
                                    'absoluteUsedCapacity': 0,
                                    'absoluteMaxCapacity': 100,
                                    'maxAMLimitPercentage': 100,
                                },
                            ],
                        },
                        'resources': {
                            'resourceUsagesByPartition': [
                                {
                                    'partitionName': '',
                                    'used': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'reserved': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'pending': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amUsed': {
                                        'memory': 0,
                                        'vCores': 0,
                                        'GPUs': 0,
                                    },
                                    'amLimit': {
                                        'memory': 15360,
                                        'vCores': 8,
                                        'GPUs': 0,
                                    },
                                },
                            ],
                        },
                        'numActiveApplications': 0,
                        'numPendingApplications': 0,
                        'numContainers': 0,
                        'maxApplications': 7000,
                        'maxApplicationsPerUser': 7000,
                        'userLimit': 100,
                        'users': null,
                        'userLimitFactor': 100,
                        'AMResourceLimit': {
                            'memory': 15360,
                            'vCores': 8,
                            'GPUs': 0,
                        },
                        'usedAMResource': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                        'userAMResourceLimit': {
                            'memory': 15360,
                            'vCores': 8,
                            'GPUs': 0,
                        },
                        'preemptionDisabled': false,
                        'defaultPriority': 0,
                    },
                ],
            },
            'capacities': {
                'queueCapacitiesByPartition': [
                    {
                        'partitionName': '',
                        'capacity': 100,
                        'usedCapacity': 0,
                        'maxCapacity': 100,
                        'absoluteCapacity': 100,
                        'absoluteUsedCapacity': 0,
                        'absoluteMaxCapacity': 100,
                        'maxAMLimitPercentage': 0,
                    },
                ],
            },
            'health': {
                'lastrun': 1543912751445,
                'operationsInfo': {
                    'entry': {
                        'key': 'last-release',
                        'value': {
                            'nodeId': 'N/A',
                            'containerId': 'N/A',
                            'queue': 'N/A',
                        },
                    },
                },
                'lastRunDetails': [
                    {
                        'operation': 'releases',
                        'count': 0,
                        'resources': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                    },
                    {
                        'operation': 'allocations',
                        'count': 0,
                        'resources': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                    },
                    {
                        'operation': 'reservations',
                        'count': 0,
                        'resources': {
                            'memory': 0,
                            'vCores': 0,
                            'GPUs': 0,
                        },
                    },
                ],
            },
        },
    },
};

const clusterNodeResponse = {
    'nodes': {
        'node': [
            {
                'rack': '/default-rack',
                'state': 'RUNNING',
                'id': '10.151.40.132:8041',
                'nodeHostName': '10.151.40.132',
                'nodeHTTPAddress': '10.151.40.132:8042',
                'lastHealthUpdate': 1558942647993,
                'version': '2.9.0',
                'healthReport': '',
                'numContainers': 2,
                'usedMemoryMB': 3072,
                'availMemoryMB': 205824,
                'usedVirtualCores': 2,
                'availableVirtualCores': 22,
                'numRunningOpportContainers': 0,
                'usedMemoryOpportGB': 0,
                'usedVirtualCoresOpport': 0,
                'numQueuedContainers': 0,
                'usedGPUs': 1,
                'availableGPUs': 3,
                'availableGPUAttribute': 14,
                'nodeLabels': [
                    'dedicated_vc',
                ],
                'resourceUtilization': {
                    'nodePhysicalMemoryMB': 36297,
                    'nodeVirtualMemoryMB': 36297,
                    'nodeCPUUsage': 0.41555851697921753,
                    'aggregatedContainersPhysicalMemoryMB': 473,
                    'aggregatedContainersVirtualMemoryMB': 2941,
                    'containersCPUUsage': 0.003000000026077032,
                },
            },
            {
                'rack': '/default-rack',
                'state': 'RUNNING',
                'id': '10.151.40.131:8041',
                'nodeHostName': '10.151.40.131',
                'nodeHTTPAddress': '10.151.40.131:8042',
                'lastHealthUpdate': 1558942647633,
                'version': '2.9.0',
                'healthReport': '',
                'numContainers': 2,
                'usedMemoryMB': 3072,
                'availMemoryMB': 205824,
                'usedVirtualCores': 2,
                'availableVirtualCores': 22,
                'numRunningOpportContainers': 0,
                'usedMemoryOpportGB': 0,
                'usedVirtualCoresOpport': 0,
                'numQueuedContainers': 0,
                'usedGPUs': 1,
                'availableGPUs': 3,
                'availableGPUAttribute': 14,
                'resourceUtilization': {
                    'nodePhysicalMemoryMB': 45623,
                    'nodeVirtualMemoryMB': 45623,
                    'nodeCPUUsage': 0.18666666746139526,
                    'aggregatedContainersPhysicalMemoryMB': 476,
                    'aggregatedContainersVirtualMemoryMB': 2950,
                    'containersCPUUsage': 0,
                },
            },
        ],
    },
};

/* const getK8sSecretsListResponse = {
  'kind': 'SecretList',
  'apiVersion': 'v1',
  'metadata': {
    'selfLink': '/api/v1/namespaces/pai-user-v2/secrets',
    'resourceVersion': '1062682',
  },
  'items': [
    {
      'metadata': {
        'name': 'paitest',
      },
      'data': {
        'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
        'username': 'cGFpdGVzdA==',
        'grouplist': 'WyJkZWZhdWx0IiwidmMyIiwidmMzIiwiYWRtaW5Hcm91cCJd',
        'email': '',
        'extension': 'eyJ2aXJ0dWFsQ2x1c3RlciI6WyJkZWZhdWx0IiwidmMyIiwidmMzIiwiYWRtaW5Hcm91cCJdfQ==',
      },
      'type': 'Opaque',
    },
  ],
}; */

const k8sGroupReponse = {
  'kind': 'SecretList',
  'apiVersion': 'v1',
  'metadata': {
    'selfLink': '/api/v1/namespaces/pai-group/secrets/',
    'resourceVersion': '1062682',
  },
  'items': [
    {
      'metadata': {
        'name': 'cantest001',
      },
      'data': {
        'groupname': Buffer.from('default').toString('base64'),
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['default'], admin: false}})).toString('base64'), // {"acls":{"admin":false,"virtualClusters":["default"]}}
      },
      'type': 'Opaque',
    },
    {
      'metadata': {
        'name': 'pai_test',
      },
      'data': {
        'groupname': Buffer.from('a').toString('base64'),
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['a'], admin: false}})).toString('base64'),
      },
      'type': 'Opaque',
    },
    {
      'metadata': {
        'name': 'pai_test_1',
      },
      'data': {
        'groupname': Buffer.from('c').toString('base64'),
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['c'], admin: false}})).toString('base64'),
      },
      'type': 'Opaque',
    },
    {
      'metadata': {
        'name': 'pai_test_2',
      },
      'data': {
        'groupname': Buffer.from('adminGroup').toString('base64'), // adminGroup
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['default', 'a', 'c'], admin: true}})).toString('base64'),
      },
      'type': 'Opaque',
    },
  ],
};

const k8sGroupReponseForDeletion = {
  'kind': 'SecretList',
  'apiVersion': 'v1',
  'metadata': {
    'selfLink': '/api/v1/namespaces/pai-group/secrets/',
    'resourceVersion': '1062682',
  },
  'items': [
    {
      'metadata': {
        'name': 'cantest001',
      },
      'data': {
        'groupname': Buffer.from('default').toString('base64'),
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['default'], admin: false}})).toString('base64'), // {"acls":{"admin":false,"virtualClusters":["default"]}}
      },
      'type': 'Opaque',
    },
    {
      'metadata': {
        'name': 'pai_test_1',
      },
      'data': {
        'groupname': Buffer.from('c').toString('base64'),
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['c'], admin: false}})).toString('base64'),
      },
      'type': 'Opaque',
    },
    {
      'metadata': {
        'name': 'pai_test_2',
      },
      'data': {
        'groupname': Buffer.from('adminGroup').toString('base64'), // adminGroup
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['default', 'a', 'c'], admin: true}})).toString('base64'),
      },
      'type': 'Opaque',
    },
  ],
};


// test
describe('VC API  Get /api/v2/virtual-clusters', () => {
  // Mock yarn rest api
  beforeEach(() => {
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, yarnDefaultResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, clusterNodeResponse);
  });

  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  // GET /api/v2/virtual-clusters
  it('should return virtual cluster list', (done) => {
    chai.request(server)
      .get('/api/v2/virtual-clusters')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        expect(res.body).to.have.property('a');
        expect(res.body).to.nested.include({'default.status': 'RUNNING'});
        expect(res.body).to.nested.include({'default.dedicated': false});
        expect(res.body).to.nested.include({'default.resourcesTotal.GPUs': 2.8});
        expect(res.body).to.nested.include({'dedicated_vc.dedicated': true});
        expect(res.body).to.nested.include({'dedicated_vc.resourcesTotal.GPUs': 4});
        expect(res.body).to.nested.include({'dedicated_vc.nodeList.0': '10.151.40.132'});
        expect(res.body).to.nested.include({'default.nodeList.0': '10.151.40.131'});
        done();
      });
  });

  // positive test case
  // get exist vc info
  it('should return virtual cluster info', (done) => {
    chai.request(server)
      .get('/api/v2/virtual-clusters/a')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        expect(res.body).to.have.property('capacity', 10.000002);
        done();
      });
  });

  // negative test case
  // get non-exist vc
  it('should return not found', (done) => {
    chai.request(server)
      .get('/api/v2/virtual-clusters/noexist')
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
        'scheduler':
        {
          'schedulerInfo':
          {
            'type': 'fifoScheduler',
            'capacity': 1,
            'usedCapacity': 'NaN',
            'qstate': 'RUNNING',
            'minQueueMemoryCapacity': 1024,
            'maxQueueMemoryCapacity': 10240,
            'numNodes': 0,
            'usedNodeCapacity': 0,
            'availNodeCapacity': 0,
            'totalNodeCapacity': 0,
            'numContainers': 0,
          },
        },
      });
    chai.request(server)
      .get('/api/v2/virtual-clusters')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(500);
        expect(res, 'json response').be.json;
        expect(res.body).to.have.property('code', 'BadConfigurationError');
        done();
      });
  });
});


describe('VC API PUT /api/v2/virtual-clusters', () => {
  // Mock yarn rest api
  beforeEach(() => {
    nock.cleanAll();
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, yarnDefaultResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, clusterNodeResponse);
  });

  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  it('[Positive] should add vc b', (done) => {
    nock(yarnUri)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(200);
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets')
      .reply(200, k8sGroupReponse);
    nock(apiServerRootUri)
      .get(`/api/v1/namespaces/pai-group/secrets/${Buffer.from('b').toString('hex')}`)
      .reply(404, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': `secrets '${Buffer.from('b').toString('hex')}' not found`,
        'reason': 'NotFound',
        'details': {
          'name': 'nonexist',
          'kind': 'secrets',
        },
        'code': 404,
      });
    nock(apiServerRootUri)
      .post('/api/v1/namespaces/pai-group/secrets', {
        'metadata': {'name': `${Buffer.from('b').toString('hex')}`},
        'data': {
          'groupname': `${Buffer.from('b').toString('base64')}`,
          'description': `${Buffer.from('').toString('base64')}`,
          'externalName': `${Buffer.from('').toString('base64')}`,
          'extension': `${Buffer.from(JSON.stringify({'acls': {'virtualClusters': ['b'], 'admin': false}})).toString('base64')}`,
        },
      })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': `${Buffer.from('b').toString('hex')}`,
          'namespace': 'pai-group',
          'selfLink': '/api/v1/namespaces/pai-user-v2/secrets/6e657775736572',
          'uid': 'f75b6065-f9c7-11e8-b564-000d3ab5296b',
          'resourceVersion': '1116114',
          'creationTimestamp': '2018-12-07T02:29:47Z',
        },
        'data': {
          'groupname': `${Buffer.from('b').toString('base64')}`,
          'description': `${Buffer.from('').toString('base64')}`,
          'externalName': `${Buffer.from('').toString('base64')}`,
          'extension': `${Buffer.from(JSON.stringify({'acls': {'virtualClusters': ['b'], 'admin': false}})).toString('base64')}`,
        },
        'type': 'Opaque',
      });
    nock(apiServerRootUri)
      .put(`/api/v1/namespaces/pai-group/secrets/${Buffer.from('adminGroup').toString('hex')}`, {
        'metadata': {'name': Buffer.from('adminGroup').toString('hex')},
        'data': {
          'groupname': Buffer.from('adminGroup').toString('base64'),
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['default', 'a', 'c', 'b'], admin: true}})).toString('base64'),
        },
      })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '657869737475736572',
          'namespace': 'pai-group',
          'selfLink': '/api/v1/namespaces/pai-group/secrets/657869737475736572',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
          'resourceVersion': '1115478',
          'creationTimestamp': '2018-12-07T02:21:42Z',
        },
        'data': {
          'groupname': Buffer.from('adminGroup').toString('base64'),
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['default', 'a', 'c', 'b'], admin: true}})).toString('base64'),
        },
        'type': 'Opaque',
      });

    const adminToken = nockUtils.registerAdminTokenCheck('admin');

    chai.request(server)
      .put('/api/v2/virtual-clusters/b')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcCapacity': 30,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(201);
        done();
      });
  });

  it('[Positive] should update vc a', (done) => {
    nock(yarnUri)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(200);
    nock(apiServerRootUri)
      .get(`/api/v1/namespaces/pai-group/secrets/${Buffer.from('a').toString('hex')}`)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': `${Buffer.from('a').toString('hex')}`,
        },
        'data': {
          'groupname': `${Buffer.from('a').toString('base64')}`,
          'description': `${Buffer.from('').toString('base64')}`,
          'externalName': `${Buffer.from('').toString('base64')}`,
          'extension': `${Buffer.from(JSON.stringify({acls: {virtualClusters: ['a'], admin: false}})).toString('base64')}`,
        },
        'type': 'Opaque',
      });

    const adminToken = nockUtils.registerAdminTokenCheck('admin');

    chai.request(server)
      .put('/api/v2/virtual-clusters/a')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcCapacity': 40,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(201);
        done();
      });
  });

  it('[Positive] should update vc a with max capacity', (done) => {
    nock(yarnUri)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(200);
    nock(apiServerRootUri)
      .get(`/api/v1/namespaces/pai-group/secrets/${Buffer.from('a').toString('hex')}`)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': `${Buffer.from('a').toString('hex')}`,
        },
        'data': {
          'groupname': `${Buffer.from('a').toString('base64')}`,
          'description': `${Buffer.from('').toString('base64')}`,
          'externalName': `${Buffer.from('').toString('base64')}`,
          'extension': `${Buffer.from(JSON.stringify({acls: {virtualClusters: ['a'], admin: false}})).toString('base64')}`,
        },
        'type': 'Opaque',
      });

    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .put('/api/v2/virtual-clusters/a')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcCapacity': 40,
        'vcMaxCapacity': 40,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(201);
        done();
      });
  });

  it('[Negative] shouldn\'t update vc when maxCapacity less than capacity', (done) => {
    nock.cleanAll();
    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .put('/api/v2/virtual-clusters/a')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcCapacity': 40,
        'vcMaxCapacity': 30,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(400);
        expect(res.body).to.have.property('code', 'InvalidParametersError');
        done();
      });
  });

  it('[Negative] should not update vc default', (done) => {
    nock.cleanAll();
    chai.request(server)
      .put('/api/v2/virtual-clusters/default')
      .set('Authorization', 'Bearer token') // token is not checked
      .send({
        'vcCapacity': 30,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(403);
        expect(res.body).to.have.property('code', 'ForbiddenUserError');
        done();
      });
  });

  it('[Negative] Non-admin should not update vc', (done) => {
    nock.cleanAll();
    const userToken = nockUtils.registerUserTokenCheck('userX');
    chai.request(server)
      .put('/api/v2/virtual-clusters/b')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        'vcCapacity': 30,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(403);
        expect(res.body).to.have.property('code', 'ForbiddenUserError');
        done();
      });
  });


  it('[Negative] should not update vc b with exceed quota', (done) => {
    nock(apiServerRootUri)
      .get(`/api/v1/namespaces/pai-group/secrets/${Buffer.from('b').toString('hex')}`)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': `${Buffer.from('b').toString('hex')}`,
        },
        'data': {
          'groupname': `${Buffer.from('b').toString('base64')}`,
          'description': `${Buffer.from('').toString('base64')}`,
          'externalName': `${Buffer.from('').toString('base64')}`,
          'extension': `${Buffer.from(JSON.stringify({acls: {virtualClusters: ['b'], admin: false}})).toString('base64')}`,
        },
        'type': 'Opaque',
      });

    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .put('/api/v2/virtual-clusters/b')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcCapacity': 80,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(403);
        expect(res.body).to.have.property('code', 'NoEnoughQuotaError');
        done();
      });
  });

  it('[Negative] should not update vc if default vc doesn\'t exist', (done) => {
    nock.cleanAll();
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, yarnErrorResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, clusterNodeResponse);
    nock(apiServerRootUri)
      .get(`/api/v1/namespaces/pai-group/secrets/${Buffer.from('a').toString('hex')}`)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': `${Buffer.from('a').toString('hex')}`,
        },
        'data': {
          'groupname': `${Buffer.from('a').toString('base64')}`,
          'description': `${Buffer.from('').toString('base64')}`,
          'externalName': `${Buffer.from('').toString('base64')}`,
          'extension': `${Buffer.from(JSON.stringify({acls: {virtualClusters: ['a'], admin: false}})).toString('base64')}`,
        },
        'type': 'Opaque',
      });

    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .put('/api/v2/virtual-clusters/a')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcCapacity': 80,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res.body).to.have.property('code', 'NoVirtualClusterError');
        done();
      });
  });

  it('[Negative] should not update vc if vcname contains illegal character', (done) => {
    nock.cleanAll();
    chai.request(server)
      .put('/api/v2/virtual-clusters/aaa%20bbb')
      .set('Authorization', 'Bearer adminToken') // token is not checked
      .send({
        'vcCapacity': 80,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(400);
        expect(res.body).to.have.property('code', 'InvalidParametersError');
        done();
      });
  });

  it('[Negative] should not update vc if upstream error', (done) => {
    nock(yarnUri)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(404, 'Error response in YARN');
    nock(apiServerRootUri)
      .get(`/api/v1/namespaces/pai-group/secrets/${Buffer.from('a').toString('hex')}`)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': `${Buffer.from('a').toString('hex')}`,
        },
        'data': {
          'groupname': `${Buffer.from('a').toString('base64')}`,
          'description': `${Buffer.from('').toString('base64')}`,
          'externalName': `${Buffer.from('').toString('base64')}`,
          'extension': `${Buffer.from(JSON.stringify({acls: {virtualClusters: ['a'], admin: false}})).toString('base64')}`,
        },
        'type': 'Opaque',
      });

    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .put('/api/v2/virtual-clusters/a')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcCapacity': 80,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(500);
        expect(res.body).to.have.property('code', 'UnknownError');
        expect(res.body).to.have.property('message', 'Error response in YARN');
        done();
      });
  });

  it('[Negative] should not update a dedicated vc', (done) => {
    nock(apiServerRootUri)
      .get(`/api/v1/namespaces/pai-group/secrets/${Buffer.from('dedicated_vc').toString('hex')}`)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': `${Buffer.from('dedicated_vc').toString('hex')}`,
        },
        'data': {
          'groupname': `${Buffer.from('dedicated_vc').toString('base64')}`,
          'description': `${Buffer.from('').toString('base64')}`,
          'externalName': `${Buffer.from('').toString('base64')}`,
          'extension': `${Buffer.from(JSON.stringify({acls: {virtualClusters: ['dedicated_vc'], admin: false}})).toString('base64')}`,
        },
        'type': 'Opaque',
      });

    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .put('/api/v2/virtual-clusters/dedicated_vc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcCapacity': 10,
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(403);
        expect(res.body).to.have.property('code', 'ReadOnlyVcError');
        done();
      });
  });
});


describe('VC API PUT /api/v2/virtual-clusters/:vcName/status', () => {
  // Mock yarn rest api
  beforeEach(() => {
    nock.cleanAll();
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, yarnDefaultResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, clusterNodeResponse);
  });

  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  it('[Positive] should change vc a to stopped', (done) => {
    nock(yarnUri)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(200);

    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .put('/api/v2/virtual-clusters/a/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcStatus': 'stopped',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(201);
        done();
      });
  });

  it('[Positive] should change vc a to running', (done) => {
    nock(yarnUri)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(200);

    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .put('/api/v2/virtual-clusters/a/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcStatus': 'running',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(201);
        done();
      });
  });

  it('[Negative] should not change default vc status', (done) => {
    nock.cleanAll();
    chai.request(server)
      .put('/api/v2/virtual-clusters/default/status')
      .set('Authorization', 'Bearer adminToken') // token is not checked
      .send({
        'vcStatus': 'running',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(403);
        expect(res.body).to.have.property('code', 'ForbiddenUserError');
        done();
      });
  });

  it('[Negative] Non-admin should not change vc status', (done) => {
    nock.cleanAll();

    const userToken = nockUtils.registerUserTokenCheck('userX');
    chai.request(server)
      .put('/api/v2/virtual-clusters/a/status')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        'vcStatus': 'stopped',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(403);
        expect(res.body).to.have.property('code', 'ForbiddenUserError');
        done();
      });
  });

  it('[Negative] should not change a non-exist vc b', (done) => {
    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .put('/api/v2/virtual-clusters/b/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcStatus': 'running',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res.body).to.have.property('code', 'NoVirtualClusterError');
        done();
      });
  });


  it('[Negative] should not change vc if upstream error', (done) => {
    nock(yarnUri)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(404, 'Error response in YARN');

    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .put('/api/v2/virtual-clusters/a/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        'vcStatus': 'stopped',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(500);
        expect(res.body).to.have.property('code', 'UnknownError');
        expect(res.body).to.have.property('message', 'Error response in YARN');
        done();
      });
  });
});


describe('VC API DELETE /api/v2/virtual-clusters', () => {
  // Mock yarn rest api
  beforeEach(() => {
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, yarnDefaultResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, clusterNodeResponse);
  });

  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });


  it('[Positive] should delete vc a', (done) => {
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, yarnDefaultResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, clusterNodeResponse)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(200)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(200);
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets')
      .reply(200, {
        'kind': 'SecretList',
        'apiVersion': 'v1',
        'metadata': {
          'selfLink': '/api/v1/namespaces/pai-user-v2/secrets',
          'resourceVersion': '1062682',
        },
        'items': [
          {
            'metadata': {
              'name': 'paitest',
            },
            'data': {
              'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
              'username': 'cGFpdGVzdA==',
              'grouplist': 'WyJkZWZhdWx0IiwidmMyIiwidmMzIiwiYWRtaW5Hcm91cCJd',
              'email': '',
              'extension': 'eyJ2aXJ0dWFsQ2x1c3RlciI6WyJkZWZhdWx0IiwidmMyIiwidmMzIiwiYWRtaW5Hcm91cCJdfQ==',
            },
            'type': 'Opaque',
          },
        ],
      });
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets')
      .reply(200, k8sGroupReponseForDeletion);
    nock(apiServerRootUri)
      .delete('/api/v1/namespaces/pai-group/secrets/61')
      .reply(200, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Success',
        'details': {
          'name': '61',
          'kind': 'secrets',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
        },
      });
    nock(apiServerRootUri)
      .put(`/api/v1/namespaces/pai-group/secrets/${Buffer.from('adminGroup').toString('hex')}`, {
        'metadata': {'name': Buffer.from('adminGroup').toString('hex')},
        'data': {
          'groupname': Buffer.from('adminGroup').toString('base64'),
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['default', 'c'], admin: true}})).toString('base64'),
        },
      })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '657869737475736572',
          'namespace': 'pai-group',
          'selfLink': '/api/v1/namespaces/pai-group/secrets/657869737475736572',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
          'resourceVersion': '1115478',
          'creationTimestamp': '2018-12-07T02:21:42Z',
        },
        'data': {
          'groupname': Buffer.from('adminGroup').toString('base64'),
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': Buffer.from(JSON.stringify({acls: {virtualClusters: ['default', 'c'], admin: true}})).toString('base64'),
        },
        'type': 'Opaque',
      });
    const adminToken = nockUtils.registerAdminTokenCheck('admin');

    chai.request(server)
      .delete('/api/v2/virtual-clusters/a')
      .set('Authorization', `Bearer ${adminToken}`)
      .end((err, res) => {
        expect(res, 'status code').to.have.status(201);
        done();
      });
  });

  it('[Negative] Non-admin should not delete vc a', (done) => {
    nock.cleanAll();

    const userToken = nockUtils.registerUserTokenCheck('userX');
    chai.request(server)
      .delete('/api/v2/virtual-clusters/a')
      .set('Authorization', `Bearer ${userToken}`)
      .end((err, res) => {
        expect(res, 'status code').to.have.status(403);
        expect(res.body).to.have.property('code', 'ForbiddenUserError');
        done();
      });
  });

  it('[Negative] should not delete vc default', (done) => {
    nock.cleanAll();

    chai.request(server)
      .delete('/api/v2/virtual-clusters/default')
      .set('Authorization', 'Bearer adminToken') // token is not checked
      .end((err, res) => {
        expect(res, 'status code').to.have.status(403);
        expect(res.body).to.have.property('code', 'ForbiddenUserError');
        done();
      });
  });

  it('[Positive] shouldn\'t delete dedicated vc', (done) => {
    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .delete('/api/v2/virtual-clusters/dedicated_vc')
      .set('Authorization', `Bearer ${adminToken}`)
      .end((err, res) => {
        expect(res, 'status code').to.have.status(403);
        expect(res.body).to.have.property('code', 'ReadOnlyVcError');
        done();
      });
  });

  it('[Negative] should not delete a non-exist vc b', (done) => {
    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .delete('/api/v2/virtual-clusters/b')
      .set('Authorization', `Bearer ${adminToken}`)
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res.body).to.have.property('code', 'NoVirtualClusterError');
        done();
      });
  });

  it('[Negative] should not delete vc when jobs are running', (done) => {
    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .delete('/api/v2/virtual-clusters/c')
      .set('Authorization', `Bearer ${adminToken}`)
      .end((err, res) => {
        expect(res, 'status code').to.have.status(403);
        expect(res.body).to.have.property('code', 'RemoveRunningVcError');
        done();
      });
  });

  it('[Negative] should not delete a vc when stop queue successfully but fail to delete', (done) => {
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, yarnDefaultResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, clusterNodeResponse)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, yarnDefaultResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, clusterNodeResponse)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(200)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(403, 'Error in YARN when delete queue')
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(200);

    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .delete('/api/v2/virtual-clusters/a')
      .set('Authorization', `Bearer ${adminToken}`)
      .end((err, res) => {
        expect(res, 'status code').to.have.status(500);
        expect(res.body).to.have.property('code', 'UnknownError');
        expect(res.body).to.have.property('message', 'Error in YARN when delete queue');
        done();
      });
  });

  it('[Negative] Stop queue successfully but fail to delete, then fail to reactive it', (done) => {
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, yarnDefaultResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, clusterNodeResponse)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, yarnDefaultResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, clusterNodeResponse)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(200)
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(403, 'Error in YARN when delete queue')
      .put('/ws/v1/cluster/scheduler-conf')
      .reply(404, 'Error in YARN when reactive queue');

    const adminToken = nockUtils.registerAdminTokenCheck('admin');
    chai.request(server)
      .delete('/api/v2/virtual-clusters/a')
      .set('Authorization', `Bearer ${adminToken}`)
      .end((err, res) => {
        expect(res, 'status code').to.have.status(500);
        expect(res.body).to.have.property('code', 'UnknownError');
        expect(res.body).to.have.property('message', 'Error in YARN when reactive queue');
        done();
      });
  });
});
