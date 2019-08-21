# 1. _ToDiscuss_ Python SDK as a runtime

When submitting a job through the SDK (CLI or python binding), the SDK would be isntalled inside the job container automatically by default (turn off by adding `--disable-sdk-install` in `job create`).  

## 1.1. Reconstruct the client in job container

The SDK has passed necessary information to job container through the `__clusters__` and `__defaults__` items of the `extras` part in job config file, and the `runtime` command will save them to `~/.openpai/clusters.json` and `.opanpai/defaults.json` respectively.

## 1.2. User can customize callbacks before or after the command executation

This is similar to the pre- or post- commands in protocol v2. 

## 1.3. User can customize callbacks when exception raised

This is for debugging.

## 1.4. Implementation

An ideal implementation is SDK provides some decorators for registering callbacks. Here is an example. 

```python
# original codes
...

def main(args):
    ...

if __name__ == "__main__":
    ...
    result = main(args)
    ...
```

After customizing callbacks, it may look like

```python
# for openpai

from openpai.runtime import Runtime

app = Runtime.from_env()

@app.on('start')
def pre_commands(...): # if not defined, use that generated from job config
    ...

@app.on('end')
def post_commands(...): # if not defined, use that generated from job config
    ...

@app.on('main')
def main(args):
    ...

if __name__ == "__main__":
    ...
    result = app.run(args)
    ...

```

_Note: the RunTime may only be triggered when in_job_container() is true, or some user-defined conditions_
