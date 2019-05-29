# Release Plan

## Version 0.5.00 (June 2019)

For the preview release, we will provide a basic functions of the command line tools and python SDK for below scenarios

1. Command line

- [x] User can submit and query jobs
```bash
opai job list <job-name> [config/ssh/stdout/stderr]
opai job submit --config <job-config-file> (json or yaml)
```

- [x] User can submit a simple job with shortcut

```bash
opai job sub -i <docker-image> -w <workspace/path> -j <job-name> [--gpu 1] python a/b/c.py arg1 arg2 …
```

_Note: workspace is a HDFS path where codes and configurations can be uploaded to_

- [x] User can specify which cluster to interact with

```bash
opai cluster add -a <cluster-alias> --pai-uri http://x.x.x.x --user myuser  && opai cluster select <cluster-alias> && opai job list <job-name> [config/ssh/stdout/stderr]
opai cluster add -a <cluster-alias> --pai-uri http://x.x.x.x --user myuser && opai cluster select <cluster-alias> && opai job submit --config <job-config-file> (json or yaml)
```

- [x] User can access storage (only support hdfs for this release)

```bash
opai storage upload local_path remote_path
opai storage download remote_path local_path
opai storage list/status/delete remote_path
```

2. python binding (SDK)

- [x] User can describe a cluster with `openpaisdk.core.Cluster` class

```python
cluster = Cluster(pai_uri=xx, user=xx, ...)
cluster = Cluster.from_json(json_file)
```

- [x] the `Cluster` class has methods to query and submit jobs

```python
Cluster(...).list_jobs(job_name)
Cluster(...).submit(job_config)
```

- [x] the `Cluster` class has methods to access storage (through WebHDFS only for this version)

```python
Cluster(...).storage.upload/download(...)
```

- [x] User can describe a job with `openpaisdk.job.Job` class

```python
job = Job(...)
job.add_task(...)
Cluster(...).submit(job)
```

- [ ] the `Job` class is an implementation of v2 protocol

# Action items

### Version 0.3.01

- [x] add `Roadmap.md` to collect and record the release plan
- [x] add a script to run the notebook examples as integrated tests `python run_all_notebooks.py` in _examples_
- [x] add unit test for `cli_arguments.py`

# Backlogs

## Fundamental services

- [ ] update and delete (abort) of `opai job`
- [ ] update and delete of `opai task`
- [ ] update and delete of `opai require`
- [ ] query the output of a submitted job
- [ ] [Runtime] register files to be saved after job execution in container (upload to `<workspace>/jobs/<job-name>/output`)
- [ ] [Compatibility] be compatible with py3 (< 3.6)
    - [ ] move type hints into comments
    - [ ] Compatibility test

## Tests

### Unit tests

- [ ] add UT for important classes and functions

### Integrated tests

We use examples (mainly `Jupyter` notebook) as the integrated test.

- [x] [Installation and specify OpenPAI cluster information](examples/0-install-sdk-specify-openpai-cluster.ipynb)
- [x] [Submit and query job via command line interface from local environment](examples/1-submit-and-query-via-command-line.ipynb)
- [x] [Submit job from notebook running in local environment](examples/2-submit-job-from-local-notebook.ipynb)
- [ ] [Access data storage via CLI or code from local and job container]()
- [x] [Submit jobs with multiple taskroles](examples/1-submit-and-query-via-command-line.ipynb)
- [ ] [Runtime - fetch user stdout and stderr seperatedly]()
- [ ] [Runtime - debug experience enhancement]()