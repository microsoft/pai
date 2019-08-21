# 1. Python binding

After installing the SDK, there is a package named `openpaisdk` that can be imported in python code. Here are some classes being frequently used.

```python
from openpaisdk.core import Client # OpenPAI client
from openpaisdk.job import Job # job description
from openpaisdk.command_line import Engine # command dispatcher
```

## 1.1. Dectect your execution environment

In your code, you may use `openpaisdk.core.in_job_container` to indicate where you are. This let you to do different things according to your environment.

```python
from openpaisdk.core import in_job_container
# help(in_job_container) for more details
if in_job_container():
    pass
else:
    pass
```

This function is implemented by checking whether some environmental variable (e.g. `PAI_CONTAINER_ID` is set to a non-empty value).

## 1.2. Do it in easy way

To unify the interface and simplifying user's learning cost, user can do whatever CLI provides in their python code in a similar way by calling `Engine`. For example, the following lines query all existing jobs submitted by current user in cluster named `your-alias`.

```python
from openpaisdk.command_line import Engine

job_name_list = Engine().process(['job', 'list', '--name', '-a', 'your-alias'])
```

The advantages of this way over using `os.system()` or `subprocess.check_call` lies in (a) avoid overheading and (b) get the structued result (no need to parsing the text output). And this way can guarantee the consistency between CLI and python binding.

## 1.3. Do it in a more pythoic way

Since someone may not like above solution, of course, user can use the code snippets behind CLI. Here is the code to do the same thing.

```python
from openpaisdk.core import Client
from openpaisdk import __cluster_config_file__

client, _ = Client.from_json(__cluster_config_file__, 'your-alias')
job_name_list = client.jobs(name_only=True)
```

## 1.4. Submit your working notebook running in local server

If you are working in your local `Jupyter` notebook, add below cell and execute it would submit a job. 

```python
from openpaisdk.notebook import submit_notebook
from openpaisdk.core import in_job_container
# help(submit_notebook) for more details
if not in_job_container():
    job_link = submit_notebook()
    print(job_link)
```
