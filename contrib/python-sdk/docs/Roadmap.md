# Overview

## Release pace

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