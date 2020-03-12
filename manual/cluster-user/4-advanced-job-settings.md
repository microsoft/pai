# Advanced Job Settings

## Retry Policy
### Job Example:
```yaml
name: demo-job
type: job
jobRetryCount: 2
taskRoles:
  demo-role:
    instances: 10
    taskRetryCount: 3
```

### Job RetryCount:

For Unknown failures, the job will be retried `jobRetryCount` times before failed.

For Transient failures, the job will be always retried.

For Permanent failures, the job will be never retried. 


### Task RetryCount:

For Unknown failures, the task will be retried `taskRetryCount` times before failed.

For Transient failures, the task will be always retried.

For Permanent failures, the task will be never retried.

### Ref:
https://github.com/microsoft/pai/blob/master/docs/job_tutorial.md
https://github.com/microsoft/frameworkcontroller/blob/master/doc/user-manual.md#retrypolicy

## Job Exit Spec
PAI can auto classify job failures, such as User/Platform failures, Transient/Permanent failures, etc.

### Ref:
https://github.com/microsoft/pai/blob/master/src/k8s-job-exit-spec/config/user-manual.md

## A Job Example with Multiple Task Roles

## Port Reservation, Environmental Variables, Parameters, and Secrets

## Reference

 - job protocol
