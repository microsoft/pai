# Frequently Asked Questions

## Why my job has an unexpected retry number?

Generally speaking, there are 3 types of error in OpenPAI: transient error, permanent error, and unknown error. In jobs, transient error will be always retried, and permanent error will never be retried. If unknown error happens, PAI will retry the job according to the [retry policy](./how-to-use-advanced-job-settings.md#job-exit-spec-retry-policy-and-completion-policy) of the job, which is set by user.

If you don't set any [retry policy](./how-to-use-advanced-job-settings.md#job-exit-spec-retry-policy-and-completion-policy) but find the job has an unexpected retry number, it can be caused by some transient error, e.g. memory issues, disk pressure, or power failure of the node. Another kind of transient error is preemption. Jobs with higher priority can preempt jobs with lower priority. In OpenPAI's [job protocol](https://github.com/microsoft/openpai-protocol/blob/master/schemas/v2/schema.yaml), you can find a field named `jobPriorityClass`. It defines the priority of a job.