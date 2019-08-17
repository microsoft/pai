/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

/**
 * OpenPAI Job Status V1.
 */
export interface IJobStatusV1 {
    name: string;
    username: string;
    state: 'WAITING' | 'RUNNING' | 'SUCCEEDED' | 'STOPPED' | 'FAILED' | 'UNKNOWN';
    /** raw frameworkState from frameworklauncher */
    subState: 'FRAMEWORK_COMPLETED' | 'FRAMEWORK_WAITING';
    executionType: 'START' | 'STOP';
    retries: number;
    retryDetails: {
        /** Job failed due to user or unknown error. */
        user: number,
        /** Job failed due to platform error. */
        platform: number,
        /** Job cannot get required resource to run within timeout. */
        resource: number
    };
    createdTime: number;
    completedTime: number;
    virtualCluster: string;
    appExitCode: number;
    totalGpuNumber: number;
    totalTaskNumber: number;
    totalTaskRoleNumber: number;
}

/**
 * OpenPAI Job Config Protocol.
 */
export interface IJobConfig {
    /** Protocol version, current version is 2. */
    protocolVersion: string | number;
    name: string;
    /** Component type, should be "job" here. */
    type: string;
    /** Component version, Default is latest. */
    version?: string | number;
    contributor?: string;
    description?: string;

    /** Each item is the protocol for data, script, dockerimage, or output type. */
    prerequisites?: Array<{
        /** If omitted, follow the protocolVersion in root. */
        protocolVersion?: string | number;
        name: string;
        /** Component type. Must be one of the following: data, script, dockerimage, or output. Prerequisites.type cannot be "job". */
        type: string;
        /** Component version, Default is latest. */
        version?: string;
        contributor?: string;
        description?: string;
        /** Only available when the type is dockerimage. */
        auth?: {
            username?: string;
            /** If a password is needed, it should be referenced as a secret. */
            password?: string;
            registryuri?: string;
        };
        /** Only when the type is data can the uri be a list. */
        uri: string | string[];
    }>;

    /**
     * If specified, the whole parameters object can be referenced as `$parameters`.
     * Scope of reference `$parameters`: the reference is shared among all task roles.
     */
    parameters?: {
        /**
         * <param1>: value1
         * <param2>: value2
         * Specify name and value of all the referencable parameters that will be used in the whole job template.
         * Can be referenced by `<% $parameters.param1 %>`, `<% $parameters.param2 %>`.
         */
    };

    /**
     * If sensitive information including password or API key is needed in the protocol,
     * it should be specified here in secrets section and referenced as `$secrets`.
     * Scope of reference `$secrets`: the reference is shared among all task roles and docker image's `auth` field.
     * A system that supports PAI protocol should keep the secret information away from
     * unauthorized users (how to define unauthorized user is out of the scope of this protocol).
     * For example, the yaml file used for job cloning, the stdout/stderr should protect all information marked as secrets.
     */
    secrets?: {
        /**
         * <secret1>: password
         * <secret2>: key
         * Specify name and value of all secrets that will be used in the whole job template.
         * Can be referenced by `<% $secrets.secret1 %>`, `<% $secrets.secret2 %>`.
         */
    };

    /** Default is 0. */
    jobRetryCount?: number;

    /**
     * Task roles are different types of task in the protocol.
     * One job may have one or more task roles, each task role has one or more instances, and each instance runs inside one container.
     */
    taskRoles: {
        /** Name of the taskRole, string in ^[A-Za-z0-9\-._~]+$ format. */
        [name: string]: {
            /** Default is 1, instances of a taskRole, no less than 1. */
            instances?: number;
            /**
             * Completion poclicy for the job, https://
             * github.com/Microsoft/pai/blob/master/subprojects/frameworklauncher/yarn/doc/USERMANUAL.md#ApplicationCompletionPolicy.
             * Number of failed tasks to fail the entire job, null or no less than 1,
             * if set to null means the job will always succeed regardless any task failure.
             */
            completion?: {
                /**
                 * Number of failed tasks to fail the entire job, null or no less than 1,
                 * if set to null means the job will always succeed regardless any task failure.
                 * Default is 1.
                 */
                minFailedInstances?: number | string;
                /**
                 * Number of succeeded tasks to succeed the entire job, null or no less than 1,
                 * if set to null means the job will only succeed until all tasks are completed and minFailedInstances is not triggered.
                 * Default is null.
                 */
                minSucceededInstances?: number | string;
            };
            /** Default is 0. */
            taskRetryCount?: number;
            /** Should reference to a dockerimage defined in prerequisites. */
            dockerImage: string;
            /**
             * Scope of the reference `$data`, `$output`, `$script`: the reference is only valid inside this task role.
             * User cannot reference them from another task role. Reference for `$parameters` is global and shared among task roles.
             */
            /** Select data defined in prerequisites, target can be referenced as `$data` in this task role. */
            data?: string;
            /** Select output defined in prerequisites, target can be referenced as `$output` in this task role. */
            output?: string;
            /** Select script defined in prerequisites, target can be referenced as `$script` in this task role. */
            script?: string;

            extraContainerOptions?: {
                /** Config the /dev/shm in a docker container, https://docs.docker.com/compose/compose-file/#shm_size. */
                shmMB?: number;
            };

            resourcePerInstance: {
                /** CPU number, unit is CPU vcore. */
                cpu: number;
                /** Memory number, unit is MB. */
                memoryMB: number;
                gpu: number;
                ports?: {
                    /** Port number for the port label. Only for host network, portLabel string in ^[A-Za-z0-9\-._~]+$ format. */
                    [portLabel: string]: number;
                }
            };

            commands: string[];
        }
    };

    /**
     * To handle that a component may interact with different component differently,
     * user is encouraged to place the codes handling such difference in the "deployments" field,
     * e.g., a job may get input data through wget, hdfc -dfs cp, copy, or just directly read from remote storage.
     * This logic can be placed here.
     * In summary, the deployments field is responsible to make sure the job to run properly in a deployment specific runtime environment.
     * One could have many deployments, but only one deployment can be activated at runtime by specifying in "defaults".
     * User can choose the deployment and specify in "defaults" at submission time.
     */
    deployments?: Array<{
        name: string;
        taskRoles: {
            /** Should be in taskRoles. */
            [name: string]: {
                /** Execute before the taskRole's command. */
                preCommands: string[];
                /** Execute after the taskRole's command. */
                postCommands: string[];
            }
        }
    }>;

    /** Optional, default cluster specific settings. */
    defaults?: {
        virtualCluster?: string;
        /** Should reference to deployment defined in deployments */
        deployment?: string;
    };

    /** Optional, extra field, object, save any information that plugin may use. */
    extras?: {
        submitFrom?: string;
    };
}