# Kubernetes benchmark

PAI runs on kubernetes, leveraging some Kubernetes and Docker features. This benchmark is for validating the Kubernetes and Docker, so it would fulfill PAI's requirements.

## Memory

- [ ] Validate master node fulfill the minimum requirements.
- [ ] Validate worker nodes fulfill the minimum requirements.

## CPU/GPU

- [ ] Validate master node fulfill the minimum requirements.
- [ ] Validate worker nodes fulfill the minimum requirements.

## Storage

- [ ] Check the docker graph directory capacity. It should not less than 100G. # TODO may adjust the value later
- [ ] Check the HDFS storage directory capacity.
- [ ] Check the YARN storage directory capacity.

## Log

- [ ] Whether log rotation enabled on Docker daemon?
- [ ] How long would the log retained?

## Metrics

List all the metrics PAI concerns, and validate PAI could collect each one.

## Alerting

List all the altering rules, and validate whether PAI could monitor and alter.

## Features

- [ ] Does it support RDMA?
