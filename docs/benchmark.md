# The PAI benchmark

This benchmark is for measuring PAI API, capability, performance, stability and etc.

The benchmark runs on PAI as a normal job, consistents of many metric jobs. All metric jobs could be run separatly as needed.

## API & Protocol

Fully test and demostrate API & Protocol, report the supported protocols.

- User APIs
- Job APIs
- Metric APIs

## Capability and Limitations

Consistent of bunch of extrame jobs which would push PAI into crash, try to figure out the limitation.

- Memory stress
- Disk stress
- Massive count of jobs, test the scheduler

## Job Performance

- Stand training task, stand dataset, measuring the performance overhead of PAI.
- Horizontal scale distribute training task, measuring the scale factor.

## Longterm stability

Long run job with heavy load, watch:

- Job stablility (job retry)
- PAI stablility (service restart)
- Metrics (Both PAI and Job)
